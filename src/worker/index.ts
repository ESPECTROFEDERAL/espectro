import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use("/*", cors());

interface Challenge {
  id: string;
  title: string;
  category: "crypto" | "web" | "misc";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  description: string;
  hint?: string;
  flag: string;
  solved: boolean;
}

// ================== 50 CHALLENGES ==================
const CHALLENGES: Challenge[] = [
  // --- Crypto Examples ---
  { id: "rot13-1", title: "ROT13 Starter", category: "crypto", difficulty: "easy", points: 50, description: "Uryyb jbeyq!", hint: "ROT13 shifts letters by 13 positions.", flag: "flag{hello_world}", solved: false },
  { id: "base64-1", title: "Base64 Easy", category: "crypto", difficulty: "easy", points: 50, description: "SGVsbG8gQ1RGLA==", hint: "Use any Base64 decoder.", flag: "flag{hello_ctf}", solved: false },
  { id: "hex-1", title: "Hex to Text", category: "crypto", difficulty: "easy", points: 50, description: "48656c6c6f2c2043544621", hint: "Each 2 hex digits represent one ASCII character.", flag: "flag{hello_ctf}", solved: false },
  { id: "morse-1", title: "Morse Code", category: "crypto", difficulty: "easy", points: 50, description: "... --- ...", hint: "SOS in Morse code is ... --- ...", flag: "flag{sos}", solved: false },
  { id: "rot47-1", title: "ROT47", category: "crypto", difficulty: "medium", points: 100, description: "w6==@/ @?p", hint: "ROT47 shifts ASCII characters between 33 and 126 by 47.", flag: "flag{rot47_success}", solved: false },
  { id: "binary-1", title: "Binary Decoder", category: "crypto", difficulty: "medium", points: 100, description: "01100110 01101100 01100001 01100111", hint: "8-bit binary to ASCII.", flag: "flag{flag}", solved: false },
  { id: "vigenere-1", title: "Vigenere Cipher", category: "crypto", difficulty: "medium", points: 150, description: "Ciphertext: LXFOPVEFRNHR\nKey: LEMON", hint: "Vigenere uses the key to shift letters.", flag: "flag{attackatdawn}", solved: false },
  { id: "caesar-2", title: "Caesar Shift", category: "crypto", difficulty: "easy", points: 50, description: "Khoor Zruog", hint: "Try shifting letters until it makes sense.", flag: "flag{hello_world}", solved: false },
  { id: "base32-1", title: "Base32 Fun", category: "crypto", difficulty: "medium", points: 100, description: "JBSWY3DPEBLW64TMMQQQ====", hint: "Use any Base32 decoder.", flag: "flag{base32_decoded}", solved: false },
  { id: "atbash-1", title: "Atbash Cipher", category: "crypto", difficulty: "easy", points: 50, description: "Zgyzhs rh z hvxivg", hint: "Atbash reverses the alphabet: A->Z, B->Y ...", flag: "flag{attack_is_a_secret}", solved: false },

  // --- OSINT Examples ---
  { id: "osint-twitter", title: "Twitter Hunt", category: "web", difficulty: "easy", points: 50, description: "A tweet contains a hidden flag.", hint: "Sometimes the flag is in images or links.", flag: "flag{hidden_in_tweet}", solved: false },
  { id: "osint-linkedin", title: "LinkedIn Clues", category: "web", difficulty: "medium", points: 100, description: "Check the user's profile for a secret code.", hint: "Look at job titles, past projects, or encoded URLs.", flag: "flag{linkedin_secret}", solved: false },
  { id: "osint-image-meta", title: "Image Metadata", category: "web", difficulty: "medium", points: 100, description: "This image might contain hidden information in its metadata.", hint: "Check EXIF data or hidden comments.", flag: "flag{metadata_found}", solved: false },
  { id: "osint-domain", title: "Domain Info", category: "web", difficulty: "easy", points: 50, description: "Who owns the domain example.com?", hint: "Use WHOIS lookup services.", flag: "flag{domain_owner}", solved: false },
  { id: "osint-google-dork", title: "Google Dorking", category: "web", difficulty: "medium", points: 100, description: "Use a Google dork to find the hidden page.", hint: "Look for filetype or inurl operators.", flag: "flag{hidden_google_page}", solved: false },
  { id: "osint-social-hidden", title: "Social Clues", category: "web", difficulty: "medium", points: 100, description: "A social media post has hidden info in the source.", hint: "Check HTML comments and source code.", flag: "flag{social_hidden}", solved: false },

  // --- Misc Examples ---
  { id: "misc-riddle-1", title: "Riddle Me This", category: "misc", difficulty: "easy", points: 50, description: "I speak without a mouth and hear without ears. What am I?", hint: "Think about non-living objects.", flag: "flag{echo}", solved: false },
  { id: "misc-anagram-1", title: "Anagram Fun", category: "misc", difficulty: "easy", points: 50, description: "Unscramble: CTFRAEN", hint: "Rearrange the letters.", flag: "flag{ctfaren}", solved: false },
  { id: "misc-math-1", title: "Math Puzzle", category: "misc", difficulty: "medium", points: 100, description: "If 2+3=10, 3+4=21, then 5+6=?", hint: "It's not normal arithmetic. Think pattern.", flag: "flag{55}", solved: false },
  { id: "misc-ascii-1", title: "ASCII Art", category: "misc", difficulty: "easy", points: 50, description: "Look at this ASCII art: (•_•)", hint: "Flag hidden visually.", flag: "flag{ascii_face}", solved: false },
  { id: "misc-puzzle-1", title: "Simple Puzzle", category: "misc", difficulty: "medium", points: 100, description: "Rearrange letters: EHPFALG", hint: "It's an anagram of 'FLAG'.", flag: "flag{flagphe}", solved: false },
  
  // ================= Add more up to 50 by repeating similar patterns =================
];

interface UserProgress {
  username: string;
  solvedChallenges: Set<string>;
  totalScore: number;
  lastSolve: Date;
}

const userProgress = new Map<string, UserProgress>();
function getUsername(c: any): string { return c.req.header("x-username") || "anonymous"; }
function getUserProgress(username: string): UserProgress {
  if (!userProgress.has(username)) {
    userProgress.set(username, { username, solvedChallenges: new Set(), totalScore: 0, lastSolve: new Date() });
  }
  return userProgress.get(username)!;
}

// --- API Routes ---
app.get("/api/", (c) => c.json({ name: "CTF Arena API v2.0" }));
app.get("/api/challenges", (c) => {
  const username = getUsername(c);
  const progress = getUserProgress(username);
  const challenges = CHALLENGES.map((ch) => ({ ...ch, solved: progress.solvedChallenges.has(ch.id) }));
  return c.json({ challenges, totalScore: progress.totalScore });
});

app.post("/api/submit", async (c) => {
  const username = getUsername(c);
  const { challengeId, flag } = await c.req.json();
  if (!challengeId || !flag) return c.json({ correct: false, message: "Missing challenge ID or flag" }, 400);
  const challenge = CHALLENGES.find(ch => ch.id === challengeId);
  if (!challenge) return c.json({ correct: false, message: "Challenge not found" }, 404);
  const progress = getUserProgress(username);
  if (progress.solvedChallenges.has(challengeId)) return c.json({ correct: false, message: "Already solved" });
  if (flag.toLowerCase().trim() === challenge.flag.toLowerCase()) {
    progress.solvedChallenges.add(challengeId);
    progress.totalScore += challenge.points;
    progress.lastSolve = new Date();
    return c.json({ correct: true, message: `🎉 Correct! +${challenge.points} points!`, points: challenge.points });
  }
  return c.json({ correct: false, message: "❌ Incorrect flag. Try again!" });
});

export default app;
