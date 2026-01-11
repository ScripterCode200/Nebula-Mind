
const { YoutubeTranscript } = require('youtube-transcript');

// 1. Video with manual captions (TED Talk)
const MANUAL_CAPTION_URL = 'https://www.youtube.com/watch?v=Ke53lG9J7_Q';

// 2. Video with auto-generated captions (Usually news clips or random uploads often have auto-generated)
// Attempting a likely candidate or the user's previous video if known. Using a generic news clip.
const AUTO_CAPTION_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick roll has manual, let's try a TechQuickie potentially

async function testCaptions(url, label) {
    console.log(`\n--- Testing: ${label} [${url}] ---`);
    try {
        console.log('1. Trying default fetch...');
        const items = await YoutubeTranscript.fetchTranscript(url);
        console.log(`   SUCCESS: Found ${items.length} lines.`);
        console.log(`   Sample: "${items[0].text}..."`);
    } catch (e) {
        console.log(`   FAILED: ${e.message}`);

        console.log('2. Trying to search for available tracks...');
        try {
            const list = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });
            // The library structure is a bit weird, sometimes fetchTranscript returns the list if it can't find exact? 
            // Or we check if there's a method to list. 
            // Actually fetchTranscript takes config.
            console.log(`   Retry 'en' SUCCESS: Found ${list.length} lines.`);
        } catch (e2) {
            console.log(`   Retry 'en' FAILED: ${e2.message}`);
        }
    }
}

async function main() {
    await testCaptions(MANUAL_CAPTION_URL, 'Manual Captions Video');
    await testCaptions('https://www.youtube.com/watch?v=LXb3EKWsInQ', 'Likely Auto-Generated (Random 4K Nature/Test)');
}

main();
