export const WELLNESS_QUOTES = [
  {
    text: "You are allowed to take up space.",
    author: null
  },
  {
    text: "One day at a time.",
    author: null
  },
  {
    text: "You are doing better than you think.",
    author: null
  },
  {
    text: "Progress, not perfection.",
    author: null
  },
  {
    text: "Be gentle with yourself.",
    author: null
  },
  {
    text: "This too shall pass.",
    author: null
  },
  {
    text: "Your presence matters.",
    author: null
  },
  {
    text: "Small steps still move you forward.",
    author: null
  },
  {
    text: "You've survived 100% of your worst days.",
    author: null
  },
  {
    text: "It's okay to rest.",
    author: null
  },
  {
    text: "Healing is not linear.",
    author: null
  },
  {
    text: "You are worthy of love and belonging.",
    author: "Brené Brown"
  },
  {
    text: "Just keep swimming.",
    author: null
  },
  {
    text: "The only way out is through.",
    author: "Robert Frost"
  },
  {
    text: "You are stronger than you know.",
    author: null
  },
  {
    text: "Tomorrow is a new day.",
    author: null
  },
  {
    text: "Your feelings are valid.",
    author: null
  },
  {
    text: "Breathe. You've got this.",
    author: null
  },
  {
    text: "Every day is a fresh start.",
    author: null
  },
  {
    text: "Be patient with yourself.",
    author: null
  },
  {
    text: "You matter more than you know.",
    author: null
  },
  {
    text: "Keep going. Keep growing.",
    author: null
  },
  {
    text: "Your story isn't over yet.",
    author: null
  },
  {
    text: "Rest if you must, but don't quit.",
    author: null
  },
  {
    text: "It's okay to not be okay.",
    author: null
  },
  {
    text: "You are not alone.",
    author: null
  },
  {
    text: "Each sunrise brings new hope.",
    author: null
  },
  {
    text: "Trust the process.",
    author: null
  },
  {
    text: "Courage doesn't always roar.",
    author: "Mary Anne Radmacher"
  },
  {
    text: "You've come so far. Don't give up now.",
    author: null
  }
];

// Get a consistent quote for a given date
export const getQuoteForDate = (date = new Date()) => {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % WELLNESS_QUOTES.length;
  return WELLNESS_QUOTES[index];
};
