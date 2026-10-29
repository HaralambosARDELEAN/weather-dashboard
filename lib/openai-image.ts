import { z } from "zod";
import { ApiError, request } from "./http";

const IMAGES_URL = "https://api.openai.com/v1/images/generations";
// OpenAI's fast image model. Override with OPENAI_IMAGE_MODEL in .env.
const DEFAULT_MODEL = "gpt-image-2.5-flare";

const successSchema = z.object({ data: z.array(z.object({ b64_json: z.string().min(1) })).min(1) });
const errorSchema = z.object({ error: z.object({ message: z.string().optional(), code: z.string().nullish() }) });

/** Generates one square image and returns it as a data URL. The key never leaves the server. */
export async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ApiError("Image generation is not set up: add OPENAI_API_KEY to the .env file and restart the app.", 500);
  }

  const response = await request(IMAGES_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL,
      prompt,
      size: "1024x1024",
      quality: "medium",
      output_format: "webp",
      output_compression: 80, // the lossless default is about 1.5 MB per image
    }),
    timeoutMs: 90_000,
    timeoutMessage: "The image model did not answer within 90 seconds. Try again.",
    networkMessage: "Could not reach the image model. Check your connection and try again.",
  });

  if (!response.ok) throw toApiError(response.status, response.body);

  const parsed = successSchema.safeParse(response.body);
  if (!parsed.success) throw new ApiError("The image model answered without an image. Try again.", 502);
  return `data:image/webp;base64,${parsed.data.data[0].b64_json}`;
}

function toApiError(status: number, body: unknown): ApiError {
  const parsed = errorSchema.safeParse(body);
  const code = parsed.success ? parsed.data.error.code : null;
  const detail = parsed.success ? parsed.data.error.message : undefined;

  if (code === "moderation_blocked") {
    return new ApiError("The image model refused this prompt. Replace one of the places and try again.", 422);
  }
  if (status === 401) return new ApiError("OpenAI rejected the API key. Check OPENAI_API_KEY in the .env file.", 500);
  if (code === "insufficient_quota") return new ApiError("The OpenAI account has no credit left. Add credit and try again.", 429);
  if (status === 429) return new ApiError("The image model is busy right now. Wait a minute and try again.", 429);
  return new ApiError(
    detail ? `The image model returned an error: ${detail}` : "The image model returned an error. Try again.",
    502,
  );
}
