import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/image/route";
import { forecast, geoResult, json, mockFetch, timeoutError } from "../helpers";

const call = (body: unknown) =>
  POST(new Request("http://localhost/api/image", { method: "POST", body: JSON.stringify(body) }));

const ids = { placeIds: [1, 2, 3, 4] };
const image = () => json({ data: [{ b64_json: "aGVsbG8=" }] });
const isOpenAI = (url: unknown) => String(url).startsWith("https://api.openai.com/");

/** Open-Meteo answers normally unless `weatherFor` says otherwise; `openai` decides what the image model does. */
function services(
  openai: () => Response | Promise<Response>,
  weatherFor: (id: number) => Response | Promise<Response> = () => json(forecast()),
) {
  return mockFetch((url) => {
    const { searchParams } = new URL(url);
    if (url.includes("/v1/get")) {
      const id = Number(searchParams.get("id"));
      // The latitude carries the id, so the forecast mock below knows which place it is.
      return json({ ...geoResult(id, `City ${id}`), latitude: id });
    }
    if (url.includes("/v1/forecast")) return weatherFor(Number(searchParams.get("latitude")));
    if (isOpenAI(url)) return openai();
    throw new Error(`Unexpected request to ${url}`);
  });
}

beforeEach(() => vi.stubEnv("OPENAI_API_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/image", () => {
  it("needs exactly four place ids", async () => {
    expect((await call({ placeIds: [1, 2, 3] })).status).toBe(400);
  });

  it("returns the image and the prompt", async () => {
    const fake = services(image);
    const response = await call(ids);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.image).toBe("data:image/webp;base64,aGVsbG8=");
    expect(body.prompt).toContain("Top left: City 1");
    expect(body.prompt).toContain("Bottom right: City 4");

    const [, init] = fake.mock.calls.find(([url]) => isOpenAI(url))!;
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-key");
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: "gpt-image-2.5-flare", size: "1024x1024" });
  });

  it("uses OPENAI_IMAGE_MODEL when set", async () => {
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-2");
    const fake = services(image);
    await call(ids);
    const [, init] = fake.mock.calls.find(([url]) => isOpenAI(url))!;
    expect(JSON.parse(String(init?.body)).model).toBe("gpt-image-2");
  });

  it("names the slot whose weather failed", async () => {
    services(image, (id) => (id === 3 ? Promise.reject(timeoutError()) : json(forecast())));
    const response = await call(ids);
    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({ slot: 2 });
  });

  it("explains a refusal and returns the prompt", async () => {
    services(() => json({ error: { message: "blocked", code: "moderation_blocked" } }, 400));
    const response = await call(ids);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("refused");
    expect(body.prompt).toContain("Top left");
  });

  it("explains a timeout", async () => {
    services(() => Promise.reject(timeoutError()));
    const response = await call(ids);
    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({
      error: "The image model did not answer within 90 seconds. Try again.",
    });
  });

  it("explains a missing key without calling OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fake = services(image);
    const response = await call(ids);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("OPENAI_API_KEY") });
    expect(fake.mock.calls.some(([url]) => isOpenAI(url))).toBe(false);
  });

  it("explains a rejected key, no credit and rate limits", async () => {
    services(() => json({ error: { message: "bad key", code: "invalid_api_key" } }, 401));
    expect((await call(ids)).status).toBe(500);

    services(() => json({ error: { message: "no money", code: "insufficient_quota" } }, 429));
    await expect((await call(ids)).json()).resolves.toMatchObject({ error: expect.stringContaining("credit") });

    services(() => json({ error: { message: "slow down", code: "rate_limit_exceeded" } }, 429));
    expect((await call(ids)).status).toBe(429);
  });
});
