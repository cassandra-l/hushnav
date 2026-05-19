import type {
  QuizQuestion,
  QuizAnswers,
  FilterPreselection,
  SensitivityResult,
} from "../types/quiz";

const ALL_SAFE_SPACE_IDS = [
  "park",
  "library",
  "museum",
  "church",
  "synagogue",
];

const FLEXIBLE_LISTENER_PRESELECTION: FilterPreselection = {
  sensitivityId: "standard",
  safeSpaceIds: [...ALL_SAFE_SPACE_IDS],
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "Q1",
    question:
      "How tiring do you find crowded cafés or food courts with lots of conversations happening at once?",
    category: "Social",
    options: [
      { id: "q1-1", label: "Doesn’t bother me", value: 1 },
      { id: "q1-2", label: "Slightly noticeable", value: 2 },
      { id: "q1-3", label: "Sometimes overwhelming", value: 3 },
      { id: "q1-4", label: "Often draining", value: 4 },
      { id: "q1-5", label: "I avoid this when possible", value: 5 },
    ],
  },
  {
    id: "Q2",
    question:
      "How uncomfortable are construction sounds like drilling, hammering, or machinery?",
    category: "Mechanical",
    options: [
      { id: "q2-1", label: "Doesn’t bother me", value: 1 },
      { id: "q2-2", label: "Slightly noticeable", value: 2 },
      { id: "q2-3", label: "Sometimes overwhelming", value: 3 },
      { id: "q2-4", label: "Often draining", value: 4 },
      { id: "q2-5", label: "I avoid this when possible", value: 5 },
    ],
  },
  {
    id: "Q3",
    question:
      "Busy shopping centres or train stations make it difficult for me to relax.",
    category: "Social",
    options: [
      { id: "q3-1", label: "Doesn’t bother me", value: 1 },
      { id: "q3-2", label: "Slightly noticeable", value: 2 },
      { id: "q3-3", label: "Sometimes overwhelming", value: 3 },
      { id: "q3-4", label: "Often draining", value: 4 },
      { id: "q3-5", label: "I avoid this when possible", value: 5 },
    ],
  },
  {
    id: "Q4",
    question:
      "Sudden sounds like sirens, honking, or loud engines easily startle me.",
    category: "Mechanical",
    options: [
      { id: "q4-1", label: "Doesn’t bother me", value: 1 },
      { id: "q4-2", label: "Slightly noticeable", value: 2 },
      { id: "q4-3", label: "Sometimes overwhelming", value: 3 },
      { id: "q4-4", label: "Often draining", value: 4 },
      { id: "q4-5", label: "I avoid this when possible", value: 5 },
    ],
  },
  //   {
  //     id: "Q5",
  //     question: "After spending time in noisy places, I feel mentally drained.",
  //     category: "General",
  //     options: [
  //       { id: "q5-1", label: "Doesn’t bother me", value: 1 },
  //       { id: "q5-2", label: "Slightly noticeable", value: 2 },
  //       { id: "q5-3", label: "Sometimes overwhelming", value: 3 },
  //       { id: "q5-4", label: "Often draining", value: 4 },
  //       { id: "q5-5", label: "I avoid this when possible", value: 5 },
  //     ],
  //   },
  {
    id: "Q6",
    question:
      "Background chatter makes it harder for me to focus or think clearly.",
    category: "Social",
    options: [
      { id: "q6-1", label: "Doesn’t bother me", value: 1 },
      { id: "q6-2", label: "Slightly noticeable", value: 2 },
      { id: "q6-3", label: "Sometimes overwhelming", value: 3 },
      { id: "q6-4", label: "Often draining", value: 4 },
      { id: "q6-5", label: "I avoid this when possible", value: 5 },
    ],
  },
  {
    id: "Q7",
    question: "I avoid streets with heavy traffic because of the sound.",
    category: "Mechanical",
    options: [
      { id: "q7-1", label: "Doesn’t bother me", value: 1 },
      { id: "q7-2", label: "Slightly noticeable", value: 2 },
      { id: "q7-3", label: "Sometimes overwhelming", value: 3 },
      { id: "q7-4", label: "Often draining", value: 4 },
      { id: "q7-5", label: "I avoid this when possible", value: 5 },
    ],
  },
  //   {
  //     id: "Q8",
  //     question: "If I have the choice, I usually prefer quieter environments.",
  //     category: "General",
  //     options: [
  //       { id: "q8-1", label: "Doesn’t bother me", value: 1 },
  //       { id: "q8-2", label: "Slightly noticeable", value: 2 },
  //       { id: "q8-3", label: "Sometimes overwhelming", value: 3 },
  //       { id: "q8-4", label: "Often draining", value: 4 },
  //       { id: "q8-5", label: "I avoid this when possible", value: 5 },
  //     ],
  //   },
];

export function calculateSensitivityResult(
  answers: QuizAnswers,
): SensitivityResult {
  const socialScore =
    (answers["Q1"] || 0) + (answers["Q3"] || 0) + (answers["Q6"] || 0);
  const mechanicalScore =
    (answers["Q2"] || 0) + (answers["Q4"] || 0) + (answers["Q7"] || 0);
  //   const generalScore = (answers["Q5"] || 0) + (answers["Q8"] || 0);

  let title = "Flexible Listener";
  let description =
    "You’re generally adaptable to different sound environments and may not be strongly affected by everyday noise. While busy spaces or loud sounds can occasionally feel tiring, you’re usually comfortable navigating a variety of environments. Quieter routes and calm spaces may still help improve focus, relaxation, or overall comfort during stressful or crowded moments.";
  let recommendedFilters: string[] = [
    "Optional Social Noise Filter",
    "Optional Mechanical Sounds Filter",
  ];
  let suggestedSpaces: string[] = ["Places You May Enjoy"];
  let preselection: FilterPreselection = FLEXIBLE_LISTENER_PRESELECTION;

  // Condition 1: Balanced Quiet Seeker
  if (socialScore >= 10 && mechanicalScore >= 10) {
    title = "Balanced Quiet Seeker";
    description =
      "You seem to prefer calmer, lower-stimulation environments overall. Both crowded social settings and harsh environmental sounds may feel mentally draining or overwhelming for you over time. You may feel more comfortable in quieter spaces, peaceful routes, or environments with fewer distractions. HushNav can help personalise your experience by reducing both social and mechanical noise exposure where possible.";
    recommendedFilters = ["Standard Sensitivity"];
    suggestedSpaces = ["Churches", "Libraries", "Museums", "Parks"];
    preselection = {
      sensitivityId: "standard",
      safeSpaceIds: ["church", "library", "museum", "park"],
    };
  }
  // Condition 2: Social Sound Sensitive
  else if (socialScore >= mechanicalScore + 3) {
    title = "Social Sound Sensitive";
    description =
      "Crowded and conversation-heavy environments may feel more draining for you. Places with constant background chatter, busy public spaces, or overlapping conversations can make it harder to focus, relax, or recharge. You may feel more comfortable in quieter social environments or routes with fewer crowds and less human activity.";
    recommendedFilters = ["Social Noise Filter"];
    suggestedSpaces = ["Libraries", "Parks"];
    preselection = {
      sensitivityId: "social",
      safeSpaceIds: ["library", "park"],
    };
  }
  // Condition 3: Mechanical Sound Sensitive
  else if (mechanicalScore >= socialScore + 3) {
    title = "Mechanical Sound Sensitive";
    description =
      "Harsh environmental sounds like traffic, construction, sirens, or machinery may affect your comfort more strongly. Sudden or repetitive loud sounds can feel distracting, stressful, or mentally exhausting over time. You may prefer calmer streets, indoor quiet spaces, or environments with reduced exposure to sharp mechanical noise.";
    recommendedFilters = ["Mechanical Sounds"];
    suggestedSpaces = ["Churches", "Museums"];
    preselection = {
      sensitivityId: "mechanical",
      safeSpaceIds: ["church", "museum"],
    };
  }

  // Intensity modifier calculation based on generalScore
  //   let intensityMessage = "";
  //   if (generalScore >= 8) {
  //     intensityMessage = "You seem to strongly prefer calm, low-stimulation environments.";
  //   } else if (generalScore <= 4) {
  //     intensityMessage = "You’re generally comfortable in a variety of sound environments.";
  //   }

  return {
    title,
    description,
    recommendedFilters,
    suggestedSpaces,
    preselection,
  };
}

/** Supports results saved before preselection was added. */
export function resolveFilterPreselection(
  result: SensitivityResult,
): FilterPreselection {
  if (result.preselection) {
    return result.preselection;
  }

  switch (result.title) {
    case "Balanced Quiet Seeker":
      return {
        sensitivityId: "standard",
        safeSpaceIds: ["church", "library", "museum", "park"],
      };
    case "Social Sound Sensitive":
      return {
        sensitivityId: "social",
        safeSpaceIds: ["library", "park"],
      };
    case "Mechanical Sound Sensitive":
      return {
        sensitivityId: "mechanical",
        safeSpaceIds: ["church", "museum"],
      };
    default:
      return FLEXIBLE_LISTENER_PRESELECTION;
  }
}
