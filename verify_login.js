import { chromium } from 'playwright';

(async () => {
    console.log('Starting verification...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Capture logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    try {
        const url = 'http://localhost:5173/municipal-dashboard/';
        console.log(`Navigating to ${url}...`);

        // Inject Auth Token before navigation
        await page.addInitScript(() => {
            localStorage.setItem('is_authenticated', 'true');
            localStorage.setItem('user_role', 'admin');
            localStorage.setItem('user', JSON.stringify({ name: 'Admin', role: 'admin' }));
        });

        // Go to the page
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        console.log(`Response status: ${response.status()}`);

        // Check title
        const title = await page.title();
        console.log(`Page Title: ${title}`);

        // Check for specific elements - Command Center Version
        try {
            await page.waitForSelector('h1', { timeout: 10000 });
            const heading = await page.locator('h1').innerText();
            console.log(`Heading found: ${heading}`);

            // 4. Verify Dashboard Components
            // const heading = await page.textContent('h1'); // heading is already defined above
            // console.log(`Heading found: ${heading}`); // already logged above

            if (heading.includes('City Command Center')) {
                console.log('PASS: "City Command Center" heading confirmed.');
            } else {
                console.error('FAIL: Heading mismatch.');
            }

            // Check for Map Container (Reverted to OperationsMap)
            const mapVisible = await page.isVisible('.cc-map-container');
            console.log(`Operations Map Visible: ${mapVisible}`);

            // Check for Filter Dropdown
            const filterVisible = await page.isVisible('select');
            console.log(`Filter Dropdown Visible: ${filterVisible}`);

            const alertsVisible = await page.isVisible('.cc-emergency-section');
            console.log(`Emergency Alerts Visible: ${alertsVisible}`);

        } catch (e) {
            console.log('Element check FAILED:', e.message);
            console.log('Dumping HTML...');
            const html = await page.content();
            console.log(html);
        }

        // Screenshot
        await page.screenshot({ path: 'login_verification.png', fullPage: true });
        console.log('Screenshot saved to login_verification.png');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await browser.close();
    }
})();
