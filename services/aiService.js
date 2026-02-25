const logger=require('../utils/logger');

async function generateProductDescription(product){
  try{
  const response=await fetch('https://router.huggingface.co/v1/chat/completions',{method:"POST",headers:{
    Authorization:`Bearer ${process.env.HF_API_KEY}`,
    "Content-Type":"application/json",
  },
    body:JSON.stringify({
      model:'meta-llama/Llama-3.1-8B-Instruct',
      messages:[{
        role: "system",
        content:
              "You are an ecommerce backend. Return only a short product description in plain text.",
      },
      {  
role: "user",  
content: `
Product name: ${product.name}
Category: ${product.category}
sellingPrice: ${product.sellingPrice}
Write max 20 words.
`,
          },
      ],
     max_tokens:60,
    })
    
  });
   if (!response.ok) {
  throw new Error("AI API failed");
}
    
  const data = await response.json();
  if(!data.choices?.length){
    throw new Error('Invalid AI response')
  }
  return data.choices[0].message.content.trim();
  }catch(err){
    logger.error(err)
    return 'product description unavailable';
  }
};
async function generateProductTags(product){
  try{
  const response=await fetch('https://router.huggingface.co/v1/chat/completions',{method:"POST",headers:{
    Authorization:`Bearer ${process.env.HF_API_KEY}`,
    "Content-Type":"application/json",
  },
    body:JSON.stringify({
      model:'meta-llama/Llama-3.1-8B-Instruct',
      messages:[{
        role: "system",
        content:
              "you generate ecommerce search tags only",
      },
      {  
role: "user",  
content: `
Generate 6 ecommerce search tags for ONE specific product.

Rules:
- each tag on a new line
- lowercase
- max 2 words
- no marketing or vague terms
- describe the product itself
- no explanations

Product name: ${product.name}
Category: ${product.category}
sellingPrice: ${product.sellingPrice}
description:${product.description||""}
`,
          },
      ],
     max_tokens:60,
    })
    
  });
   if (!response.ok) {
  throw new Error("AI API failed");
}
    
  const data = await response.json();
  if(!data.choices?.length){
    throw new Error('Invalid AI response')
  }
  const raw = data.choices[0].message.content;
const tags = raw
  .split("\n")
  .map(t => t.trim())
  .filter(t => t.length > 0 && t.split(" ").length <= 2);

return tags;
  }catch(err){
    logger.error(err)
    throw new Error('Invalid AI tag format');
  }
};
//get embedding for get similar
function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found");
  return JSON.parse(match[0]);
}

async function getEmbedding(text) {
  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
          {
            role: "system",
            content: "You convert text into semantic numeric vectors."
          },
          {
            role: "user",
            content: `
Convert the following product text into a numeric embedding vector.
Rules:
- Output ONLY a valid JSON array
- Numbers only
- No trailing commas
- No explanation
- Length: exactly 64 numbers

Text:
${text}
`
          }
        ],
        max_tokens: 400,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI error ${response.status}: ${err}`);
  }
  const data = await response.json();
  const raw = data.choices[0].message.content;
  try {
    return extractJsonArray(raw);
  } catch (err) {
    console.error("RAW AI OUTPUT:", raw);
    throw new Error("Invalid embedding format from AI");
  }
}
//compare embedding for search
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports =  {generateProductDescription,generateProductTags,
  getEmbedding,cosineSimilarity
};
