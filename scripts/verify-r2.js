
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
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

async function verifyR2() {
    try {
        console.log('--- Verifying R2 Configuration ---');
        console.log('Account ID:', env.R2_ACCOUNT_ID);
        console.log('Bucket:', env.R2_BUCKET_NAME);

        // 1. List Objects
        console.log('\nStep 1: Listing Objects...');
        const listCmd = new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME, MaxKeys: 5 });
        const listRes = await client.send(listCmd);
        console.log('Success! Found objects:', listRes.Contents ? listRes.Contents.length : 0);
        if (listRes.Contents && listRes.Contents.length > 0) {
            console.log('First object:', listRes.Contents[0].Key);
        }

        // 2. Upload Test File
        console.log('\nStep 2: Uploading Test File...');
        const testKey = 'test-verification.txt';
        const testBody = 'Hello R2 World';
        await client.send(new PutObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: testKey,
            Body: testBody,
            ContentType: 'text/plain'
        }));
        console.log('Upload successful.');

        // 3. Generate Signed URL
        console.log('\nStep 3: Generating Signed URL...');
        const getCmd = new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: testKey });
        const url = await getSignedUrl(client, getCmd, { expiresIn: 3600 });
        console.log('Signed URL generated.');
        console.log('URL:', url);

        // 4. Fetch URL
        console.log('\nStep 4: Fetching URL to verify access...');
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(url);
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        const text = await res.text();
        console.log('Content:', text);

        if (res.status === 200 && text === testBody) {
            console.log('\n✅ VERIFICATION PASSED');
        } else {
            console.error('\n❌ VERIFICATION FAILED');
        }

    } catch (err) {
        console.error('\n❌ ERROR:', err);
    }
}

verifyR2();
