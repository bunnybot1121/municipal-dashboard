
import { chromium } from 'playwright';

(async () => {
    console.log('📸 Starting Visual Verification...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        // 1. Citizen Portal
        console.log('   Navigating to Citizen Portal (Standalone Page)...');
        await page.goto('http://localhost:5173/municipal-dashboard/citizen.html');
        // Wait for potential loading
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'proof_citizen_portal.png' });
        console.log('   ✅ Captured: proof_citizen_portal.png');

        // 2. Login Page (Verify Link Removed)
        console.log('   Navigating to Login Page...');
        await page.goto('http://localhost:5173/municipal-dashboard/');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'proof_login_clean.png' });
        console.log('   ✅ Captured: proof_login_clean.png');

    } catch (e) {
        console.error('   ❌ Error:', e);
    } finally {
        await browser.close();
        console.log('📸 Verification Complete.');
    }
})();
