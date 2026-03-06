interface UserProgress {
  username: string;
  solvedChallenges: string[];  // ✅ Use array instead of Set
  totalScore: number;
  lastSolve: Date;
}

const userProgress = new Map<string, UserProgress>();

function getUserProgress(username: string): UserProgress {
  if (!userProgress.has(username)) {
    userProgress.set(username, { 
      username, 
      solvedChallenges: [],  // ✅ Initialize as array
      totalScore: 0, 
      lastSolve: new Date() 
    });
  }
  return userProgress.get(username)!;
}

// Update submit route
app.post("/api/submit", async (c) => {
  const username = getUsername(c);
  const { challengeId, flag } = await c.req.json();
  if (!challengeId || !flag) return c.json({ correct: false, message: "Missing challenge ID or flag" }, 400);
  
  const challenge = CHALLENGES.find(ch => ch.id === challengeId);
  if (!challenge) return c.json({ correct: false, message: "Challenge not found" }, 404);
  
  const progress = getUserProgress(username);
  
  // ✅ Use includes() instead of has()
  if (progress.solvedChallenges.includes(challengeId)) {
    return c.json({ correct: false, message: "Already solved" });
  }
  
  if (flag.toLowerCase().trim() === challenge.flag.toLowerCase()) {
    progress.solvedChallenges.push(challengeId);  // ✅ Use push() instead of add()
    progress.totalScore += challenge.points;
    progress.lastSolve = new Date();
    return c.json({ correct: true, message: `🎉 Correct! +${challenge.points} points!`, points: challenge.points });
  }
  
  return c.json({ correct: false, message: "❌ Incorrect flag. Try again!" });
});
