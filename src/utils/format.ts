// Packaging weights are captured in grams, because that is how reference
// packaging is measured. Everything the user reads is shown in kilograms,
// which is the unit EPR submissions are made in.

/** Grams to a kilogram figure, e.g. 45 -> "0.045 kg". */
export const formatKg = (grams: number): string => `${toKg(grams).toFixed(3)} kg`;

/** Grams to a kilogram number, for charts and CSV columns. */
export const toKg = (grams: number): number => Math.round((grams / 1000) * 1000) / 1000;

/** Short form without the unit, for table cells that already have a "(kg)" header. */
export const kgValue = (grams: number): string => toKg(grams).toFixed(3);
