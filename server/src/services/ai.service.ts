// src/services/ai.service.ts
import { env } from "../config/env.js";

const HF_API_KEY = env.HF_API_KEY;

async function callHuggingFace(prompt: string) {
  if (!HF_API_KEY) throw new Error("HF_API_KEY not configured");

  const body = {
    model: "meta-llama/Llama-3.2-3B-Instruct",
    messages: [
      {
        role: "system",
        content: `
You are a super-intelligent AI Productivity Assistant.
Your task is to take a natural-language request from a user and convert it into a highly detailed TODO item.
Your response MUST be strictly JSON with the following structure:
{
  "title": "...",
  "description": "...",
  "status": "PENDING" | "IN_PROGRESS" | "DONE",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "estimatedTimeMinutes": number,
  "subtasks": [
    { "title": "...", "estimatedTimeMinutes": number }
  ],
  "tips": ["...", "..."]
}

Guidelines:
- Break down complex tasks into actionable subtasks with time estimates.
- Assign a priority based on urgency and impact, and include reasoning in the tips.
- Provide motivational tips to help the user complete the task.
- If the user request is vague, infer a meaningful title and description.
- Do NOT include any text outside the JSON.
        `
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 400
  };

  const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`HuggingFace API error: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  return content || "";
}

export const aiService = {
  generateTodoFromPrompt: async (userId: number, prompt: string) => {
    const raw = await callHuggingFace(prompt);

    let parsed: any = null;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const result = {
      title: "AI Generated Todo",
      description: null,
      status: "PENDING",
      priority: "MEDIUM",
      estimatedTimeMinutes: 60,
      subtasks: [],
      tips: ["Stay focused and start small!"]
    };

    if (parsed) {
      if (parsed.title) result.title = parsed.title;
      if (parsed.description) result.description = parsed.description;
      if (parsed.status) {
        const s = parsed.status.toUpperCase();
        if (["PENDING", "IN_PROGRESS", "DONE"].includes(s)) {
          result.status = s as any;
        }
      }
      if (parsed.priority) result.priority = parsed.priority.toUpperCase();
      if (parsed.estimatedTimeMinutes) result.estimatedTimeMinutes = parsed.estimatedTimeMinutes;
      if (parsed.subtasks) result.subtasks = parsed.subtasks;
      if (parsed.tips) result.tips = parsed.tips;
    }

    return result;
  }
};
