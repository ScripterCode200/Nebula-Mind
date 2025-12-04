import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn('OpenAI API key is missing');
}

const openai = new OpenAI({
    apiKey: apiKey || 'dummy-key', // Prevent build crash if key is missing
    dangerouslyAllowBrowser: true // Enable if using client-side (though not recommended)
});

export default openai;
