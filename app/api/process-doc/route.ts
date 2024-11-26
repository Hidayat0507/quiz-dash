import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import mammoth from 'mammoth';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to split text into chunks
function splitIntoChunks(text: string, maxChunkSize: number = 4000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Function to process a single chunk
async function processChunk(chunk: string): Promise<any> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106", // Using GPT-3.5 Turbo for better token limits
    messages: [
      {
        role: "system",
        content: `You are a quiz formatter. Format the given text into a structured quiz format. 
        Each question should have:
        - A clear question
        - Multiple choice options (at least 2)
        - The correct answer
        - An optional explanation
        
        Output should be a JSON array of questions in this format:
        {
          "questions": [
            {
              "question": "string",
              "options": ["string"],
              "correctAnswer": "string",
              "explanation": "string" | null
            }
          ]
        }
        
        Important:
        1. Make sure the output is valid JSON
        2. The correctAnswer must exactly match one of the options
        3. Return at least one question if possible
        4. If no valid questions can be formed, return {"questions": []}
        `
      },
      {
        role: "user",
        content: chunk
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  return JSON.parse(content);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.match(/\.(doc|docx)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .doc and .docx files are supported.' },
        { status: 400 }
      );
    }

    console.log('Processing file:', file.name);

    // Convert the file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from the doc file
    console.log('Extracting text from document...');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    if (!text || text.trim().length === 0) {
      console.error('No text extracted from document');
      return NextResponse.json(
        { error: 'Failed to extract text from document' },
        { status: 500 }
      );
    }

    console.log('Extracted text length:', text.length);

    // Split text into manageable chunks
    const chunks = splitIntoChunks(text);
    console.log('Split into', chunks.length, 'chunks');

    // Process each chunk
    const allQuestions: any[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
      try {
        const result = await processChunk(chunks[i]);
        if (result.questions && Array.isArray(result.questions)) {
          allQuestions.push(...result.questions);
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks even if one fails
      }
    }

    // Validate and filter questions
    const validQuestions = allQuestions.filter(q => {
      return q.question && 
             Array.isArray(q.options) && 
             q.options.length >= 2 && 
             q.correctAnswer && 
             q.options.includes(q.correctAnswer);
    });

    console.log('Total valid questions extracted:', validQuestions.length);

    if (validQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions could be extracted from the document' },
        { status: 400 }
      );
    }

    return NextResponse.json({ questions: validQuestions });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
