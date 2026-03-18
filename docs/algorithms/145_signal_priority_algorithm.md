# 145-Signal Priority Engine (7D Framework v2.0)
## Algorithm Documentation

**File Reference**: `src/utils/aiPriority.js`

### Overview
The Nagarsevak AI utilizes a proprietary grading algorithm known as the **145-Signal Priority Engine**. It dynamically evaluates unstructured, user-submitted text (citizen reports, complaints, issues) against a robust **7-Dimensional Framework**. This generates a precise priority score (0-100) ensuring that critical municipal incidents auto-escalate while generic issues remain standard.

### The 9 Categories
The engine systematically scans the input using NLP sub-string matching logic across 145 distinct keywords/conditions, distributed across 9 categories. Each match contributes positive or negative points to a rolling sum.

1. **Life & Safety Criticality** (Max 50 pts):
   * *Keywords:* "death", "injury", "fire", "gas", "school nearby", "collapse".
   * Highest scoring category. A direct match on "fatal" or "flames" immediately boosts the base score to alert levels.
2. **Sector Criticality** (Max 40 pts):
   * *Keywords:* "no water", "bridge collapse", "power blackout", "sewage overflow".
   * Weighs the nature of the infrastructure failure.
3. **Time & SLA Factors** (Max 25 pts):
   * *Keywords & Checks:* "Age > 24h", "overdue", "festival season", "monsoon".
   * Issues older than 24h or occurring during high-stakes seasons (Monsoon) organically float to the top of the queue.
4. **Location & Impact** (Max 20 pts):
   * *Keywords:* "highway", "slum", "commercial zone", "flood prone".
5. **Citizen Signals** (Max 20 pts):
   * *Keywords & Checks:* "angry", "viral", "media coverage", *Has Image/Video Evidence*.
6. **AI / System Signals** (Max 15 pts):
   * *Keywords:* "sensor anomaly", "chain reaction cascade", "worsening".
7. **Resource & Ops** (-5 to +10 pts):
   * Adds or subtracts points based on coordination requirements (e.g., "needs crane", "night work").
8. **De-Prioritization** (-40 to 0 pts):
   * *Keywords:* "cosmetic", "false alarm", "duplicate", "private property".
   * Heavily penalizes non-municipal issues or spam, preventing queue bloat.
9. **Governance & Legal** (+10 to +30 pts):
   * *Keywords:* "court order", "RTI", "ministerial".

### Calculation Methodology
1. **Signal Detection**: The engine converts the Title, Description, and Sector into a lowercase text blob. It iterates through all 9 Category dictionaries. If any condition/keyword passes, it adds the specific signal's `points` to a `catScores` object.
2. **Raw Score Aggregation**: Starts with a base Event Score of 15. The bounded outputs of the 9 categories are summed mathematically into a `rawScore`.
3. **7D Multipliers**:
   - **Sector Weight**: Multiplies the score based on the department (e.g., Health = 1.0, Street = 0.6).
   - **Severity Multiplier**: Amplifies the score (e.g., 'life-threatening' = 2.0x, 'low' = 0.6x).
   - **Confidence Multiplier**: Drops the score by 50% (0.5x) if Fraud markers are detected.
4. **Final Bound**: The formula equates to: `Final Score = RawScore * Sector * Severity * Confidence`. It is then clamped strictly between `0` and `100`.

### Risk Level Output
The final score drives the color-coded UI badges and governs auto-escalation targets in the Dashboard:
* **85 - 100**: `Crisis` (Red) ➔ Escalated to *Municipal Commissioner*
* **60 - 84**: `Critical` (Orange) ➔ Escalated to *Zonal Head*
* **40 - 59**: `Moderate` (Yellow)
* **0 - 39**: `Operational` (Green) ➔ Routed to Standard *Sector Officer*
