const { calculatePriorityScore } = require('./server/public/js/aiPriority.js');

console.log("=== VERIFYING 145-SIGNAL PRIORITY ENGINE ===");

const scenarios = [
    {
        title: "CRITICAL SAFETY: Open Manhole near School",
        issue: {
            title: "Dangerous open manhole",
            description: "There is an open manhole right in front of the primary school gate. Kids are walking by constantly. It caused an injury yesterday.",
            sector: "drainage",
            severity: "critical",
            type: "risk",
            createdAt: new Date().toISOString() // fresh
        }
    },
    {
        title: "DE-PRIORITIZED: Cosmetic Issue",
        issue: {
            title: "Faded paint on wall",
            description: "The paint on the park wall is looking faded and ugly. Please repaint it.",
            sector: "parks",
            severity: "low",
            type: "maintenance",
            createdAt: new Date().toISOString()
        }
    },
    {
        title: "COMPLEX: Water Supply Disruption",
        issue: {
            title: "No water in colony",
            description: "Water supply stopped for 24 hours in our residential colony. Elderly people are suffering.",
            sector: "water supply",
            severity: "high",
            type: "failure",
            createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // > 24h old
        }
    }
];

scenarios.forEach(s => {
    console.log(`\n--- TEST: ${s.title} ---`);
    const result = calculatePriorityScore(s.issue);
    console.log(`SCORE: ${result.score}/100 [${result.label}]`);
    console.log(`RISK LEVEL: ${result.advancedAnalysis.riskLevel}`);
    console.log(`EXPLANATION: ${result.advancedAnalysis.explanation}`);
    console.log("SIGNALS DETECTED:");
    result.breakdown.forEach(b => {
        console.log(` - ${b.name} (${b.value > 0 ? '+' : ''}${b.value})`);
    });
});
