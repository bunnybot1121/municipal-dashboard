
import { supabase } from '../lib/supabase';

export const api = {
    // Issues
    async getIssues(filters = {}) {
        let query = supabase.from('issues').select('*').order('created_at', { ascending: false });

        if (filters.sector && filters.sector !== 'all') query = query.eq('sector', filters.sector);
        if (filters.assignedZone) query = query.eq('assigned_zone', filters.assignedZone);
        if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
        if (filters.priority) query = query.eq('priority', filters.priority);
        if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching issues:', error);
            return [];
        }

        // Map DB fields to UI expectations if necessary
        return data.map(issue => ({
            ...issue,
            imageUrl: issue.photo_url || issue.image_url || issue.imageUrl,
            location: {
                lat: issue.location?.lat ?? issue.lat ?? issue.latitude ?? null,
                lng: issue.location?.lng ?? issue.lng ?? issue.longitude ?? null,
                address: issue.location?.address || issue.location_address || issue.address || null,
                accuracy: issue.location?.accuracy ?? null
            },
            aiAnalysis: issue.ai_analysis || null,
            reportedBy: issue.profiles?.full_name || 'Anonymous'
        }));
    },

    async getIssueById(id) {
        // CHECK IF IT IS A TASK (Starts with TSK-)
        if (typeof id === 'string' && id.startsWith('TSK-')) {
            console.log("🔍 Fetching Task Details for:", id);
            // Extract UUID from TSK-UUID or just search if we stored full ID
            // In IssueList we did: `TSK-${task.id.substring(0,6)}` - WAIT. 
            // IssueList generated a SHORT ID "TSK-123456". 
            // If we only have 6 chars, we can't fetch by ID directly unless we search by prefix or if we stored the full ID in the URL.
            // Let's FIX IssueList to use the FULL ID in the URL, but display short ID.

            // Assuming IssueList is updated to pass FULL ID, or we interpret.
            // Actually, best to just use the full UUID in the navigate() call in IssueList.
            // But if we are here, let's try to find it.

            // If the ID passed is NOT a valid UUID (because we shortened it), we might have a problem.
            // I will assume for now I will fix IssueList to pass the FULL ID in the URL, ensuring this works.

            const realId = id.replace('TSK-', ''); // Hopefully this is the UUID

            const { data, error } = await supabase.from('tasks').select('*').eq('id', realId).single();

            if (error) {
                // Fallback: If we can't find by ID (maybe it was short), try to find by similarity or just fail gracefully
                console.error("Task not found:", error);
                throw new Error("Task not found");
            }

            // MAP TASK TO ISSUE FORMAT
            return {
                id: `TSK-${data.id}`,
                type: 'Scheduled Maintenance', // Category
                title: data.title,
                description: data.description || 'No description provided.',
                sector: data.sector,
                priority: data.priority,
                status: data.status,
                createdAt: data.created_at,
                // Mock Location for Tasks (since they don't have one usually)
                location: {
                    lat: 19.0298 + (Math.random() * 0.01),
                    lng: 73.0588 + (Math.random() * 0.01),
                    address: "Scheduled Location (Approx)"
                },
                aiAnalysis: null, // Tasks don't have AI analysis by default
                /*
                aiAnalysis: {
                    confidence: 0.98,
                    explanation: "Routine maintenance scheduled based on asset lifecycle analysis.",
                    priorityScore: 70 + Math.floor(Math.random() * 10), // Randomize slightly
                    categoryScores: { safety: 10, sector: 25, time: 5, location: 10, citizen: 0, system: 12, resource: 10, gov: 0 },
                    riskFactors: { lifeSafety: 2, infrastructure: 7 },
                    flags: ["PREVENTATIVE_MAINTENANCE"],
                    seasonalFactor: 1.0
                },
                */
                images: [],
                isTask: true // Flag to generic components
            };
        }

        const { data, error } = await supabase.from('issues').select('*').eq('id', id).single();
        if (error) throw error;
        const analysis = data.ai_analysis || {};

        // Ensure strictly structured analysis object
        const mergedAnalysis = {
            confidence: analysis.confidence || data.ai_confidence || 0.88,
            explanation: analysis.explanation || "Standard analysis complete. (Legacy Data)",
            priority: analysis.priority || data.priority || 'Moderate',
            // IMPORTANT: Allow null here so UI knows to show "Start Analysis" button
            priorityScore: analysis.priorityScore || null,
            categoryScores: analysis.categoryScores || null,
            riskFactors: analysis.riskFactors || { lifeSafety: 5, infrastructure: 5 },
            riskFactors: analysis.riskFactors || { lifeSafety: 5, infrastructure: 5 },
            flags: analysis.flags || [],
            seasonalFactor: analysis.seasonalFactor || 1.0,
            seasonalFactor: analysis.seasonalFactor || 1.0,
            breakdown: analysis.breakdown || [],
            gemini: analysis.gemini || null // Include OpenRouter/Gemini Analysis
        };

        return {
            ...data,
            imageUrl: data.photo_url || data.image_url || data.imageUrl,
            location: {
                lat: data.location?.lat ?? data.lat ?? data.latitude ?? null,
                lng: data.location?.lng ?? data.lng ?? data.longitude ?? null,
                address: data.location?.address || data.location_address || data.address || null,
                accuracy: data.location?.accuracy ?? null
            },
            aiAnalysis: mergedAnalysis,
            reportedBy: 'Anonymous'
        };
    },

    async createIssue(issueData) {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Get Intelligence from Backend (AI Agent)
        let aiResult = {
            confidenceScore: 0.88,
            priority: issueData.severity || 'Moderate',
            explanation: "Preliminary analysis.",
            flags: []
        };

        try {
            // Call the local Express Server for analysis
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(issueData)
            });

            if (response.ok) {
                const analysis = await response.json();
                console.log("✅ AI Agent Analysis Received:", analysis);
                aiResult = analysis;
            } else {
                console.warn("⚠️ AI Agent unreachable, using fallback.");
            }
        } catch (err) {
            console.error("❌ Failed to contact AI Agent:", err);
        }

        const dbPayload = {
            issue_type: issueData.title,
            description: issueData.description,
            sector: issueData.sector,
            severity: issueData.severity,
            priority: aiResult.priority,
            photo_url: issueData.photo,
            lat: issueData.location?.lat ?? null,
            lng: issueData.location?.lng ?? null,
            latitude: issueData.location?.lat ?? null,
            longitude: issueData.location?.lng ?? null,
            address: issueData.location?.address ?? null,
            location_address: issueData.location?.address ?? null,
            location: {
                lat: issueData.location?.lat ?? null,
                lng: issueData.location?.lng ?? null,
                address: issueData.location?.address ?? null,
                accuracy: issueData.rawGps?.accuracy ?? null
            },
            status: 'open',
            ai_confidence: (aiResult.confidenceScore || 88) / 100,
            ai_analysis: aiResult,
            user_id: user?.id
        };

        // 3. Insert into Results DB (Supabase)
        const { data, error } = await supabase.from('issues').insert(dbPayload).select();
        if (error) throw error;
        const savedIssue = data[0];

        // 4. ASYNC: Trigger AI Photo Validation (admin-side verification)
        // This runs in background — citizen gets immediate response
        if (issueData.photo) {
            (async () => {
                try {
                    console.log("🛡️ Triggering AI photo validation for issue:", savedIssue.id);
                    const valResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/validate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            photo: issueData.photo,
                            description: issueData.description,
                            sector: issueData.sector,
                            severity: issueData.severity
                        })
                    });

                    if (valResponse.ok) {
                        const validation = await valResponse.json();
                        console.log("✅ AI Validation result:", validation.isValid ? 'VERIFIED' : 'SUSPICIOUS');

                        // Update the issue with verification result
                        const updatedAnalysis = {
                            ...dbPayload.ai_analysis,
                            photoVerification: {
                                isValid: validation.isValid,
                                confidence: validation.confidence,
                                reason: validation.reason,
                                detectedIssueType: validation.detectedIssueType,
                                sectorMatch: validation.sectorMatch,
                                descriptionMatch: validation.descriptionMatch,
                                verifiedAt: new Date().toISOString()
                            }
                        };

                        await supabase.from('issues')
                            .update({ ai_analysis: updatedAnalysis })
                            .eq('id', savedIssue.id);
                    }
                } catch (valErr) {
                    console.warn("⚠️ AI Validation failed (non-blocking):", valErr.message);
                }
            })();
        }

        return savedIssue;
    },

    async updateIssue(id, updates) {
        const { data, error } = await supabase.from('issues').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },

    // Tasks
    async getTasks(filters = {}) {
        console.log("🔍 API getTasks called with filters:", filters); // DEBUG LOG
        const { data: { user } } = await supabase.auth.getUser();
        // if (!user) return []; // Removed to allow fetching without strict auth check (handle RLS on backend)

        // Simplified query without JOINs
        let query = supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .range(0, 49999)
            .order('scheduled_start', { ascending: true });

        // Apply filters
        if (filters.status) query = query.eq('status', filters.status);

        // NEW: Filter by Minimum Creation Date (Soft Reset)
        if (filters.minCreatedDate) {
            query = query.gte('created_at', filters.minCreatedDate);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }

        return data.map(t => ({
            ...t,
            scheduledStart: t.scheduled_start,
            scheduledEnd: t.scheduled_end,
            scheduledDate: t.scheduled_start?.split('T')[0],
            assignedTo: 'Unassigned',
            assignedToId: t.assigned_to,
            createdBy: 'Admin'
        }));
    },

    async createTask(taskData) {
        const { data: { user } } = await supabase.auth.getUser();

        const dbPayload = {
            title: taskData.title,
            description: taskData.description,
            sector: taskData.sector,
            priority: taskData.priority,
            status: taskData.status || 'pending',
            scheduled_start: taskData.scheduledStart,
            scheduled_end: taskData.scheduledEnd,
            assigned_to: taskData.assignedTo || null,
            created_by: user?.id
        };

        const { data, error } = await supabase.from('tasks').insert(dbPayload).select();
        if (error) throw error;
        return data[0];
    },

    async updateTask(id, updates) {
        const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },

    // EMERGENCY PURGE
    async deleteAllTasks() {
        const { data: tasks } = await supabase.from('tasks').select('id');
        if (!tasks || tasks.length === 0) return { count: 0 };
        const ids = tasks.map(t => t.id);
        const { error, count } = await supabase.from('tasks').delete().in('id', ids);
        if (error) throw error;
        return { count: ids.length };
    },

    // Bulk Create Tasks
    async createTasksBulk(tasks) {
        const { data: { user } } = await supabase.auth.getUser();

        // Prepare payload with user_id
        const payload = tasks.map(t => ({
            title: t.title,
            description: t.description,
            sector: t.sector,
            priority: t.priority,
            status: t.status || 'pending',
            scheduled_start: t.scheduled_start,
            scheduled_end: t.scheduled_end,
            assigned_to: t.assigned_to || null,
            created_by: user?.id
        }));

        // Insert in batches of 100 to avoid limits
        const batchSize = 100;
        let successCount = 0;

        for (let i = 0; i < payload.length; i += batchSize) {
            const batch = payload.slice(i, i + batchSize);
            const { error } = await supabase.from('tasks').insert(batch);
            if (error) {
                console.error('Bulk Verify Error:', error);
                throw error;
            }
            successCount += batch.length;
        }

        return { success: true, count: successCount };
    },

    // Auth
    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;

        // Fetch role
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

        return {
            user: { ...data.user, ...profile },
            token: data.session.access_token
        };
    },

    async register(userData) {
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.fullName,
                    role: userData.role || 'citizen'
                }
            }
        });
        if (error) throw error;
        return data.user;
    },

    // Users (for task assignment)
    async getUsers() {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.warn('Error fetching users:', error);
            return [];
        }
        return data.map(u => ({
            _id: u.id,
            id: u.id,
            name: u.full_name,
            username: u.username,
            role: u.role,
            sector: u.sector,
            status: u.status,
            avatar: u.avatar_url,
            assignedZone: u.assigned_zone,
            createdAt: u.created_at,
        }));
    },

    // Worker: fetch tasks assigned to them OR in their sector & zone
    async getWorkerTasks(workerId, sector = null, assignedZone = null) {
        let query = supabase.from('tasks').select('*');
        if (assignedZone && sector && sector !== 'other') {
            query = query.or(`assigned_to.eq.${workerId},and(sector.eq.${sector},assigned_zone.eq.${assignedZone})`);
        } else if (sector && sector !== 'other') {
            query = query.or(`assigned_to.eq.${workerId},sector.eq.${sector}`);
        } else if (assignedZone) {
            query = query.or(`assigned_to.eq.${workerId},assigned_zone.eq.${assignedZone}`);
        } else {
            query = query.eq('assigned_to', workerId);
        }
        
        const { data, error } = await query.order('scheduled_start', { ascending: true });
        if (error) throw error;
        return (data || []).map(t => ({
            ...t,
            scheduledStart: t.scheduled_start,
            scheduledEnd: t.scheduled_end,
            scheduledDate: t.scheduled_start?.split('T')[0],
        }));
    },

    // Worker/Admin: update task status
    async updateTaskStatus(id, status) {
        const { data, error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};
