import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/weather/route";
import { forecast, json, mockFetch } from "../helpers";

afterEach(() => vi.unstubAllGlobals());

const call = (query: string) => GET(new Request(`http://localhost/api/weather?${query}`));

describe("GET /api/weather", () => {
  it("rejects a missing or invalid place", async () => {
    expect((await call("lat=200&lon=21&tz=Europe/Bucharest")).status).toBe(400);
    expect((await call("lat=45&lon=21")).status).toBe(400);
  });

  it("returns the weather", async () => {
    mockFetch(() => json(forecast({ is_day: 0 })));
    const response = await call("lat=45.75&lon=21.23&tz=Europe/Bucharest");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      temperature: 11.7,
      weatherCode: 61,
      windSpeed: 11.9,
      isDay: false,
      high: 15.9,
      low: 8.2,
    });
  });

  it("returns 502 when the service fails", async () => {
    mockFetch(() => json({ error: true }, 500));
    expect((await call("lat=45.75&lon=21.23&tz=Europe/Bucharest")).status).toBe(502);
  });
});
