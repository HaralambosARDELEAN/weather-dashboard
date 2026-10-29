import { z } from "zod";
import { ApiError, errorResponse } from "@/lib/http";
import { searchPlaces } from "@/lib/open-meteo";

const querySchema = z.string().trim().min(2).max(100);

export async function GET(request: Request) {
  // Read the request before the try block: Next.js signals "this route is dynamic"
  // by throwing here during the build, and that signal must not be caught.
  const query = querySchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  try {
    if (!query.success) throw new ApiError("Type at least 2 characters to search.", 400);

    const results = await searchPlaces(query.data);
    return Response.json({ results });
  } catch (error) {
    return errorResponse(error);
  }
}
