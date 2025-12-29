
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
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

const corsRules = [
    {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
        AllowedOrigins: ["*"],
        ExposeHeaders: ["Content-Length", "Content-Type", "Content-Range", "Accept-Ranges", "ETag"]
    }
];

async function setupCors() {
    try {
        console.log('Setting CORS for bucket:', env.R2_BUCKET_NAME);
        await client.send(new PutBucketCorsCommand({
            Bucket: env.R2_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: corsRules
            }
        }));
        console.log('Successfully set CORS configuration.');
    } catch (err) {
        console.error('Error setting CORS:', err);
    }
}

setupCors();
