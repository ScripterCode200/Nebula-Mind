
const mongoose = require('mongoose');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

// Configure R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    }
});

// Define Minimal Schema
const NotebookSchema = new mongoose.Schema({
    title: String,
    userId: String,
    storageProvider: String,
    pdfKey: String,
    createdAt: Date
});
const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', NotebookSchema);

async function debugNotebook() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(env.MONGODB_URI);
        console.log('Connected.');

        // Find latest notebook with storageProvider = 'r2'
        const notebook = await Notebook.findOne({ storageProvider: 'r2' }).sort({ createdAt: -1 });

        if (!notebook) {
            console.log('No R2 notebooks found.');
            return;
        }

        console.log('\nFound Notebook:', notebook.title);
        console.log('ID:', notebook._id);
        console.log('PDF Key:', notebook.pdfKey);

        if (!notebook.pdfKey) {
            console.log('Missing pdfKey.');
            return;
        }

        console.log('Generating Signed URL...');
        const command = new GetObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: notebook.pdfKey,
        });
        const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        console.log('URL:', url);

        console.log('\nTesting URL...');
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(url);
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        console.log('Content-Length:', res.headers.get('content-length'));

        if (res.status === 200) {
            console.log('✅ URL is valid and accessible.');
        } else {
            console.log('❌ URL failed.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugNotebook();
