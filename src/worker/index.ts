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

// Store user progress (in production, use KV or D1)
interface UserProgress {
  username: string;
  solvedChallenges: Set<string>;
  totalScore: number;
  lastSolve: Date;
}

const userProgress = new Map<string, UserProgress>();

function getUsername(c: any): string {
  return c.req.header("x-username") || "anonymous";
}

function getUserProgress(username: string): UserProgress {
  if (!userProgress.has(username)) {
    userProgress.set(username, {
      username,
      solvedChallenges: new Set(),
      totalScore: 0,
      lastSolve: new Date(),
    });
  }
  return userProgress.get(username)!;
}

app.get("/api/", (c) => {
  return c.json({ name: "CTF Arena API v2.0" });
});

app.get("/api/challenges", (c) => {
  const username = getUsername(c);
  const progress = getUserProgress(username);

  const challenges = CHALLENGES.map((ch) => ({
    id: ch.id,
    title: ch.title,
    category: ch.category,
    difficulty: ch.difficulty,
    points: ch.points,
    description: ch.description,
    hint: ch.hint,
    solved: progress.solvedChallenges.has(ch.id),
  }));

  return c.json({
    challenges,
    totalScore: progress.totalScore,
  });
});

app.post("/api/submit", async (c) => {
  const username = getUsername(c);
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

  const progress = getUserProgress(username);

  // Check if already solved
  if (progress.solvedChallenges.has(challengeId)) {
    return c.json({
      correct: false,
      message: "You've already solved this challenge!",
    });
  }

  // Validate flag (case-insensitive)
  if (flag.toLowerCase().trim() === challenge.flag.toLowerCase()) {
    progress.solvedChallenges.add(challengeId);
    progress.totalScore += challenge.points;
    progress.lastSolve = new Date();

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
  const currentUsername = getUsername(c);
  
  // Convert to array and sort by score
  const leaderboard = Array.from(userProgress.values())
    .map(user => ({
      username: user.username,
      score: user.totalScore,
      challengesSolved: user.solvedChallenges.size,
      lastSolved: user.lastSolve.toISOString(),
    }))
    .sort((a, b) => b.score - a.score || b.challengesSolved - a.challengesSolved);

  // Find current user's rank
  const userRank = leaderboard.findIndex(u => u.username === currentUsername) + 1;
  
  const userStats = {
    username: currentUsername,
    score: getUserProgress(currentUsername).totalScore,
    rank: userRank || 0,
    totalPlayers: leaderboard.length,
    challengesSolved: getUserProgress(currentUsername).solvedChallenges.size,
    recentSolves: [],
  };

  return c.json({
    leaderboard: leaderboard.slice(0, 20), // Top 20
    userStats,
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

app.get("/api/stats", (c) => {
  const totalUsers = userProgress.size;
  const totalSubmissions = Array.from(userProgress.values()).reduce(
    (sum, user) => sum + user.solvedChallenges.size,
    0
  );

  const challengeStats = CHALLENGES.map(ch => {
    const solveCount = Array.from(userProgress.values()).filter(
      u => u.solvedChallenges.has(ch.id)
    ).length;
    
    return {
      id: ch.id,
      title: ch.title,
      solves: solveCount,
      solveRate: totalUsers > 0 ? (solveCount / totalUsers) * 100 : 0,
    };
  });

  return c.json({
    totalUsers,
    totalChallenges: CHALLENGES.length,
    totalSubmissions,
    challengeStats,
  });
});

export default app;
