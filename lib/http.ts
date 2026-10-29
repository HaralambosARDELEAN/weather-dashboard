/** An error whose message is written for the user. `slot` says which of the four places caused it. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly slot?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & {
  timeoutMs: number;
  timeoutMessage: string;
  networkMessage: string;
};

// AbortSignal.timeout() makes fetch throw an error named "TimeoutError".
function isTimeout(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError";
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * fetch with a timeout. Timeouts and network failures become ApiErrors;
 * HTTP error statuses are returned so the caller can decide what they mean.
 */
export async function request(url: string, options: RequestOptions) {
  const { timeoutMs, timeoutMessage, networkMessage, ...init } = options;
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const body = parseJson(await response.text());
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    if (isTimeout(error)) throw new ApiError(timeoutMessage, 504);
    throw new ApiError(networkMessage, 502);
  }
}

/** Turns any error into a JSON response. Unexpected errors are logged, not shown. */
export function errorResponse(error: unknown, extra: Record<string, unknown> = {}): Response {
  if (error instanceof ApiError) {
    const slot = error.slot === undefined ? {} : { slot: error.slot };
    return Response.json({ error: error.message, ...slot, ...extra }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
}
