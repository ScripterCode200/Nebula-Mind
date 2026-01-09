const { Innertube } = require('youtubei.js');
const fs = require('fs');

const LOG_FILE = 'download_test_log_5.txt';
fs.writeFileSync(LOG_FILE, 'STARTING TEST PART 5 (RickRoll)\n');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

async function testDownload(clientType) {
    log(`\n--- Testing Download with client: ${clientType || 'DEFAULT'} ---`);
    try {
        const yt = await Innertube.create({ client_type: clientType });
        const videoId = 'dQw4w9WgXcQ';

        log(`Fetching info for ${videoId}...`);
        const info = await yt.getInfo(videoId);

        log('Choosing format...');
        const format = info.chooseFormat({ type: 'audio', quality: 'best' });

        if (!format) {
            log('No format found!');
            return;
        }
        log(`Format found: ${format.itag}`);

        log('Attempting download...');
        const stream = await info.download({ itag: format.itag });

        log('SUCCESS! Download started (presumably).');

    } catch (error) {
        log(`FAILED with ${clientType || 'DEFAULT'}:`);
        log(error.message);
    }
}

(async () => {
    // Try Default (WEB)
    await testDownload(undefined);
    // Try ANDROID
    await testDownload('ANDROID');
})();
