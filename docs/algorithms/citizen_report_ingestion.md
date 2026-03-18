# Citizen Report Ingestion Architecture
## Algorithm & Data Flow Documentation

**File Reference**: `src/services/apiClient.js` (`createIssue` method) & Express AI Agent (`/api/analyze`, `/api/validate`)

### Overview
When a citizen submits a new maintenance issue (e.g., via a mobile app or public portal), the system does not simply dump it into the database. Instead, it routes the payload through a sophisticated **Two-Step AI Agent Pipeline** to automatically triage, score, and verify the physical evidence before human operators even see it.

### Step 1: Synchronous AI Triage (`/api/analyze`)
Before saving the issue to the database, the system must determine its baseline priority to prevent critical emergencies from being buried in the queue.

1. **Agent Handoff**: The raw data (Title, Description, Sector, Location) is immediately POSTed to the local AI Agent (`http://localhost:5001/api/analyze`).
2. **Evaluation**: The AI evaluates the textual context against the **145-Signal Priority Engine** (documented separately).
3. **Payload Synthesis**: The AI returns a structured JSON containing a `confidenceScore`, an `explanation` (e.g., "Predicted water main burst. High risk of flooding."), and an escalated `priority` tier.
4. **Database Insertion**: The frontend merges this AI Intelligence with the raw citizen data, building a comprehensive database payload. It then executes a `supabase.from('issues').insert()` command. 
   - *Result*: The issue is now instantly visible on the Municipal Dashboard with a preliminary Priority Badge.

### Step 2: Asynchronous Photo Verification (`/api/validate`)
Citizen-submitted photos are often blurry, unrelated, or fraudulent. Because image analysis is computationally expensive, it is decoupled to prevent blocking the citizen's immediate "Success" screen.

1. **Non-Blocking Trigger**: Immediately after the Supabase insert succeeds, the system checks if a `photo_url` exists. If true, an asynchronous, detached IIFE (Immediately Invoked Function Expression) is fired.
2. **Vision Agent Handoff**: The base64 photo or URL, along with the description, is POSTed to the Vision AI endpoint (`/api/validate`).
3. **Fraud & Relevance Check**: The Vision Model cross-references the image pixels against the claimed description. (e.g., Does the image actually contain a "Pothole"? Is it just a stock photo? Is it too dark?).
4. **Late-Arriving Update**: Once the Vision AI yields a verdict, the system executes a silent `Supabase UPDATE` command specifically targeting the `ai_analysis.photoVerification` JSON field.
5. **Dashboard Manifestation**: The Dashboard UI dynamically updates via Supabase Real-Time webhooks, swapping the photo status from a grey "⏳ Pending" to either a green "✅ Verified" or a red "⚠️ Suspicious" based on the `isValid` boolean returned by the model.
