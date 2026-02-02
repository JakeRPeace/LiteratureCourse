import type { APIRoute } from "astro";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { checkRateLimit, getAuthUser } from "../../lib/api-guards";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000)
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(12)
});

const courseSchema = z.object({
  title: z.string().min(3).max(120),
  course_type: z.string().min(3).max(80),
  summary: z.string().min(10).max(240),
  books: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        author: z.string().min(1).max(80)
      })
    )
    .length(3)
});

const systemPrompt = [
  "You are drafting a private literature course for a reader.",
  "Return a concise course payload only, no markdown.",
  "Use real, widely published books with commonly listed author names; avoid invented titles.",
  "Use a short course title, a short course_type label (1-3 words, genre or theme),",
  "and a 1-2 sentence summary.",
  "Provide exactly three distinct books with title and author."
].join(" ");

const RATE_LIMIT = { limit: 8, windowMs: 60_000 };

export const POST: APIRoute = async ({ request }) => {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { allowed, retryAfter } = await checkRateLimit(
    `course-chat:${user.id}`,
    RATE_LIMIT
  );
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL) {
    return Response.json(
      { error: "AI gateway key not configured." },
      { status: 500 }
    );
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch (error) {
    return Response.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const modelId =
    process.env.AI_GATEWAY_MODEL || "google/gemini-2.5-flash-lite";

  const prompt = payload.messages
    .slice(-8)
    .map((message) => {
      const role = message.role === "user" ? "User" : "Assistant";
      return `${role}: ${message.content}`;
    })
    .join("\n");

  try {
    const { object } = await generateObject({
      model: gateway.languageModel(modelId),
      system: systemPrompt,
      prompt,
      schema: courseSchema,
      temperature: 0.4
    });

    return Response.json({ course: object }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "Failed to generate course draft." },
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async () => {
  return Response.json({ error: "Method not allowed." }, { status: 405 });
};
