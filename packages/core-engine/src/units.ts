export type Unit = "ft" | "in" | "cm" | "m";

export function toInches(value: number, unit: Unit): number {
  switch (unit) {
    case "ft":
      return value * 12;
    case "cm":
      return value / 2.54;
    case "m":
      return (value * 100) / 2.54;
    case "in":
    default:
      return value;
  }
}

export function fromInches(value: number, unit: Unit): number {
  switch (unit) {
    case "ft":
      return value / 12;
    case "cm":
      return value * 2.54;
    case "m":
      return (value * 2.54) / 100;
    case "in":
    default:
      return value;
  }
}

export function formatDimension(valueInInches: number): string {
  return `${valueInInches}"`;
}
