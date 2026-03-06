// worker/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("/*", cors());

interface Challenge {
  id: string;
  title: string;
  category: "crypto" | "forensics" | "web" | "misc";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  description: string;
  hint?: string;
  flag: string;
  solved: boolean;
}

// In production, store this in KV or D1 database
const CHALLENGES: Challenge[] = [
  {
    id: "lookeecode",
    title: "Look E Code",
    category: "crypto",
    difficulty: "easy",
    points: 100,
    description: "We intercepted this mysterious image with geometric symbols. Can you decode the hidden message?\n\nFlag format: flag{decoded_message}",
    hint: "The shapes look like parts of letters! Try matching them visually.",
    flag: "flag{lookeecode}",
    solved: false,
  },
  {
    id: "web-basics",
    title: "Hidden in Plain Sight",
    category: "web",
    difficulty: "easy",
    points: 50,
    description: "Sometimes the answer is right in front of you. Check the source!\n\nFlag format: flag{...}",
    hint: "Inspect the HTML source code of this page. Look for HTML comments.",
    flag: "flag{inspect_the_source_code}",
    solved: false,
  },
  {
    id: "stego-101",
    title: "Image Secrets",
    category: "forensics",
    difficulty: "medium",
    points: 150,
    description: "This image file seems normal, but is it? There's more than meets the eye.\n\nFlag format: flag{...}",
    hint: "Try checking the metadata or running strings on the file.",
    flag: "flag{hidden_in_metadata}",
    solved: false,
  },
  {
    id: "rot13-mix",
    title: "Classic Cipher",
    category: "crypto",
    difficulty: "easy",
    points: 75,
    description: "synt{pelcgb_vf_sha}\n\nWhat does this mean?\n\nFlag format: flag{...}",
    hint: "ROT13 is a classic substitution cipher. Each letter is replaced by the letter 13 positions after it.",
    flag: "flag{crypto_is_fun}",
    solved: false,
  },
  {
    id: "base64-puzzle",
    title: "Encoded Message",
    category: "crypto",
    difficulty: "easy",
    points: 75,
    description: "ZmxhZ3tkZWNvZGVfdGhlX2Jhc2U2NH0=\n\nDecode this message!\n\nFlag format: flag{...}",
    hint: "This looks like Base64 encoding. Try decoding it!",
    flag: "flag{decode_the_base64}",
    solved: false,
  },
  {
    id: "jwt-secret",
    title: "Token Hunter",
    category: "web",
    difficulty: "medium",
    points: 200,
    description: "We found this JWT token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmbGFnIjoiZmxhZ3tqd3RfaXNfbm90X3NlY3VyZX0iLCJpYXQiOjE1MTYyMzkwMjJ9.8jXKx_YLVgTqZ9b_CqZ8f9J9xQZ_QwZ8xZ9\n\nWhat's hidden inside?\n\nFlag format: flag{...}",
    hint: "JWT tokens have 3 parts separated by dots. The payload is Base64 encoded!",
    flag: "flag{jwt_is_not_secure}",
    solved: false,
  },
  {
    id: "sql-injection",
    title: "Database Breach",
    category: "web",
    difficulty: "hard",
    points: 300,
    description: "Find the SQL injection vulnerability and extract the flag.\n\nQuery: SELECT * FROM users WHERE username = 'INPUT'\n\nFlag format: flag{...}",
    hint: "Try classic SQL injection: ' OR '1'='1",
    flag: "flag{sql_injection_success}",
    solved: false,
  },
  {
    id: "morse-code",
    title: "Dit Dah Dit",
    category: "crypto",
    difficulty: "easy",
    points: 50,
    description: "..-. .-.. .- --. -.--..-- -- --- .-. ... . -..-. .. ... -..-. -.-. --- --- .-.. -.--.-\n\nWhat does this say?\n\nFlag format: flag{...}",
    hint: "This is Morse code! Use a decoder or translate manually.",
    flag: "flag{morse_is_cool}",
    solved: false,
  },
  {
    id: "reverse-engineering",
    title: "Binary Mystery",
    category: "misc",
    difficulty: "hard",
    points: 250,
    description: "01100110 01101100 01100001 01100111 01111011 01100010 01101001 01101110 01100001 01110010 01111001 01011111 01101001 01110011 01011111 01100101 01100001 01110011 01111001 01111101\n\nDecode the binary!\n\nFlag format: flag{...}",
    hint: "Binary to ASCII conversion. Each 8-bit sequence is one character.",
    flag: "flag{binary_is_easy}",
    solved: false,
  },
  {
    id: "xor-cipher",
    title: "XOR Challenge",
    category: "crypto",
    difficulty: "medium",
    points: 150,
    description: "Encrypted hex: 0e33172e172a331d172e172c331a172e\nKey: CTF\n\nXOR the hex with the key to get the flag!\n\nFlag format: flag{...}",
    hint: "XOR each byte of the encrypted hex with the repeating key 'CTF'.",
    flag: "flag{xor_crypto}",
    solved: false,
  },
];

// Store solved challenges per session (in production use KV)
const solvedChallenges = new Map<string, Set<string>>();

// Get session ID from request (simplified - use proper session management in production)
function getSessionId(c: any): string {
  return c.req.header("x-session-id") || "default-session";
}

app.get("/api/", (c) => {
  return c.json({ name: "CTF Arena API" });
});

app.get("/api/challenges", (c) => {
  const sessionId = getSessionId(c);
  const solved = solvedChallenges.get(sessionId) || new Set();

  const challenges = CHALLENGES.map((ch) => ({
    id: ch.id,
    title: ch.title,
    category: ch.category,
    difficulty: ch.difficulty,
    points: ch.points,
    description: ch.description,
    hint: ch.hint,
    solved: solved.has(ch.id),
  }));

  const totalScore = Array.from(solved).reduce((sum, id) => {
    const challenge = CHALLENGES.find((c) => c.id === id);
    return sum + (challenge?.points || 0);
  }, 0);

  return c.json({
    challenges,
    totalScore,
  });
});

app.post("/api/submit", async (c) => {
  const sessionId = getSessionId(c);
  const { challengeId, flag } = await c.req.json();

  if (!challengeId || !flag) {
    return c.json({
      correct: false,
      message: "Missing challenge ID or flag",
    }, 400);
  }

  const challenge = CHALLENGES.find((ch) => ch.id === challengeId);

  if (!challenge) {
    return c.json({
      correct: false,
      message: "Challenge not found",
    }, 404);
  }

  // Check if already solved
  const solved = solvedChallenges.get(sessionId) || new Set();
  if (solved.has(challengeId)) {
    return c.json({
      correct: false,
      message: "You've already solved this challenge!",
    });
  }

  // Validate flag (case-insensitive)
  if (flag.toLowerCase().trim() === challenge.flag.toLowerCase()) {
    solved.add(challengeId);
    solvedChallenges.set(sessionId, solved);

    return c.json({
      correct: true,
      message: `🎉 Correct! You earned ${challenge.points} points!`,
      points: challenge.points,
    });
  }

  return c.json({
    correct: false,
    message: "❌ Incorrect flag. Try again!",
  });
});

app.get("/api/leaderboard", (c) => {
  // In production, fetch from database
  const scores = Array.from(solvedChallenges.entries()).map(([session, solved]) => {
    const totalScore = Array.from(solved).reduce((sum, id) => {
      const challenge = CHALLENGES.find((c) => c.id === id);
      return sum + (challenge?.points || 0);
    }, 0);

    return {
      session: session.substring(0, 8), // Show only first 8 chars
      score: totalScore,
      challengesSolved: solved.size,
    };
  });

  scores.sort((a, b) => b.score - a.score);

  return c.json({
    leaderboard: scores.slice(0, 10), // Top 10
  });
});

app.get("/api/hint/:challengeId", (c) => {
  const challengeId = c.req.param("challengeId");
  const challenge = CHALLENGES.find((ch) => ch.id === challengeId);

  if (!challenge) {
    return c.json({ error: "Challenge not found" }, 404);
  }

  return c.json({
    hint: challenge.hint || "No hint available",
  });
});

export default app;
