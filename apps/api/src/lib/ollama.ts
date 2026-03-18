import { config } from './config';
import type { LLMRequest, LLMResponse } from '@devworkflow/shared';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || config.ollamaBaseUrl;
    this.defaultModel = model || config.ollamaModel;
  }

  async chat(messages: ChatMessage[], options?: { model?: string; temperature?: number }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as LLMResponse;
    return data.message.content;
  }

  async *streamChat(messages: ChatMessage[], options?: { model?: string; temperature?: number }): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line) as { message?: { content?: string } };
            if (json.message?.content) {
              yield json.message.content;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }
  }

  async generatePlan(idea: string, existingContext?: string): Promise<string> {
    const systemPrompt = `You are an expert software architect and project planner. 
Given an idea or feature request, create a detailed, actionable development plan.
Break down the plan into clear phases with specific tasks.
Include technical considerations, dependencies, and potential risks.
Format the plan in markdown with clear sections and bullet points.`;

    const userPrompt = existingContext
      ? `Based on the following idea and existing context, create a comprehensive development plan:

Idea: ${idea}

Existing Context:
${existingContext}

Create a detailed plan with phases, tasks, and technical considerations.`
      : `Create a comprehensive development plan for the following idea:

${idea}

Include phases, specific tasks, technical considerations, dependencies, and potential risks.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.5 });
  }

  async refinePlan(currentPlan: string, feedback: string): Promise<string> {
    const systemPrompt = `You are an expert software architect and project planner.
Refine and improve development plans based on user feedback.
Maintain the markdown format and structure.
Be specific and actionable in your improvements.`;

    const userPrompt = `Refine the following development plan based on this feedback:

Current Plan:
${currentPlan}

Feedback:
${feedback}

Provide an improved version of the plan.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.5 });
  }
}

export const ollama = new OllamaClient();