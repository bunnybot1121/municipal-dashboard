import { chromium } from 'playwright';

(async () => {
    console.log('Starting Dashboard Diagnosis (Playwright)...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 1. Capture Logs & Errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[BROWSER ERROR] ${msg.text()}`);
        }
    });

    page.on('pageerror', err => {
        console.log(`[PAGE CRASH] ${err.message}`);
    });

    try {
        // Authenticate
        await page.addInitScript(() => {
            localStorage.setItem('user', JSON.stringify({ name: 'Admin', role: 'admin' }));
        });

        const url = 'http://localhost:5173/municipal-dashboard/';
        console.log(`Navigating to ${url}...`);

        await page.goto(url, { waitUntil: 'networkidle' });

        // 2. Check for Map & Alerts
        const mapVisible = await page.isVisible('.cc-map-container');
        console.log(`Map Visible: ${mapVisible}`);

        const alertsVisible = await page.isVisible('.cc-emergency-section');
        console.log(`Emergency Section Visible: ${alertsVisible}`);

        const title = await page.title();
        console.log(`Page Title: ${title}`);

    } catch (error) {
        console.error('Diagnosis Script Error:', error);
    } finally {
        await browser.close();
    }
})();
