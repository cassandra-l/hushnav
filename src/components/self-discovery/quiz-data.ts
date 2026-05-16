import type { QuizQuestion, QuizAnswers, SensitivityResult, SensitivityCategory } from "./types";

// These questions directly support AC 6.1.1.
// They ask about different sounds and environments that may affect Emily.
export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "How do you feel in a busy coffee shop with background chatter?",
    category: "socialNoise",
    options: [
      { id: "q1-a", label: "Energized and comfortable", score: 0 },
      { id: "q1-b", label: "It’s fine for short periods", score: 1 },
      { id: "q1-c", label: "Somewhat overwhelming", score: 2 },
      { id: "q1-d", label: "Very uncomfortable and stressed", score: 3 },
    ],
  },
  {
    id: "q2",
    question: "How much do construction sounds, traffic, or machinery affect you?",
    category: "mechanicalSounds",
    options: [
      { id: "q2-a", label: "They do not bother me", score: 0 },
      { id: "q2-b", label: "I notice them but can cope", score: 1 },
      { id: "q2-c", label: "They make it harder to focus", score: 2 },
      { id: "q2-d", label: "They quickly become overwhelming", score: 3 },
    ],
  },
  {
    id: "q3",
    question: "How comfortable are you in crowded spaces like train stations or shopping centres?",
    category: "crowdedSpaces",
    options: [
      { id: "q3-a", label: "Very comfortable", score: 0 },
      { id: "q3-b", label: "Mostly okay", score: 1 },
      { id: "q3-c", label: "I prefer to avoid them", score: 2 },
      { id: "q3-d", label: "They can feel extremely stressful", score: 3 },
    ],
  },
  {
    id: "q4",
    question: "How do sudden loud sounds like sirens, alarms, or horns affect you?",
    category: "suddenSounds",
    options: [
      { id: "q4-a", label: "They do not affect me much", score: 0 },
      { id: "q4-b", label: "They startle me briefly", score: 1 },
      { id: "q4-c", label: "They make me anxious", score: 2 },
      { id: "q4-d", label: "They are very distressing", score: 3 },
    ],
  },
  {
    id: "q5",
    question: "When planning a journey, how important is finding quiet spaces nearby?",
    category: "quietPreference",
    options: [
      { id: "q5-a", label: "Not very important", score: 0 },
      { id: "q5-b", label: "Useful sometimes", score: 1 },
      { id: "q5-c", label: "Important for comfort", score: 2 },
      { id: "q5-d", label: "Essential for me to feel safe", score: 3 },
    ],
  },
];

// Converts quiz answers into simple score patterns.
// This satisfies AC 6.1.2 without needing a backend or medical diagnosis.
export function calculateSensitivityResult(answers: QuizAnswers): SensitivityResult {
  const scores: Record<SensitivityCategory, number> = {
    socialNoise: 0,
    mechanicalSounds: 0,
    crowdedSpaces: 0,
    suddenSounds: 0,
    quietPreference: 0,
  };

  quizQuestions.forEach((question) => {
    const selectedOptionId = answers[question.id];
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);

    if (selectedOption) {
      scores[question.category] += selectedOption.score;
    }
  });

  const categories = [];

  if (scores.socialNoise >= 2) {
    categories.push({
      label: "Social Noise Sensitivity",
      description: "Busy conversations, chatter, and crowded social environments may feel overstimulating.",
    });
  }

  if (scores.mechanicalSounds >= 2) {
    categories.push({
      label: "Mechanical Sounds",
      description: "Traffic, construction, and harsh industrial sounds may increase discomfort.",
    });
  }

  if (scores.crowdedSpaces >= 2) {
    categories.push({
      label: "Crowded Environments",
      description: "Busy public places may feel difficult to manage during travel.",
    });
  }

  if (scores.suddenSounds >= 2) {
    categories.push({
      label: "Sudden Loud Sounds",
      description: "Unexpected alarms, horns, or sirens may be strong sensory triggers.",
    });
  }

  if (scores.quietPreference >= 2) {
    categories.push({
      label: "Quiet Space Preference",
      description: "Nearby parks, libraries, and calm spaces may help support safer travel.",
    });
  }

  if (categories.length === 0) {
    categories.push({
      label: "Balanced Sensitivity Profile",
      description: "Your responses suggest you may cope well across most everyday sound environments.",
    });
  }

  return {
    title: "Your Sensitivity Profile",
    description:
      "Based on your answers, HushNav has identified sound and environment patterns that may affect your travel comfort.",
    categories,
  };
}