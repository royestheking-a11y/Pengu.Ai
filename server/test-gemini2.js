require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

async function checkModel() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello!");
        console.log("Success with gemini-1.5-flash!", result.response.text().substring(0, 50));
    } catch(e) {
        console.error("Flash error:", e.message);
    }
}
checkModel();
