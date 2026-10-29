import { z } from "zod";
import { placeSchema, type Place } from "./schemas";

export const SLOT_COUNT = 4;
export type Slots = readonly (Place | null)[];

const STORAGE_KEY = "weather-dashboard:places:v1";
const slotsSchema = z.array(placeSchema.nullable()).length(SLOT_COUNT);
const EMPTY: Slots = Array.from({ length: SLOT_COUNT }, () => null);

/** Reads saved slots. Anything broken or from an older version gives four empty slots. */
export function parseSlots(raw: string | null): Slots {
  if (!raw) return EMPTY;
  try {
    const parsed = slotsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY;
  } catch {
    return EMPTY;
  }
}

// A tiny store over localStorage, read by React with useSyncExternalStore.
let cache: Slots | null = null;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): Slots | null {
  if (cache === null) {
    try {
      cache = parseSlots(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      cache = EMPTY; // storage blocked: the dashboard still works for this visit
    }
  }
  return cache;
}

/** The server has no localStorage; null makes the page render a placeholder first. */
export function getServerSnapshot(): Slots | null {
  return null;
}

export function updateSlots(next: Slots) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: keep the change for this visit only
  }
  listeners.forEach((listener) => listener());
}
