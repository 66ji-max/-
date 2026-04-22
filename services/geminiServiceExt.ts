import { streamBackendChat } from '../services/geminiService';

// Ensure the frontend passes the token to the service
export const getAiServiceStream = async (token: string | null, prompt: string, instruction: string, file: any, onChunk: any) => {
    return await streamBackendChat(prompt, onChunk, instruction, file, token);
};
