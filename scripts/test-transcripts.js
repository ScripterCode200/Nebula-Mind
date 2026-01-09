const { YoutubeTranscript } = require('youtube-transcript');

async function test(videoId) {
    console.log(`Checking transcripts for ${videoId}...`);
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        console.log(`Success! Found ${transcript.length} items.`);
    } catch (e) {
        console.log(`Failed: ${e.message}`);
    }
}

(async () => {
    await test('qJZ1Ez28C-A'); // User video
    await test('dQw4w9WgXcQ'); // Rick Roll (Has captions)
})();
