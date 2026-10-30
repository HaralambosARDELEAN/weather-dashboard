import { describeWeather } from "@/lib/weather-codes";

function Layer({ name }: { name: string }) {
  return <div aria-hidden="true" className={`ambience ambience-${name}`} />;
}

/** Three layers of rain at different depths: far, middle and near. */
function Rain() {
  return (
    <div aria-hidden="true" className="ambience overflow-hidden">
      <div className="rain-layer rain-far" />
      <div className="rain-layer rain-mid" />
      <div className="rain-layer rain-near" />
    </div>
  );
}

/** A quiet moving sky behind a card: sun or moon light, drifting clouds, rain, snow, fog. Decorative only. */
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
      return <Rain />;
    case "snow":
      return <Layer name="snow" />;
    case "storm":
      return (
        <>
          <Rain />
          <Layer name="flash" />
        </>
      );
  }
}
