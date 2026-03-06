import React, { useEffect, useState } from "react";
import "./app.css";

interface Challenge {
  id: string;
  title: string;
  category: "crypto" | "web" | "misc";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  description: string;
  hint?: string;
  solved: boolean;
}

interface ApiResponse {
  challenges: Challenge[];
  totalScore: number;
}

function App() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch("/api/challenges", {
      headers: {
        "x-username": "demo_user",
      },
    })
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        setChallenges(data.challenges);
        setScore(data.totalScore);
      });
  }, []);

  return (
    <div className="app">
      <header>
        <h1>CTF Arena</h1>
        <p>Total Score: {score}</p>
      </header>
      <main>
        {challenges.map((ch) => (
          <div key={ch.id} className={`challenge ${ch.solved ? "solved" : ""}`}>
            <h2>{ch.title}</h2>
            <p><b>Category:</b> {ch.category}</p>
            <p><b>Difficulty:</b> {ch.difficulty}</p>
            <p><b>Points:</b> {ch.points}</p>
            <p>{ch.description}</p>
            {ch.hint && <p className="hint"><b>Hint:</b> {ch.hint}</p>}
            {ch.solved && <p className="solved-label">✅ Solved</p>}
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
