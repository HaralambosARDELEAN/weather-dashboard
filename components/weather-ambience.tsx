import { describeWeather } from "@/lib/weather-codes";

function Layer({ name }: { name: string }) {
  return <div aria-hidden="true" className={`ambience ambience-${name}`} />;
}

/** A quiet moving sky behind a card: sun or moon, drifting clouds, rain, snow, fog. Decorative only. */
export function WeatherAmbience({ code, isDay }: { code: number; isDay: boolean }) {
  switch (describeWeather(code).kind) {
    case "clear":
      return isDay ? (
        <Layer name="sun" />
      ) : (
        <>
          <Layer name="stars" />
          <Layer name="moon" />
        </>
      );
    case "cloudy":
      return <Layer name={isDay ? "clouds" : "clouds-night"} />;
    case "fog":
      return <Layer name="fog" />;
    case "rain":
      return <Layer name="rain" />;
    case "snow":
      return <Layer name="snow" />;
    case "storm":
      return (
        <>
          <Layer name="rain" />
          <Layer name="flash" />
        </>
      );
  }
}
