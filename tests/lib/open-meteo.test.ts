import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlace, getWeather, searchPlaces } from "@/lib/open-meteo";
import { forecast, geoResult, json, mockFetch, timeoutError } from "../helpers";

afterEach(() => vi.unstubAllGlobals());

describe("searchPlaces", () => {
  it("maps results to places", async () => {
    mockFetch(() => json({ results: [geoResult(683506, "Timișoara")] }));
    await expect(searchPlaces("Timi")).resolves.toEqual([
      {
        id: 683506,
        name: "Timișoara",
        region: "Timiș",
        country: "Romania",
        latitude: 45.75,
        longitude: 21.23,
        timezone: "Europe/Bucharest",
      },
    ]);
  });

  it("asks for English names and at most 8 results", async () => {
    const fake = mockFetch(() => json({ results: [] }));
    await searchPlaces("Springfield");
    const url = new URL(String(fake.mock.calls[0][0]));
    expect(url.searchParams.get("name")).toBe("Springfield");
    expect(url.searchParams.get("count")).toBe("8");
    expect(url.searchParams.get("language")).toBe("en");
  });

  it("returns an empty list when nothing matches", async () => {
    mockFetch(() => json({ generationtime_ms: 0.1 }));
    await expect(searchPlaces("Xyzzyq")).resolves.toEqual([]);
  });

  it("skips results without a timezone", async () => {
    const noTimezone = { ...geoResult(1, "Nowhere"), timezone: undefined };
    mockFetch(() => json({ results: [noTimezone, geoResult(2, "Somewhere")] }));
    await expect(searchPlaces("where")).resolves.toMatchObject([{ id: 2 }]);
  });

  it("fails with 502 when the service answers with an error", async () => {
    mockFetch(() => json({ error: true, reason: "down" }, 500));
    await expect(searchPlaces("Timi")).rejects.toMatchObject({ status: 502 });
  });

  it("fails with 504 when the service is too slow", async () => {
    mockFetch(() => Promise.reject(timeoutError()));
    await expect(searchPlaces("Timi")).rejects.toMatchObject({ status: 504 });
  });
});

describe("when Open-Meteo is busy", () => {
  afterEach(() => vi.useRealTimers());
  const busy = () => json({ error: true, reason: "Too many concurrent requests" }, 429);

  it("waits and tries again", async () => {
    vi.useFakeTimers();
    let calls = 0;
    mockFetch(() => (++calls === 1 ? busy() : json(forecast())));
    const weather = getWeather({ latitude: 45.75, longitude: 21.23, timezone: "Europe/Bucharest" });
    await vi.runAllTimersAsync();
    await expect(weather).resolves.toMatchObject({ temperature: 11.7 });
    expect(calls).toBe(2);
  });

  it("gives up after two more tries", async () => {
    vi.useFakeTimers();
    let calls = 0;
    mockFetch(() => {
      calls++;
      return busy();
    });
    const search = searchPlaces("Timi");
    const outcome = expect(search).rejects.toMatchObject({ status: 502 });
    await vi.runAllTimersAsync();
    await outcome;
    expect(calls).toBe(3);
  });
});

describe("getPlace", () => {
  it("looks a place up by id", async () => {
    const fake = mockFetch(() => json(geoResult(683506, "Timișoara")));
    await expect(getPlace(683506)).resolves.toMatchObject({ id: 683506, name: "Timișoara" });
    expect(String(fake.mock.calls[0][0])).toContain("/v1/get?id=683506");
  });

  it("fails with 502 for an unknown id", async () => {
    mockFetch(() => json({ error: true, reason: "Location ID not found." }, 400));
    await expect(getPlace(1)).rejects.toMatchObject({ status: 502 });
  });
});

describe("getWeather", () => {
  const place = { latitude: 45.75, longitude: 21.23, timezone: "Europe/Bucharest" };

  it("maps the forecast to weather", async () => {
    mockFetch(() => json(forecast()));
    await expect(getWeather(place)).resolves.toEqual({
      temperature: 11.7,
      weatherCode: 61,
      windSpeed: 11.9,
      isDay: true,
      high: 15.9,
      low: 8.2,
    });
  });

  it("asks for Celsius, km/h and the place's own day", async () => {
    const fake = mockFetch(() => json(forecast()));
    await getWeather(place);
    const url = new URL(String(fake.mock.calls[0][0]));
    expect(url.searchParams.get("temperature_unit")).toBe("celsius");
    expect(url.searchParams.get("wind_speed_unit")).toBe("kmh");
    expect(url.searchParams.get("timezone")).toBe("Europe/Bucharest");
  });

  it("fails with 502 when the data cannot be read", async () => {
    mockFetch(() => json({ current: {} }));
    await expect(getWeather(place)).rejects.toMatchObject({ status: 502 });
  });
});
