// Shared TypeScript types for the Self Discovery feature.
// Keeping these in one place makes the quiz/results easier to maintain.

export type QuizStep = "intro" | "quiz" | "results";

export type SensitivityCategory =
  | "socialNoise"
  | "mechanicalSounds"
  | "crowdedSpaces"
  | "suddenSounds"
  | "quietPreference";

export type QuizOption = {
  id: string;
  label: string;
  score: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  category: SensitivityCategory;
  options: QuizOption[];
};

export type QuizAnswers = Record<string, string>;

export type SensitivityResult = {
  title: string;
  description: string;
  categories: {
    label: string;
    description: string;
  }[];
};