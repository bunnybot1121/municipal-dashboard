import { calculatePriorityScore } from './src/services/aiPriority.js';

console.log("--- VERIFYING ADVANCED AI ENGINE ---");

// Test Case 1: Environmental Crisis
const environmentalIssue = {
    title: "Chemical Leak in River",
    description: "Toxic waste seen entering the river near the industrial zone. Wildlife affected.",
    severity: "High",
    aiAnalysis: { isReal: true, confidence: 0.95 }
};

const res1 = calculatePriorityScore(environmentalIssue);
console.log("\n[TEST 1] Environmental Issue:");
console.log("Score:", res1.score);
console.log("Risk Level:", res1.advancedAnalysis.riskLevel);
console.log("Escalation:", res1.advancedAnalysis.escalation);
console.log("Explanation:", res1.advancedAnalysis.explanation);
console.log("Breakdown:", JSON.stringify(res1.breakdown, null, 2));

// Test Case 2: Social Equity
const socialIssue = {
    title: "Slum Shelter Roof Collapse",
    description: "Roof of a community shelter in low-income area collapsed. Vulnerable residents exposed.",
    severity: "High",
    aiAnalysis: { isReal: true, confidence: 0.90 }
};

const res2 = calculatePriorityScore(socialIssue);
console.log("\n[TEST 2] Social Equity Issue:");
console.log("Score:", res2.score);
console.log("Escalation:", res2.advancedAnalysis.escalation);

// Test Case 3: Fake Report
const fakeIssue = {
    title: "Alien Invasion",
    description: " aliens are eating the road.",
    severity: "High",
    aiAnalysis: { isReal: false, confidence: 0.99 }
};
const res3 = calculatePriorityScore(fakeIssue);
console.log("\n[TEST 3] Fake Issue:");
console.log("Score:", res3.score);
console.log("Explanation:", res3.advancedAnalysis.explanation);
