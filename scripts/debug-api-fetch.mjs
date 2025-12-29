
import fetch from 'node-fetch';

async function testApi() {
    const id = '6952ae647eb97df8be734783';
    const url = `http://localhost:3000/api/notebooks/${id}`;

    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log('Error status:', res.status);
            try {
                const text = await res.text();
                console.log('Error Body:', text);
            } catch (e) { }
            return;
        }

        const data = await res.json();
        console.log('Storage Provider:', data.storageProvider);
        console.log('PDF Key:', data.pdfKey);
        console.log('PDF URL:', data.pdfUrl);

    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testApi();
