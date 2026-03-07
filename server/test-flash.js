const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
require('dotenv').config();

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function main() {
    try {
        const text = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: 'Hello world'
        });
        console.log("Success with gemini-2.5-flash!", text.text.substring(0, 50));
    } catch(e) {
        console.error("2.5-flash Error:", e.message);
    }
    
    try {
        const text2 = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: 'Hello world'
        });
        console.log("Success with gemini-2.0-flash!", text2.text.substring(0, 50));
    } catch(e) {
        console.error("2.0-flash Error:", e.message);
    }
}
main();
