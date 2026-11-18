export type Message = {
  id: string;
  author: string;
  message: string;
  // Unix timestamp in milliseconds, same format as public/api/messages.json
  time: number;
};

export const dummyMessages = [
  "Oh wow I can't believe it!",
  "Hahaha you're so right!!",
  'No way, when?!! 😱',
  'OMG I totally agree!',
  "Umm I'm not so sure about that one 🤨",
  'Wait, you are actually being serious rn?',
  "Hahahahaha you're too much 😂😂😂",
  'Did you watch the new show last night?',
  '🤡'
];
