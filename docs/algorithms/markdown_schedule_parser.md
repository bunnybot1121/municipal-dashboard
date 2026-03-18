# Markdown (.md) Schedule Parser
## Algorithm Documentation

**File Reference**: `src/utils/scheduleParser.js` & `src/pages/ScheduleUploadPage.jsx`

### Overview
The system allows bulk-uploading of Municipal Maintenance schedules via simple `.md` (Markdown) or `.txt` files. This bridges the gap between raw, human-readable text documents (often created by offline administrators) and the structured database schema required for the `TaskScheduler`.

### Parsing Algorithm Workflow

1. **File Reading & Text Normalization**
   * The parser utilizes the browser's `FileReader` API to instantly convert the uploaded `.md` file blob into a raw string.
   * It splits the document line by line (`text.split('\n')`), sweeping the document sequentially.

2. **State Machine Extraction**
   * The parser operates as a lightweight state machine. As it iterates line by line, it tracks the *Current Month* and *Current Day* from markdown headers.
   * **Month Detection**: Matches `**January**` or `# February`. When found, it updates `currentMonth`.
   * **Date Detection**: Matches `**12th**` or `## 14`. When found, it extracts numerical digits to update `currentDay` and synthesizes an ISO valid `scheduledStart` Date object (aligning with the current year).
   * **Task Detection**: Matches list items (e.g., `- [Roads] Fix potholes` or `* Water: Clean drain`).

3. **Heuristic Data Synthesis**
   * Once a Task line is hit, the engine splits the string to deduce properties:
   * **Department/Sector**: It extracts keywords preceding a colon (`Water:`) or inside brackets (`[Power]`).
   * **Priority**: Defaults to "Medium/P3". However, it heuristically scans the description. If it sees "URGENT" or "!" it flags it as `high`.
   * **Task Type & ID**: Synthesizes a unique UUID and a generic `task_type` (`routine_maintenance`).

### Department-Role Isolation & Interception
In the latest framework update, the system tightly governs permissions by enforcing "Department Sandboxes."

When an uploaded schedule touches `ScheduleUploadPage.jsx`:
1. The `useAuth()` hook fetches the exact `isDepartment` flag and `department` string (e.g., "Water") belonging to the currently authenticated user.
2. The `.md` file is fully parsed returning the raw array of tasks.
3. **The Interception Rule**: If the logged-in user is a Department user, **an array map function overrides the synthesized sector of every single task** to strictly align with the user's Department ID.
4. This ensures that even if a Water Department user accidentally uploads a file mentioning "Roads", the system logically sandboxes those entries into the "Water" database partition. They will only ever display on the Water Dashboard.

### Upload to Supabase 
Finally, the array of structured JSON task objects is processed, batched, and sequentially inserted into the `tasks` table via Supabase's `upsert` API, successfully manifesting in real-time on the `TaskScheduler` UI. 
