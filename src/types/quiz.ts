export type QuizStep = "intro" | "quiz" | "results";

export type SensitivityCategory = "Social" | "Mechanical" | "General";

export type QuizOption = {
  id: string;
  label: string;
  value: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  category: SensitivityCategory;
  options: QuizOption[];
};

export type QuizAnswers = Record<string, number>; // Maps question ID to option value

export type SensitivityId = "standard" | "mechanical" | "social";

export type FilterPreselection = {
  sensitivityId: SensitivityId;
  safeSpaceIds: string[];
};

export type SensitivityResult = {
  title: string;
  description: string;
  intensityMessage?: string;
  recommendedFilters: string[];
  suggestedSpaces?: string[];
  preselection: FilterPreselection;
};
