import OpenAI from "openai";
import * as fs from "fs";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribe an audio file to text using OpenAI's Whisper API
 * @param audioFilePath Path to the audio file
 * @returns Transcription text and duration
 */
export async function transcribeAudio(audioFilePath: string): Promise<{ 
  text: string;
  duration?: number;
}> {
  try {
    // Create a readable stream for the audio file
    const audioStream = fs.createReadStream(audioFilePath);
    
    // Call OpenAI's Audio API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      language: "en",  // Can be made dynamic based on user preference
      response_format: "json",
    });
    
    return {
      text: transcription.text,
      duration: 0, // OpenAI API doesn't return duration directly in current version
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

/**
 * Generate call script based on provided prompts
 * @param prompts Script generation prompts
 * @param language Target language code (default: 'en')
 * @returns Generated script content
 */
export async function generateCallScript(
  prompts: {
    targetAudience: string;
    objective: string;
    keyPoints: string[];
    tone: string;
  },
  language: string = 'en'
): Promise<string> {
  try {
    const prompt = `
      Generate a professional outbound call script for the following scenario:
      
      Target Audience: ${prompts.targetAudience}
      Objective: ${prompts.objective}
      Key Points to Cover:
      ${prompts.keyPoints.map(point => `- ${point}`).join('\n')}
      Tone: ${prompts.tone}
      
      Please format the script with clear sections for:
      1. Introduction
      2. Value proposition
      3. Questions to engage the prospect
      4. Handling objections
      5. Call to action
      6. Closing
      
      Make the script conversational, personalized, and effective.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert sales script writer. Generate professional, conversational call scripts in ${language} language that sound natural when spoken.`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
}

/**
 * Analyze sentiment of text
 * @param text Text to analyze
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  analysis: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars, a sentiment label (positive, negative, or neutral), and a brief analysis."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      sentiment: result.sentiment || 'neutral',
      score: result.score || 3,
      analysis: result.analysis || 'No detailed analysis available.'
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    throw error;
  }
}

export default {
  transcribeAudio,
  generateCallScript,
  analyzeSentiment
};