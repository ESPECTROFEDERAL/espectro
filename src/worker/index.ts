// workers/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";

interface Challenge {
  id: string;
  title: string;
  category: "crypto" | "web" | "misc";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  description: string;
  hint?: string;
  flag: string;
}

const CHALLENGES: Challenge[] = [
  // --- Crypto Examples (1-20)
  { id: "rot13-1", title: "ROT13 Starter", category: "crypto", difficulty: "easy", points: 50, description: "Uryyb jbeyq!", hint: "ROT13 shifts letters by 13 positions.", flag: "flag{hello_world}" },
  { id: "base64-1", title: "Base64 Easy", category: "crypto", difficulty: "easy", points: 50, description: "SGVsbG8gQ1RGLA==", hint: "Use any Base64 decoder.", flag: "flag{hello_ctf}" },
  { id: "hex-1", title: "Hex to Text", category: "crypto", difficulty: "easy", points: 50, description: "48656c6c6f2c2043544621", hint: "Each 2 hex digits represent one ASCII character.", flag: "flag{hello_ctf}" },
  { id: "morse-1", title: "Morse Code", category: "crypto", difficulty: "easy", points: 50, description: "... --- ...", hint: "SOS in Morse code is ... --- ...", flag: "flag{sos}" },
  { id: "rot47-1", title: "ROT47", category: "crypto", difficulty: "medium", points: 100, description: "w6==@/ @?p", hint: "ROT47 shifts ASCII characters between 33 and 126 by 47.", flag: "flag{rot47_success}" },
  { id: "binary-1", title: "Binary Decoder", category: "crypto", difficulty: "medium", points: 100, description: "01100110 01101100 01100001 01100111", hint: "8-bit binary to ASCII.", flag: "flag{flag}" },
  { id: "vigenere-1", title: "Vigenere Cipher", category: "crypto", difficulty: "medium", points: 150, description: "Ciphertext: LXFOPVEFRNHR\nKey: LEMON", hint: "Vigenere uses the key to shift letters.", flag: "flag{attackatdawn}" },
  { id: "caesar-2", title: "Caesar Shift", category: "crypto", difficulty: "easy", points: 50, description: "Khoor Zruog", hint: "Try shifting letters until it makes sense.", flag: "flag{hello_world}" },
  { id: "base32-1", title: "Base32 Fun", category: "crypto", difficulty: "medium", points: 100, description: "JBSWY3DPEBLW64TMMQQQ====", hint: "Use any Base32 decoder.", flag: "flag{base32_decoded}" },
  { id: "atbash-1", title: "Atbash Cipher", category: "crypto", difficulty: "easy", points: 50, description: "Zgyzhs rh z hvxivg", hint: "Atbash reverses the alphabet: A->Z, B->Y ...", flag: "flag{attack_is_a_secret}" },
  // --- Web Examples (21-35)
  { id: "sql-1", title: "SQL Injection Basics", category: "web", difficulty: "easy", points: 60, description: "Bypass login", hint: "Try ' OR '1'='1", flag: "flag{sql_injection}" },
  { id: "xss-1", title: "XSS Vulnerability", category: "web", difficulty: "easy", points: 60, description: "Alert box", hint: "Use <script> tag", flag: "flag{xss_found}" },
  { id: "csrf-1", title: "CSRF Attack", category: "web", difficulty: "medium", points: 120, description: "Forge a request", hint: "Missing CSRF token", flag: "flag{csrf_bypassed}" },
  { id: "lfi-1", title: "Local File Inclusion", category: "web", difficulty: "medium", points: 120, description: "Read /etc/passwd", hint: "Path traversal", flag: "flag{lfi_pwned}" },
  { id: "auth-1", title: "Authentication Bypass", category: "web", difficulty: "medium", points: 120, description: "Login as admin", hint: "Check cookies", flag: "flag{auth_bypass}" },
  // --- Misc Examples (36-50)
  { id: "steganography-1", title: "Hidden Message", category: "misc", difficulty: "easy", points: 70, description: "Extract from image", hint: "Use steghide", flag: "flag{steganography}" },
  { id: "qrcode-1", title: "QR Code", category: "misc", difficulty: "easy", points: 70, description: "Scan the code", hint: "Use any QR decoder", flag: "flag{qr_decoded}" },
  { id: "reversing-1", title: "Reverse Engineering", category: "misc", difficulty: "medium", points: 130, description: "Decompile binary", hint: "Use Ghidra", flag: "flag{binary_reversed}" },
];

// --- User Progress (Fixed for Cloudflare Workers)
interface UserProgress {
  username: string;
  solvedChallenges: string[]; // Changed from Set to Array for Cloudflare compatibility
  totalScore: number;
  lastSolve: string; // Changed from Date to string (ISO format)
}

const userProgress = new Map<string, UserProgress>();

// --- Context Type for Cloudflare Workers
interface CloudflareContext {
  req: {
    header: (key: string) => string | undefined;
    json: () => Promise<{ challengeId?: string; flag?: string }>;
  };
  json: (data: unknown, status?: number) => Response;
}

function getUsername(c: CloudflareContext): string {
  return c.req.header("x-username") || "anonymous";
}

function getUserProgress(username: string): UserProgress {
  if (!userProgress.has(username)) {
    userProgress.set(username, {
      username,
      solvedChallenges: [], // Array instead of Set
      totalScore: 0,
      lastSolve: new Date().toISOString(),
    });
  }
  return userProgress.get(username)!;
}

// Initialize app with proper type support
const app = new Hono<{ Bindings: CloudflareContext }>();

// Enable CORS
app.use("/*", cors());

// --- API Routes ---

// Health check endpoint
app.get("/api/", (c) => c.json({ name: "CTF Arena API v2.0", status: "operational" }));

// Get all challenges with user progress
app.get("/api/challenges", (c) => {
  const username = getUsername(c);
  const progress = getUserProgress(username);

  // Map challenges and mark solved ones
  const challengesWithStatus = CHALLENGES.map((ch) => ({
    ...ch,
    solved: progress.solvedChallenges.includes(ch.id), // Use includes() instead of has()
  }));

  return c.json({
    challenges: challengesWithStatus,
    username,
    totalScore: progress.totalScore,
    solvedCount: progress.solvedChallenges.length,
  });
});

// Get leaderboard
app.get("/api/leaderboard", (c) => {
  const leaderboard = Array.from(userProgress.values())
    .map((user) => ({
      username: user.username,
      totalScore: user.totalScore,
      solvedCount: user.solvedChallenges.length,
      lastSolve: user.lastSolve,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 100); // Top 100

  return c.json({ leaderboard });
});

// Get user stats
app.get("/api/user/:username", (c) => {
  const username = c.req.param("username");
  const progress = userProgress.get(username);

  if (!progress) {
    return c.json(
      { message: "User not found" },
      404
    );
  }

  return c.json({
    username: progress.username,
    totalScore: progress.totalScore,
    solvedCount: progress.solvedChallenges.length,
    solvedChallenges: progress.solvedChallenges,
    lastSolve: progress.lastSolve,
  });
});

// Submit flag
app.post("/api/submit", async (c) => {
  const username = getUsername(c);
  const body = await c.req.json();
  const { challengeId, flag } = body as { challengeId?: string; flag?: string };

  // Validation
  if (!challengeId || !flag) {
    return c.json(
      {
        correct: false,
        message: "Missing challenge ID or flag",
      },
      400
    );
  }

  // Find challenge
  const challenge = CHALLENGES.find((ch) => ch.id === challengeId);
  if (!challenge) {
    return c.json(
      {
        correct: false,
        message: "Challenge not found",
      },
      404
    );
  }

  // Get user progress
  const progress = getUserProgress(username);

  // Check if already solved
  if (progress.solvedChallenges.includes(challengeId)) {
    return c.json({
      correct: false,
      message: "❌ Already solved this challenge!",
    });
  }

  // Check flag
  if (flag.toLowerCase().trim() === challenge.flag.toLowerCase()) {
    // Add to solved challenges
    progress.solvedChallenges.push(challengeId); // Use push() instead of add()
    progress.totalScore += challenge.points;
    progress.lastSolve = new Date().toISOString();

    return c.json({
      correct: true,
      message: `🎉 Correct! +${challenge.points} points!`,
      points: challenge.points,
      totalScore: progress.totalScore,
    });
  }

  // Wrong flag
  return c.json({
    correct: false,
    message: "❌ Incorrect flag. Try again!",
  });
});

// 404 handler
app.all("*", (c) => {
  return c.json({ message: "Not Found" }, 404);
});

export default app;