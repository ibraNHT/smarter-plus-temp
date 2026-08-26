/**
 * Human label for an offer's unit of measure.
 *
 * `offer.unit` is a free-form `String` column, not an enum, and the two sellers
 * write it differently: Connect's producer form posts the `UnitOfMeasure` enum
 * ("UNIT", "HOUR"), while AgriAdmin's retail form posts its own list ("Unit",
 * "Pack", "Plastic bag", "litres"). Interpolating that straight into
 * `t(`unit.${offer.unit}`)` therefore missed the catalogue for every retail
 * product, and the translator returns the key verbatim on a miss — which is why
 * "unit.Unit" rendered on screen.
 *
 * Two-step resolution: match case-insensitively so "Unit" and "UNIT" both hit
 * the catalogue, and otherwise fall back to the raw stored value, which the
 * retail admin already typed as readable text. The raw key can never surface.
 */
export function unitLabel(t: (key: string) => string, unit?: string | null): string {
  const raw = String(unit ?? '').trim();
  if (!raw) return '';
  const key = `unit.${raw.toUpperCase()}`;
  const label = t(key);
  return label === key ? raw : label;
}
