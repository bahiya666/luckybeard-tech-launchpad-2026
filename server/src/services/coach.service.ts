// src/services/coach.service.ts
import { prisma } from "../config/prisma.js";
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
You are a super-intelligent AI Productivity Coach.
Your task is to analyze a user's todos and provide advanced actionable insights.
Return ONLY JSON in the following format:

{
  "summary": "...",                // concise overview of user's todo status
  "priorityOrder": [               // todos sorted by priority with reasoning
    { "title": "...", "reason": "..." }
  ],
  "bottlenecks": [                 // tasks likely to delay completion
    { "title": "...", "reason": "..." }
  ],
  "metrics": {                     // high-level todo stats
    "total": 0,
    "pending": 0,
    "inProgress": 0,
    "done": 0,
    "overdue": 0
  },
  "tips": ["...", "..."]           // actionable tips and motivational advice
}

Guidelines:
- Evaluate urgency, impact, and estimated time for each task to determine priority.
- Detect tasks that may block progress and include them in 'bottlenecks'.
- Provide actionable tips to improve focus, break down large tasks, and maintain momentum.
- Do NOT include text outside the JSON.
`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 500
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

export const coachService = {
  getCoachingForUser: async (userId: number) => {
    const todos = await prisma.todo.findMany({
  where: { userId },
  select: {
    title: true,
    description: true,
    status: true,
    priority: true,
    estimatedTimeMinutes: true,
    subtasks: true, // JSON field
    createdAt: true,
    updatedAt: true
  },
  orderBy: { createdAt: "desc" }
});


    // Convert todos to JSON string to pass to AI
    const raw = await callHuggingFace(JSON.stringify(todos));

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed) {
      return {
        summary: "Could not parse AI response",
        priorityOrder: [],
        bottlenecks: [],
        metrics: {
          total: todos.length,
          pending: todos.filter(t => t.status === "PENDING").length,
          inProgress: todos.filter(t => t.status === "IN_PROGRESS").length,
          done: todos.filter(t => t.status === "DONE").length,
          overdue: 0
        },
        tips: ["Try again later."]
      };
    }

    // Ensure default structure for safety
    parsed.priorityOrder = parsed.priorityOrder || [];
    parsed.bottlenecks = parsed.bottlenecks || [];
    parsed.metrics = parsed.metrics || {
      total: todos.length,
      pending: todos.filter(t => t.status === "PENDING").length,
      inProgress: todos.filter(t => t.status === "IN_PROGRESS").length,
      done: todos.filter(t => t.status === "DONE").length,
      overdue: 0
    };
    parsed.tips = parsed.tips || ["Stay focused and take small steps!"];
    parsed.summary = parsed.summary || "No summary available.";

    return parsed;
  }
};
