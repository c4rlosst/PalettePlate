export const colours = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue-purple",
  "white-brown",
] as const;
export type Colour = (typeof colours)[number];
export const colourLabels: Record<Colour, string> = {
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  "blue-purple": "Blue / purple",
  "white-brown": "White / brown",
};
export function rainbowDay(foods: { colour: Colour; category: string }[]) {
  const eaten = [
    ...new Set(
      foods
        .filter((f) => f.category === "fruit" || f.category === "vegetable")
        .map((f) => f.colour),
    ),
  ];
  return {
    eaten,
    missing: colours.filter((c) => !eaten.includes(c)),
    count: eaten.length,
    complete: eaten.length >= 4,
  };
}
export function manilaDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function dayBounds(day: string) {
  const start = new Date(`${day}T00:00:00+08:00`);
  return { start, end: new Date(start.getTime() + 86400000) };
}
