const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
require('dotenv').config();

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function main() {
    try {
        const result = await generateText({
            model: google('gemini-1.5-pro'),
            prompt: 'Hello world'
        });
        console.log("Success:", result.text.substring(0, 50));
    } catch (e) {
        console.error("SDK Error:", e.message);
    }
}
main();
