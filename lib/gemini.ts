import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
    console.warn("GEMINI_API_KEY is not set!");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" });
export const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" }); // Vision model for multimodal

export default genAI;
