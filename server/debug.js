const { streamText } = require('ai');
const { createGroq } = require('@ai-sdk/groq');
const groq = createGroq({ apiKey: 'dummy' });
async function test() {
  const result = streamText({ model: groq('llama3-8b-8192'), messages: [{ role: 'user', content: 'hi' }] });
  console.log(Object.keys(result));
}
test().catch(console.error);
