export const ICON_CATEGORIES = [
  {
    title: "Health & Fitness",
    icons: ["heart", "water", "bicycle", "walk", "bed", "medkit"],
  },
  {
    title: "Productivity",
    icons: ["square", "hammer", "pencil", "book", "alarm"],
  },
  {
    title: "Lifestyle & Fun",
    icons: [
      "musical-note",
      "cafe",
      "pizza",
      "game-controller",
      "headset",
      "camera",
      "brush",
      "airplane",
    ],
  },
  {
    title: "Other",
    icons: [
      "moon",
      "sunny",
      "leaf",
      "flame",
      "trophy",
      "ribbon",
      "eye",
      "bulb",
      "code-slash",
      "language",
      "paw",
      "rose",
      "earth",
    ],
  },
];

export const HABIT_ICONS = ICON_CATEGORIES.flatMap((c) => c.icons);
