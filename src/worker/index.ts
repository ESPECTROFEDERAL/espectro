// workers/index.ts
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

const CHALLENGES: Challenge[] = [
  // --- Crypto Examples (1-20)
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
  // ... repeat pattern for all 50 challenges ...
];

// --- User Progress
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
  const challenges = CHALLENGES.map(ch => ({ ...ch, solved: progress.solvedChallenges.has(ch.id) }));
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
