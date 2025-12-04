
// const fetch = require('node-fetch'); // Using global fetch

async function testRoute(url, method = 'GET', body = null) {
    console.log(`Testing ${url} [${method}]...`);
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
        console.log(`Body start: ${text.substring(0, 100)}...`);

        try {
            JSON.parse(text);
            console.log('Body is valid JSON');
        } catch (e) {
            console.log('Body is NOT valid JSON');
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
    console.log('---');
}

(async () => {
    const baseUrl = 'http://localhost:3000';

    // Test 1: Non-existent route (expect 404 HTML)
    await testRoute(`${baseUrl}/api/nonexistent`);

    // Test 2: Generate route with empty body (expect 500 JSON or HTML)
    await testRoute(`${baseUrl}/api/generate`, 'POST', {});

    // Test 3: Generate route with missing fields
    await testRoute(`${baseUrl}/api/generate`, 'POST', { notebookId: 'badid', type: 'notes' });
})();
