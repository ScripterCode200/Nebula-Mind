const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'server.log');

function verifyPayload() {
    try {
        if (!fs.existsSync(logPath)) {
            console.error('server.log not found.');
            return;
        }

        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');

        // Find the last occurrence of the payload start
        let startIndex = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].includes('[Chat API] Ollama Payload Messages (Preview):')) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) {
            console.log('No Ollama payload logs found in server.log');
            return;
        }

        console.log('--- Found latest Ollama Payload ---');
        // Print lines until we hit the next log section or a reasonable limit
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            // Stop if we see a new log entry timestamp or tag that isn't part of the message
            // (Simple heuristic: stop if we see [Chat API] but not the message lines, or just print 20 lines)
            if (i > startIndex && line.includes('[Chat API]') && !line.includes('[Message')) {
                // checking if it's a new log entry
                if (line.includes('Request received') || line.includes('Connecting to')) {
                    break;
                }
            }

            console.log(line);

            // Safety break
            if (i - startIndex > 50) break;
        }
        console.log('-----------------------------------');

    } catch (err) {
        console.error('Error reading log:', err);
    }
}

verifyPayload();
