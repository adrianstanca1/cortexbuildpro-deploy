import { GoogleGenAI, LiveServerMessage, Modality, Content, GenerateContentResponse, Type } from "@google/genai";
import { Message } from "../types";

const API_KEY = process.env.API_KEY || '';

function getAI(): GoogleGenAI {
  if (!API_KEY) throw new Error('Gemini API key not configured. AI features are unavailable.');
  return new GoogleGenAI({ apiKey: API_KEY });
}

export interface ChatConfig {
  model: string;
  systemInstruction?: string;
  thinkingBudget?: number;
  tools?: any[];
  responseMimeType?: string;
  toolConfig?: any;
}

/**
 * Generic configuration for prompt execution.
 */
export interface GenConfig {
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
  systemInstruction?: string;
  thinkingConfig?: { thinkingBudget: number };
  model?: string;
  tools?: any[];
  toolConfig?: any;
  imageConfig?: {
      aspectRatio?: string;
      imageSize?: string;
  };
}

/**
 * Sends a chat message and returns a streaming response.
 * Follows the direct sendMessageStream pattern.
 */
export const streamChatResponse = async (
  history: Message[],
  newMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg',
  onChunk?: (text: string, metadata?: any) => void,
  configOverride?: ChatConfig
): Promise<GenerateContentResponse> => {
  
  const model = configOverride?.model || "gemini-3-pro-preview";
  
  try {
    const apiHistory: Content[] = history
      .filter(msg => !msg.isThinking && msg.id !== 'intro')
      .map(msg => {
        const parts: any[] = [];
        if (msg.text) parts.push({ text: msg.text });
        if (msg.image && msg.role === 'user') {
          const matches = msg.image.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
          }
        }
        return { role: msg.role, parts };
      });

    // Create a new instance right before call as per best practices
    const chatAi = getAI();
    
    const chatConfig: any = {
      systemInstruction: configOverride?.systemInstruction || "You are a helpful and precise AI assistant for the BuildPro construction platform.",
    };

    // Apply thinking budget only to Gemini 3 series
    if (model.includes('gemini-3') && configOverride?.thinkingBudget) {
      chatConfig.thinkingConfig = { thinkingBudget: configOverride.thinkingBudget };
    }

    if (configOverride?.tools) chatConfig.tools = configOverride.tools;
    if (configOverride?.toolConfig) chatConfig.toolConfig = configOverride.toolConfig;
    if (configOverride?.responseMimeType) chatConfig.responseMimeType = configOverride.responseMimeType;

    const chat = chatAi.chats.create({
      model: model,
      config: chatConfig,
      history: apiHistory
    });

    const parts: any[] = [];
    if (newMessage.trim()) parts.push({ text: newMessage });
    if (imageData) {
        const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        parts.push({ inlineData: { mimeType, data: base64Data } });
    }
    
    const messageParts = parts.length > 0 ? parts : [{ text: "Analyze current context." }];

    const result = await chat.sendMessageStream({ message: messageParts as any });
    
    let finalResponse: GenerateContentResponse | undefined;
    for await (const chunk of result) {
      finalResponse = chunk as GenerateContentResponse;
      if (onChunk && finalResponse.text) {
          const metadata = finalResponse.candidates?.[0]?.groundingMetadata;
          onChunk(finalResponse.text, metadata);
      }
    }
    
    return finalResponse!;

  } catch (error) {
    console.error("Neural link error:", error);
    throw error;
  }
};

/**
 * Performs real-time web-grounded research search using Google Search tools.
 */
export const researchGroundingSearch = async (query: string): Promise<{ text: string, links: any[] }> => {
    const researchAi = getAI();
    const response = await researchAi.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "You are a forensic industry analyst. Extract real-time pricing, indices, and regulatory data."
        }
    });

    return {
        text: response.text || "",
        links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

/**
 * Performs specialized Google Maps grounding search.
 */
export const mapsGroundingSearch = async (query: string, lat: number, lng: number): Promise<{ text: string, links: any[] }> => {
    const mapsAi = getAI();
    const response = await mapsAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: { latitude: lat, longitude: lng }
                }
            }
        }
    });

    return {
        text: response.text || "",
        links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

/**
 * Forensicly analyzes an invoice image.
 */
export const analyzeInvoiceImage = async (base64Data: string, mimeType: string): Promise<any> => {
    const invAi = getAI();
    const response = await invAi.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: `Analyze this construction invoice. Extract: 
                        1. Vendor Details (Name, Address), 
                        2. Total Amount, 
                        3. Due Date, 
                        4. Itemized Line Items (Description, Quantity, Unit Price). 
                        Return JSON only.` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 4096 }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Executes a deep audit of the entire company database shard.
 * Ingests multiple datasets for cross-entity logic verification.
 */
export const deepRegistryAudit = async (datasets: { projects: any[], ledger: any[], workforce: any[] }): Promise<any> => {
    const auditAi = getAI();
    const prompt = `
        Act as a Sovereign AI Auditor for CortexBuildPro.
        Analyze the following cross-entity datasets for structural and financial drift:
        - PROJECTS: ${JSON.stringify(datasets.projects)}
        - LEDGER: ${JSON.stringify(datasets.ledger)}
        - WORKFORCE: ${JSON.stringify(datasets.workforce)}

        TASK: 
        1. Identify "Silent Risks" where project delays correlate with workforce skill gaps or pending invoice settlements.
        2. Propose 3 "Genesis Optimizations" to restore operational baseline.
        
        Return valid JSON: { "healthScore": number, "criticalGaps": [], "proposedFixes": [] }
    `;

    const response = await auditAi.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 32768 } // MAX THINKING BUDGET
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Generates speech from text using Gemini 2.5 Flash TTS.
 */
export const generateSpeech = async (text: string, voice: string = 'Kore'): Promise<string> => {
    const ttsAi = getAI();
    const response = await ttsAi.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice as any },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const runRawPrompt = async (prompt: string, config?: GenConfig, mediaData?: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const model = config?.model || 'gemini-3-flash-preview';
    const parts: any[] = [{ text: prompt }];
    if (mediaData) parts.push({ inlineData: { mimeType, data: mediaData } });
    
    const promptAi = getAI();
    const result = await promptAi.models.generateContent({
      model,
      contents: { parts },
      config
    });
    return result.text || "";
};

export const parseAIJSON = <T = any>(text: string): T => {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    return JSON.parse(match ? match[1] : text.trim());
  } catch (e) {
    throw new Error("Invalid JSON format from logic core.");
  }
};

export const getLiveClient = () => {
    const liveAi = getAI();
    return liveAi.live;
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    const transcribeAi = getAI();
    const response = await transcribeAi.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Audio } },
                { text: "Transcribe exactly. Return only the transcription." }
            ]
        }
    });
    return response.text || "";
};

/**
 * Generates an image using Gemini 2.5 Flash Image.
 */
export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    const imgAi = getAI();
    const response = await imgAi.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Sovereign Forge failed to synthesize the request. Ensure proper API key clearance.");
};

/**
 * Analyzes a technical drawing using Gemini 3 Pro.
 */
export const analyzeDrawing = async (base64Data: string, mimeType: string): Promise<any> => {
    const drawingAi = getAI();
    const response = await drawingAi.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: `Act as a professional structural engineer. Analyze this technical drawing. 
                        Extract: 
                        1. A high-level technical summary, 
                        2. Significant Elements and Dimensions, 
                        3. Estimated Material Quantities (Steel, Concrete, etc.), 
                        4. Potential Structural Risks.
                        Return the analysis in a structured JSON format.` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 8192 }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Verifies market pricing for construction materials using web grounding.
 */
export const checkMarketPricing = async (items: { description: string, price: number }[], location: string): Promise<any> => {
    const priceAi = getAI();
    const prompt = `Perform a real-time market pricing audit for these construction items in ${location}: ${JSON.stringify(items)}. 
                   Reconcile these prices with current 2025 global and local indices. 
                   Identify any items that are significantly above or below market nominals.
                   Return a concise variance report in JSON format: { "analysis": "string", "varianceNodes": [] }.`;
    const response = await priceAi.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 4096 }
        }
    });
    return JSON.parse(response.text || "{}");
};
