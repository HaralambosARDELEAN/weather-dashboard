/** A painted picture and what it was made from. */
export type Picture = {
  id: string;
  /** A data URL (WebP). */
  image: string;
  prompt: string;
  /** The place names in panel order. */
  names: string[];
  /** The place ids in panel order, to tell when the window no longer shows these places. */
  placeIds: string;
  createdAt: number;
  /** How long the painting took, in whole seconds. */
  seconds: number;
};

const dateTime = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** "30 Oct 2026, 12:15 AM" in the viewer's own time. */
export function paintedAt(picture: Pick<Picture, "createdAt">): string {
  return dateTime.format(picture.createdAt);
}
