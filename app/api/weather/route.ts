import { z } from "zod";
import { ApiError, errorResponse } from "@/lib/http";
import { getWeather } from "@/lib/open-meteo";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  tz: z.string().min(1).max(64),
});

export async function GET(request: Request) {
  try {
    const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) throw new ApiError("The place in the request is not valid.", 400);

    const { lat, lon, tz } = query.data;
    const weather = await getWeather({ latitude: lat, longitude: lon, timezone: tz });
    return Response.json(weather);
  } catch (error) {
    return errorResponse(error);
  }
}
