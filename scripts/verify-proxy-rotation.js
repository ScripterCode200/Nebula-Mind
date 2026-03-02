require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Helper to format proxy
function formatProxy(proxyString) {
    if (!proxyString) return null;
    const trimmed = proxyString.trim();
    if (trimmed.startsWith('http')) return trimmed;

    // ip:port:user:pass -> http://user:pass@ip:port
    const parts = trimmed.split(':');
    if (parts.length === 4) {
        const [ip, port, user, pass] = parts;
        return `http://${user}:${pass}@${ip}:${port}`;
    }
    return null;
}

const proxies = (process.env.YOUTUBE_PROXY_LIST || '').split(',').map(formatProxy).filter(Boolean);
const ytDlpPath = path.join(process.cwd(), 'scripts', 'yt-dlp.exe');
const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Short video with captions


async function testProxies() {
    console.log(`Found ${proxies.length} proxies.`);

    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        console.log(`\n--- Attempt ${i + 1}/${proxies.length} ---`);
        console.log(`Testing proxy: ${proxy.replace(/:[^:]*@/, ':***@')}`);

        const args = [
            '--skip-download',
            '--write-subs',
            '--write-auto-subs',
            '--sub-lang', 'en',
            '--sub-format', 'vtt',
            '--proxy', proxy,
            '--socket-timeout', '10',
            '--output', path.join(os.tmpdir(), `test-proxy-${i}-%(id)s.%(ext)s`),
            videoUrl
        ];

        try {
            await new Promise((resolve, reject) => {
                const child = spawn(ytDlpPath, args);
                let output = '';

                child.stdout.on('data', d => { process.stdout.write(d); output += d; });
                child.stderr.on('data', d => { process.stderr.write(d); output += d; });

                child.on('close', (code) => {
                    if (code === 0) {
                        console.log('SUCCESS: Proxy works!');
                        resolve();
                    } else {
                        reject(new Error(`Exit code ${code}`));
                    }
                });

                child.on('error', reject);
            });

            console.log('\n✅ Verification PASSED. At least one proxy is working.');
            process.exit(0);
        } catch (e) {
            console.error(`❌ Attempt ${i + 1} Failed.`);
        }
    }

    console.error('\n❌ All proxies failed.');
    process.exit(1);
}

testProxies();

