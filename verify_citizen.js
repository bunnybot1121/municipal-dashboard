import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting Citizen Module verification...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Grant permissions for camera and geolocation
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:5173', ['geolocation', 'camera']);

    try {
        await page.goto('http://localhost:5173/citizen.html', { waitUntil: 'networkidle0' });

        const title = await page.title();
        console.log(`Page Title: ${title}`);

        // Check for key elements of the ReportIssue component
        const cameraOverlay = await page.$('.camera-overlay');
        const captureBtn = await page.$('button');

        if (cameraOverlay || captureBtn) {
            console.log('PASS: Citizen UI loaded successfully.');
        } else {
            console.log('FAIL: Citizen UI elements not found. Content dump:');
            const content = await page.content();
            console.log(content.substring(0, 500));
        }

        await page.screenshot({ path: 'citizen_verification.png' });
        console.log('Screenshot saved to citizen_verification.png');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
