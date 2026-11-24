import { z } from "zod";
import { paintCounters } from "@/lib/cloudflare";
import { ApiError, errorResponse } from "@/lib/http";
import { getPlace, getWeather } from "@/lib/open-meteo";
import { generateImage } from "@/lib/openai-image";
import { limitMessage, takePaint, visitorKey } from "@/lib/paint-limit";
import { buildPrompt, type PromptEntry } from "@/lib/prompt";
import { assertOwnPage, clientIp, limitRequests } from "@/lib/request-guard";

// The browser sends only place ids. Names, coordinates and weather are fetched here,
// so every number in the prompt comes from the weather API and nothing else.
const bodySchema = z.object({ placeIds: z.array(z.number().int().positive()).length(4) });

async function loadEntry(id: number, slot: number): Promise<PromptEntry> {
  try {
    const place = await getPlace(id);
    const weather = await getWeather(place);
    return { place, weather };
  } catch (error) {
    if (error instanceof ApiError) throw new ApiError(error.message, error.status, slot);
    throw error;
  }
}

export async function POST(request: Request) {
  let prompt: string | undefined;
  try {
    assertOwnPage(request);
    await limitRequests(request);
    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) throw new ApiError("Add four places before generating the picture.", 400);

    const entries = await Promise.all(body.data.placeIds.map(loadEntry));
    prompt = buildPrompt(entries);

    // On the public demo every painting costs the owner money, so each visitor and each day get a few.
    // Counted only now, just before the paid call, so a request with made-up places uses up nothing.
    const counters = paintCounters();
    if (counters) {
      const verdict = await takePaint(counters, await visitorKey(clientIp(request)), Date.now());
      if (!verdict.ok) throw new ApiError(limitMessage(verdict), 429);
    }

    const image = await generateImage(prompt);
    return Response.json({ image, prompt });
  } catch (error) {
    return errorResponse(error, prompt ? { prompt } : {});
  }
}
