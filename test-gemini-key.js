const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AQ.Ab8RN6JdOBB-__h49o_ZiU0_hJSslHWuRodEpeZlHG8Fc12Gbw";

async function testGemini() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Try a known working model first

    try {
        console.log("Testing Gemini 1.5 Flash with provided key...");
        const result = await model.generateContent("Hi");
        console.log("Response:", result.response.text());
        console.log("SUCCESS: Key is valid for AI Studio.");
    } catch (error) {
        console.error("ERROR DETAILS:");
        console.error(error);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Body:", await error.response.text());
        }
    }
}

testGemini();
