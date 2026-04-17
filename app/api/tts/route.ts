import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID
};

const client = new TextToSpeechClient({ 
    credentials,
    projectId: process.env.GOOGLE_PROJECT_ID 
});

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { 
            text, 
            languageCode = 'en-US', 
            voiceStyle = 'Sulafat',
            prompt = "Read aloud in a warm, welcoming tone."
        } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Voice Mapping Logic for Chirp3 HD Voices
        // Supported Styles: Achird, Sulafat, Kore, Erinome
        const voiceName = `${languageCode}-Chirp3-HD-${voiceStyle}`;

        console.log(`[TTS API] Synthesizing [${languageCode}] using ${voiceName} with prompt: "${prompt}"`);

        const request = {
            input: { text },
            voice: { 
                languageCode, 
                name: voiceName,
                // The library handles gender automatically based on the name, 
                // but we can specify the name directly.
            },
            audioConfig: { 
                audioEncoding: 'MP3',
                pitch: 0,
                speakingRate: 1.0, 
                effectsProfileId: ['small-bluetooth-speaker-class-device'] 
            },
        };

        const [response] = await client.synthesizeSpeech(request);
        const audioContent = response.audioContent.toString('base64');

        return NextResponse.json({ audioContent });

    } catch (error: any) {
        console.error('TTS API error:', error);
        
        // Handle common errors like API not enabled
        if (error.message?.includes('disabled') || error.code === 403) {
            return NextResponse.json({ 
                error: 'Text-to-Speech API is not enabled in your Google Cloud Project. Please enable it in the console.',
                code: 'API_DISABLED'
            }, { status: 403 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
