import { PANEL_POSITIONS } from "./prompt";
import { describeWeather } from "./weather-codes";

/** One panel's line of the prompt, read back into its parts (buildPrompt writes them in a fixed form). */
export type PanelLine = {
  index: number;
  position: (typeof PANEL_POSITIONS)[number];
  /** The line without its "Top left:" prefix. */
  text: string;
  name: string;
  country: string;
  /** "at night", "in the afternoon"… */
  when: string;
  night: boolean;
  /** Rounded °C at the time of painting; null if the line has none. */
  temperature: number | null;
  /** The WMO code whose scene the line describes; null if none matches. */
  code: number | null;
};

const WHEN = /^(.*?), (at night|in the (?:early morning|late morning|afternoon|evening))\b/;

// Every code with a known description, so a scene in the prompt can be traced back to its code.
const KNOWN_CODES = Array.from({ length: 100 }, (_, code) => code).filter((code) => describeWeather(code).label !== "Unknown conditions");

function parsePanel(index: number, text: string): PanelLine {
  const when = WHEN.exec(text);
  const label = when ? when[1] : text;
  const labelParts = label.split(", ");
  const temperature = /at (-?\d+)°C/.exec(text);
  const code = KNOWN_CODES.find((c) => text.includes(`Weather: ${describeWeather(c).scene},`));
  return {
    index,
    position: PANEL_POSITIONS[index],
    text,
    name: labelParts[0],
    // placeLabel leaves out a country that equals the name (Singapore), so a one-part label is both.
    country: labelParts[labelParts.length - 1],
    when: when ? when[2] : "",
    night: when?.[2] === "at night",
    temperature: temperature ? Number(temperature[1]) : null,
    code: code ?? null,
  };
}

/** The four panel lines in picture order, and the other lines (style and rules) in their original order. */
export function splitPrompt(prompt: string): { panels: PanelLine[]; rules: string[] } {
  const panels: PanelLine[] = [];
  const rules: string[] = [];
  for (const line of prompt.split("\n")) {
    const index = PANEL_POSITIONS.findIndex((position) => line.startsWith(`${position}:`));
    if (index === -1) rules.push(line);
    else panels.push(parsePanel(index, line.slice(PANEL_POSITIONS[index].length + 1).trim()));
  }
  panels.sort((a, b) => a.index - b.index);
  return { panels, rules };
}

/** Alt text for the painting: "2×2 painting. Top left: Timișoara at night, overcast. …" */
export function paintingAlt(panels: PanelLine[]): string {
  const described = panels.map((panel) => {
    const weather = panel.code === null ? "" : `, ${describeWeather(panel.code).label.toLowerCase()}`;
    return `${panel.position}: ${panel.name}${panel.when ? ` ${panel.when}` : ""}${weather}.`;
  });
  return ["2×2 painting.", ...described].join(" ");
}
