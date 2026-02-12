---
description: Full-System Debugging, Validation & Optimization for Nagarsevak AI
---

This customization instructs Antigravity to perform a comprehensive, end-to-end debugging and optimization pass on the existing project “Nagarsevak AI – Municipal Maintenance Scheduler.” The objective is not to add new features, redesign UI, or alter system architecture, but to verify correctness, stability, performance, and conceptual alignment across the entire codebase.

The system already includes a separated Admin Dashboard, Staff workflow, a standalone Citizen GPS Map Camera page, seasonal maintenance logic, and server-side Evidence Consistency Validation. This debug phase focuses on identifying logical mismatches, unintended coupling between modules, routing errors, performance bottlenecks, edge cases (especially GPS accuracy handling), data integrity issues, and violations of intended responsibility boundaries.

Antigravity must manually inspect frontend behavior, backend execution flow, database interactions, API contracts, and runtime states to ensure that each module does only what it is supposed to do. Any issues discovered should be clearly reported with cause, impact, and minimal corrective suggestions.

The goal is to stabilize the system, eliminate hidden bugs, improve reliability under real-world conditions (e.g., weak GPS, slow networks), and ensure the project is demo-ready, judge-ready, and production-safe, without scope creep or architectural drift.

✅ 2️⃣ CONTEXT (DETAILED – FOR ANTIGRAVITY DEBUG MODE)

⚠️ Paste everything below into the “Context” section

PROJECT OVERVIEW

Project Name: Nagarsevak AI – Municipal Maintenance Scheduler

Nagarsevak AI is a unified municipal operations platform designed to improve how civic issues are reported, verified, prioritized, scheduled, and resolved. The system emphasizes clarity of responsibility, evidence-based decision-making, and real-world usability rather than theoretical AI features.

The project has evolved through multiple iterations and now contains clearly separated functional domains that must remain isolated.

SYSTEM MODULES (CURRENT STATE)
1. Admin Dashboard

Used by municipal administrators

Contains:

Issue overview

Sector breakdowns

Calendar & scheduling

Seasonal impact visibility

Evidence consistency results (read-only)

Must NOT contain:

Camera access

GPS capture

Citizen-facing UI

2. Staff Workflow

Used by field and maintenance staff

Focused on:

Task assignments

Status updates

Inspections

No citizen capture logic allowed

3. Citizen Reporting Page (Standalone)

A separate web page, not embedded in admin UI

Accessed via:

Direct URL

QR code

Purpose:

Capture photo using device camera

Fetch live GPS location

Overlay address, latitude, longitude, timestamp, and accuracy directly onto the image

Submit evidence to backend

Citizens do NOT:

Log in

Choose map pins

See AI scores

See dashboards

4. Backend Server

Receives citizen submissions

Applies:

Seasonal maintenance logic

Evidence Consistency Validation

Stores:

Raw GPS

Accuracy

Overlayed image

Consistency results

5. Evidence Consistency Validation (NOT Fraud Detection)

Purpose:

Validate internal consistency of evidence

Checks include:

Raw GPS vs overlay text consistency

Address vs reverse-geocode consistency

Timestamp sanity

Duplicate image detection

Output:

consistencyScore

isInconsistent (boolean)

flags (descriptive, neutral)

This logic:

Does NOT judge intent

Does NOT accuse citizens

Does NOT run on the client side

DEBUGGING OBJECTIVES (WHAT ANTIGRAVITY MUST DO)
A. ROUTING & MODULE ISOLATION

Verify that:

Citizen page is fully isolated

Admin pages never import citizen components

No shared layouts exist

Confirm no accidental coupling

B. FRONTEND FUNCTIONALITY

Validate:

Camera access behavior

GPS acquisition logic

Accuracy tier handling (High / Moderate / Low)

Timeout fail-safes

Ensure:

No infinite “waiting for GPS”

Accuracy is transparently shown

Capture always completes gracefully

C. BACKEND LOGIC FLOW

Confirm execution order:

Receive submission

Store raw data

Apply seasonal logic

Run evidence consistency validation

Save results

Detect:

Missing imports

Dead code

Logic that exists but never runs

D. DATA INTEGRITY

Ensure:

No mutation of raw GPS

Overlayed image is actually what is stored

Accuracy values persist correctly

Check schema alignment with runtime payloads

E. PERFORMANCE & STABILITY

Identify:

Unnecessary re-renders

Heavy synchronous operations

Blocking GPS calls

Suggest optimizations ONLY if needed

F. EDGE CASE HANDLING

Indoor GPS (high error)

Slow reverse geocoding

Permission denial

Network failure

Reload during capture

STRICT CONSTRAINTS

Antigravity must NOT:

Add new features

Redesign UI

Merge citizen and admin logic

Introduce authentication

Replace architecture

Rename concepts again

This is a debug, validate, and optimize task only.

EXPECTED OUTPUT FORMAT FROM ANTIGRAVITY

Summary of system health

List of confirmed working areas

List of issues (if any) with:

Location (file / logic)

Root cause

Impact

Minimal fix suggestion

Final confidence statement:

Fully stable / Partially stable / Needs fixes

FINAL GOAL

After this debugging pass:

The system should behave predictably

No conceptual misunderstandings should remain

Citizen → Server → Admin flow should be crystal clear

The project should be ready for:

Live demo

Evaluation

Further controlled expansion
