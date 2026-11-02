/** The Joy Deck: small, kind, actually doable prompts. */

export type JoyCard = {
  id: string;
  title: string;
  prompt: string;
  tone: "lavender" | "blush" | "mint" | "sky" | "peach" | "butter";
  minutes: number;
};

export const JOY_DECK: JoyCard[] = [
  { id: "j1", title: "Send one kind message", prompt: "Tell someone you're glad they exist. No occasion needed.", tone: "blush", minutes: 2 },
  { id: "j2", title: "Step outside", prompt: "Five minutes of outside air, no phone. Notice three sounds.", tone: "mint", minutes: 5 },
  { id: "j3", title: "One thing you handled", prompt: "Write down one thing you handled well today, however small.", tone: "butter", minutes: 3 },
  { id: "j4", title: "Drink some water", prompt: "A full glass, slowly. Your body has been doing a lot.", tone: "sky", minutes: 2 },
  { id: "j5", title: "Shoulders down", prompt: "Roll your shoulders back three times and let them drop. Breathe once, slowly.", tone: "lavender", minutes: 1 },
  { id: "j6", title: "One-tab rule", prompt: "Close every tab you're not using right now. Give your attention one place to land.", tone: "peach", minutes: 2 },
  { id: "j7", title: "Name the feeling", prompt: "Say out loud, \"Right now I feel ___\". No fixing, just naming.", tone: "lavender", minutes: 2 },
  { id: "j8", title: "Tidy one surface", prompt: "Just one: a desk corner, a bedside table, a single shelf.", tone: "mint", minutes: 5 },
  { id: "j9", title: "Ten slow breaths", prompt: "In for four, out for six. Ten rounds, eyes soft.", tone: "sky", minutes: 3 },
  { id: "j10", title: "Compliment a stranger", prompt: "Something true and specific, then move on. No follow-up needed.", tone: "blush", minutes: 1 },
  { id: "j11", title: "A song you love", prompt: "Play it at full attention, not as background. That's it.", tone: "butter", minutes: 4 },
  { id: "j12", title: "Text a thank you", prompt: "One person, one specific thing they did that helped you.", tone: "peach", minutes: 3 },
  { id: "j13", title: "Eat something real", prompt: "Not a whole meal. Just something with a colour in it.", tone: "mint", minutes: 10 },
  { id: "j14", title: "Move for three minutes", prompt: "Stand up, stretch, walk to the end of the room and back.", tone: "lavender", minutes: 3 },
  { id: "j15", title: "Write one sentence", prompt: "Open the Journal and write exactly one honest sentence.", tone: "sky", minutes: 2 },
  { id: "j16", title: "The 10-minute rule", prompt: "Do the thing you're avoiding for ten minutes only. Then you can stop.", tone: "peach", minutes: 10 },
  { id: "j17", title: "Look up", prompt: "Find the sky from a window. Stay with it for thirty seconds.", tone: "sky", minutes: 1 },
  { id: "j18", title: "One small no", prompt: "Decline one optional thing today, kindly and briefly.", tone: "blush", minutes: 3 },
  { id: "j19", title: "Warm drink ritual", prompt: "Make a warm drink and drink the first three sips without doing anything else.", tone: "butter", minutes: 5 },
  { id: "j20", title: "Plant a feeling", prompt: "Do a check-in and let this one grow in your garden.", tone: "lavender", minutes: 4 },
  { id: "j21", title: "Two-minute tidy brain", prompt: "Write every open loop on paper. You are not doing them yet.", tone: "mint", minutes: 4 },
  { id: "j22", title: "Shoulders, jaw, hands", prompt: "Unclench your jaw. Soften your hands. Repeat once.", tone: "sky", minutes: 1 },
  { id: "j23", title: "Reach out first", prompt: "Message someone you've been meaning to reply to. One line is enough.", tone: "peach", minutes: 3 },
  { id: "j24", title: "Notice one good thing", prompt: "Add it to the Gratitude Wall so future-you can find it.", tone: "butter", minutes: 2 },
];

export const CARD_TONES: Record<JoyCard["tone"], string> = {
  lavender: "from-lavender-100 via-lavender-50 to-white",
  blush: "from-blush-100 via-blush-50 to-white",
  mint: "from-mint-100 via-mint-50 to-white",
  sky: "from-sky-100 via-sky-50 to-white",
  peach: "from-peach-100 via-peach-50 to-white",
  butter: "from-butter-100 via-butter-50 to-white",
};

export function drawCard(previousId?: string | null): JoyCard {
  const pool = JOY_DECK.filter((card) => card.id !== previousId);
  const source = pool.length > 0 ? pool : JOY_DECK;
  return source[Math.floor(Math.random() * source.length)];
}
