import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private genAI: GoogleGenAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('gemini.apiKey');
        if (!apiKey) {
            this.logger.warn('Gemini API Key missing');
        } else {
            this.genAI = new GoogleGenAI({ apiKey });
            this.logger.log('Gemini AI initialized with @google/genai SDK');
        }
    }

    async classifyTransaction(merchantName: string, amount: number, availableCategories: string[]): Promise<string> {
        if (!this.genAI) throw new Error('Gemini API not configured');

        const prompt = `
      You are a smart financial categorizer.
      I will provide you with a merchant name/transaction description: "${merchantName}" and amount: ${amount}.
      Available categories to choose from: [${availableCategories.join(', ')}].
      
      Respond strictly with EXACTLY ONE of the available categories that best matches the transaction.
      Do not add any additional text, punctuation, or explanation.
      If you are unsure, respond with "Otros".
    `;

        try {
            const response = await this.genAI.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            const category = response.text?.trim() || 'Otros';

            if (availableCategories.includes(category)) {
                return category;
            }
            return 'Otros';
        } catch (error) {
            this.logger.error('Error calling Gemini API for classification', error);
            return 'Otros';
        }
    }

    async generateDashboardInsights(userData: any): Promise<any> {
        if (!this.genAI) return null;

        const prompt = `
            You are an empathetic, intelligent financial coach.
            Analyze the following user data and generate a dashboard of insights in Spanish.
            Focus on human behavior, positive reinforcement, and actionable advice.
            Do NOT mention that you are an AI or reading a JSON. Use casual, clear language.

            UserData:
            ${JSON.stringify(userData, null, 2)}

            Respond ONLY with a valid JSON object (no markdown, no code blocks) matching this structure:
            {
                "dailyInsight": {
                    "text": "Tu gasto en Delivery subió 35% este mes. ¡Cuidado!",
                    "type": "spending_alert"
                },
                "trends": [
                    { "text": "Café ↑ 12% vs mes anterior", "type": "trend" },
                    { "text": "Transporte ↓ 8% vs mes anterior", "type": "trend" }
                ],
                "alerts": [
                    { "text": "⚠️ Gastaste el doble en Entretenimiento este fin de semana", "type": "spending_alert" }
                ],
                "recommendedAction": {
                    "text": "Si reduces C$500 en restaurantes, llegarás a tu meta 2 meses antes.",
                    "type": "action"
                }
            }
        `;

        try {
            const response = await this.genAI.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            const responseText = response.text?.trim() || '';
            // Strip markdown code blocks if present
            const clean = responseText.replace(/^```json?\n?/i, '').replace(/```$/i, '').trim();
            return JSON.parse(clean);
        } catch (error) {
            this.logger.error('Error calling Gemini for dashboard insights', error);
            return null;
        }
    }

    async chatWithFinancialCoach(userMessage: string, history: any[], userDataContext: any): Promise<string> {
        this.logger.log(`[Chat] Received: "${userMessage.substring(0, 60)}"`);
        if (!this.genAI) {
            this.logger.error('GenAI instance not found');
            return 'Lo siento, el asistente no está disponible en este momento.';
        }

        const prompt = `
            You are a strict, professional yet empathetic Financial Coach named "FinSmart Assistant".
            Your only goal is to help the user improve their personal finances, stick to their budget, and achieve their financial goals.
            You MUST NOT answer any questions or engage in conversations that are NOT related to finance, money, budgeting, savings, investments, or the user's specific financial context. If the user asks something non-financial, politely decline and steer the conversation back to finances.
            Respond in Spanish, keep it concise but helpful.

            User's Current Context (for your reference):
            ${JSON.stringify(userDataContext, null, 2)}

            Conversation History:
            ${JSON.stringify(history, null, 2)}

            User's New Message:
            "${userMessage}"

            Respond only with your next message to the user.
        `;

        try {
            this.logger.log('[Chat] Calling Gemini 3 Flash Preview...');
            const response = await this.genAI.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            // Log the full structure to understand the response
            this.logger.log('[Chat] Raw response keys: ' + Object.keys(response).join(', '));
            this.logger.log('[Chat] response.text type: ' + typeof response.text);
            this.logger.log('[Chat] response.text value: ' + JSON.stringify(response.text));

            // Try multiple ways to extract text
            let text = '';
            if (typeof response.text === 'string') {
                text = response.text.trim();
            } else if (typeof (response as any).text === 'function') {
                text = (response as any).text().trim();
            } else if ((response as any).candidates?.[0]?.content?.parts?.[0]?.text) {
                text = (response as any).candidates[0].content.parts[0].text.trim();
            }

            this.logger.log('[Chat] Extracted text: ' + text.substring(0, 100));
            return text || 'No pude generar una respuesta.';
        } catch (error) {
            this.logger.error('Error in chat generation', error);
            return 'Hubo un error procesando tu mensaje. Intenta de nuevo más tarde.';
        }
    }
}
