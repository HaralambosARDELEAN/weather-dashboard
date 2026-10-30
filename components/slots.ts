// Each card has a colour and a place in the painting, in panel order: top left, top right, bottom left, bottom right.
// The colour marks the card's stamp, its name and its line in the prompt.
export const SLOT_COLORS = ["var(--color-verm)", "var(--color-rose)", "var(--color-violet)", "var(--color-spruce)"] as const;
export const SLOT_KEYS = ["tl", "tr", "bl", "br"] as const;
// How far each card's postmark is tilted, so the four do not look stamped by a machine.
export const POSTMARK_TILT = ["-7deg", "5deg", "-11deg", "-3deg"] as const;
