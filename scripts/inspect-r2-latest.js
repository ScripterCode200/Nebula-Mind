
const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    }
});

async function inspectLatest() {
    try {
        console.log('Inspecting bucket:', env.R2_BUCKET_NAME);
        const listCmd = new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME });
        const listRes = await client.send(listCmd);

        if (!listRes.Contents || listRes.Contents.length === 0) {
            console.log('Bucket is empty.');
            return;
        }

        // Sort by LastModified desc
        const sorted = listRes.Contents.sort((a, b) => b.LastModified - a.LastModified);
        const top5 = sorted.slice(0, 5);

        console.log('\nTop 5 Recent Files:');
        for (const file of top5) {
            console.log('------------------------------------------------');
            console.log('Key:', file.Key);
            console.log('Size:', file.Size, 'bytes');
            console.log('Last Modified:', file.LastModified);

            // Get Content Type for each
            try {
                const headCmd = new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: file.Key });
                const headRes = await client.send(headCmd);
                console.log('Content-Type:', headRes.ContentType);
            } catch (e) {
                console.log('Content-Type: Error fetching');
            }

            if (file.Size === 0) {
                console.error('❌ WARNING: File size is 0 bytes!');
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

inspectLatest();
