import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn('OpenAI API key is missing');
}

const openai = new OpenAI({
    apiKey: apiKey,
});

export default openai;
