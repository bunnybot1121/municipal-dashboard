/**
 * Sensor Service — fast IoT data fetching via direct REST
 *
 * Actual DB schema (confirmed 2026-02-20):
 *   gas_readings:        id, device_id, gas_raw, gas_voltage, estimated_ppm, estimated_aqi, created_at
 *   ultrasonic_readings: id, device_id, distance_cm, water_level_percent, created_at
 *
 * Optimisations:
 *   • Direct fetch() REST calls (no Supabase JS overhead)
 *   • 5-second AbortController timeout
 *   • Only 2 rows fetched per table
 *   • 30-second in-memory cache
 *   • Both tables fetched in parallel
 */

import { createClient } from '@supabase/supabase-js';

// ── Credentials — vavhhjsxqynqcyyyzfkl (IoT sensor project) ───
const SENSOR_URL = 'https://vavhhjsxqynqcyyyzfkl.supabase.co';
const SENSOR_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdmhoanN4cXlucWN5eXl6ZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDE1MjUsImV4cCI6MjA4NzE3NzUyNX0.tOdw7TA87JIu6K4nogX2DJTK5g4Zm3tUYGbmra9IS5Q';

// Lazy Supabase client — only for real-time subscriptions
let _realtimeClient = null;
function getRealtimeClient() {
    if (!_realtimeClient) _realtimeClient = createClient(SENSOR_URL, SENSOR_KEY);
    return _realtimeClient;
}

// ── REST helper with 5s timeout ────────────────────────────────
const REST_HEADERS = {
    'apikey': SENSOR_KEY,
    'Authorization': `Bearer ${SENSOR_KEY}`,
    'Accept': 'application/json',
};

async function restFetch(table, limit = 2) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const url = `${SENSOR_URL}/rest/v1/${table}?select=*&order=created_at.desc&limit=${limit}`;
    try {
        const res = await fetch(url, { headers: REST_HEADERS, signal: controller.signal });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    } catch (err) {
        if (err.name === 'AbortError') throw new Error(`Timeout: ${table}`);
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

// ── 30-second in-memory cache ──────────────────────────────────
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 30_000;

// ── Shared helper ──────────────────────────────────────────────
function timeAgo(ts) {
    const m = Math.floor((Date.now() - new Date(ts)) / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ── Gas sensor ─────────────────────────────────────────────────
// Columns: gas_raw, gas_voltage, estimated_ppm, estimated_aqi

function gasStatus(ppm) {
    if (ppm >= 1000) return 'critical';
    if (ppm >= 300) return 'warning';
    return 'normal';
}

function gasTrend(rows) {
    if (rows.length < 2) return 'stable';
    const a = rows[0].estimated_ppm ?? rows[0].gas_raw ?? 0;
    const b = rows[1].estimated_ppm ?? rows[1].gas_raw ?? 0;
    if (a - b > 50) return 'rising';
    if (a - b < -50) return 'falling';
    return 'stable';
}

function formatGas(rows) {
    if (!rows?.length) return [];
    const r = rows[0];
    const ppm = r.estimated_ppm ?? r.gas_raw ?? 0;
    return [{
        id: `GAS-${r.id}`,
        type: 'gas',
        sector: 'air_quality',
        label: 'Gas Sensor',
        value: Math.round(ppm * 10) / 10,
        unit: 'PPM',
        aqi: r.estimated_aqi ?? null,
        gasRaw: r.gas_raw ?? null,
        gasVoltage: r.gas_voltage ?? null,
        range: { min: 0, max: 1000 },
        status: gasStatus(ppm),
        trend: gasTrend(rows),
        lastUpdated: timeAgo(r.created_at),
        rawTimestamp: r.created_at,
        location: { lat: 19.0760, lng: 72.8777, address: 'IoT Station' },
        sensorValue: r.gas_raw ?? ppm,
    }];
}

// ── Ultrasonic sensor ──────────────────────────────────────────
// Columns: distance_cm, water_level_percent

function ultraStatus(cm) {
    if (cm < 10) return 'critical';
    if (cm < 25) return 'warning';
    return 'normal';
}

function ultraTrend(rows) {
    if (rows.length < 2) return 'stable';
    const d = rows[0].distance_cm - rows[1].distance_cm;
    if (d > 10) return 'rising';
    if (d < -10) return 'falling';
    return 'stable';
}

function formatUltrasonic(rows) {
    if (!rows?.length) return [];
    const r = rows[0];
    const cm = r.distance_cm ?? 0;
    // Use DB-computed water_level_percent directly
    const pct = r.water_level_percent ?? Math.min(100, Math.round(Math.max(0, 100 - cm)));
    return [{
        id: `ULTRA-${r.id}`,
        type: 'ultrasonic',
        sector: 'waste_management',
        label: 'Ultrasonic Sensor',
        value: Math.round(cm * 10) / 10,
        unit: 'cm',
        fillPercent: Math.round(pct),
        range: { min: 0, max: 400 },
        status: ultraStatus(cm),
        trend: ultraTrend(rows),
        lastUpdated: timeAgo(r.created_at),
        rawTimestamp: r.created_at,
        location: { lat: 19.0760, lng: 72.8777, address: 'IoT Station' },
        sensorValue: cm,
    }];
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Main Dashboard function — fetches both sensors in parallel with caching.
 */
export async function fetchSensorReadings() {
    if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) {
        return [..._cache.gas, ..._cache.ultra];
    }

    const [gasResult, ultraResult] = await Promise.allSettled([
        restFetch('gas_readings', 2),
        restFetch('ultrasonic_readings', 2),
    ]);

    if (gasResult.status === 'rejected') console.error('❌ Gas sensor:', gasResult.reason?.message);
    if (ultraResult.status === 'rejected') console.error('❌ Ultrasonic:', ultraResult.reason?.message);

    const gas = formatGas(gasResult.status === 'fulfilled' ? gasResult.value : []);
    const ultra = formatUltrasonic(ultraResult.status === 'fulfilled' ? ultraResult.value : []);

    if (gas.length || ultra.length) {
        _cache = { gas, ultra };
        _cacheTime = Date.now();
    }

    return [...gas, ...ultra];
}

export async function fetchGasSensorReadings() { return formatGas(await restFetch('gas_readings', 2)); }
export async function fetchUltrasonicSensorReadings() { return formatUltrasonic(await restFetch('ultrasonic_readings', 2)); }

export async function fetchSensorHistory(limit = 50) {
    try { return (await restFetch('gas_readings', limit)).reverse(); } catch { return []; }
}
export async function fetchUltrasonicHistory(limit = 50) {
    try { return (await restFetch('ultrasonic_readings', limit)).reverse(); } catch { return []; }
}

/**
 * Real-time subscriptions — busts cache on INSERT.
 */
export function subscribeSensorUpdates(callback) {
    const client = getRealtimeClient();

    const gasChannel = client
        .channel('gas_rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gas_readings' }, ({ new: r }) => {
            _cache = null;
            const ppm = r.estimated_ppm ?? r.gas_raw ?? 0;
            callback({
                id: `GAS-${r.id}`, type: 'gas', sector: 'air_quality',
                label: 'Gas Sensor',
                value: Math.round(ppm * 10) / 10,
                unit: 'PPM',
                aqi: r.estimated_aqi ?? null,
                gasRaw: r.gas_raw ?? null,
                gasVoltage: r.gas_voltage ?? null,
                range: { min: 0, max: 1000 },
                status: gasStatus(ppm), trend: 'stable',
                lastUpdated: 'Just now', rawTimestamp: r.created_at,
                location: { lat: 19.0760, lng: 72.8777, address: 'IoT Station' },
                sensorValue: r.gas_raw ?? ppm,
            });
        })
        .subscribe();

    const ultraChannel = client
        .channel('ultra_rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ultrasonic_readings' }, ({ new: r }) => {
            _cache = null;
            const cm = r.distance_cm ?? 0;
            const pct = r.water_level_percent ?? Math.min(100, Math.round(Math.max(0, 100 - cm)));
            callback({
                id: `ULTRA-${r.id}`, type: 'ultrasonic', sector: 'waste_management',
                label: 'Ultrasonic Sensor',
                value: Math.round(cm * 10) / 10,
                unit: 'cm', fillPercent: Math.round(pct), range: { min: 0, max: 400 },
                status: ultraStatus(cm), trend: 'stable',
                lastUpdated: 'Just now', rawTimestamp: r.created_at,
                location: { lat: 19.0760, lng: 72.8777, address: 'IoT Station' },
                sensorValue: cm,
            });
        })
        .subscribe();

    return () => {
        client.removeChannel(gasChannel);
        client.removeChannel(ultraChannel);
    };
}
