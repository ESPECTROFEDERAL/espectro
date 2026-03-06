// workers/app.tsx
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
  showHint?: boolean;
}

const App: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [score, setScore] = useState<number>(0);
  const [username, setUsername] = useState<string>("anonymous");
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/challenges", { headers: { "x-username": username } });
      const data = await res.json();
      setChallenges(data.challenges);
      setScore(data.totalScore);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlagChange = (id: string, value: string) => {
    setFlagInputs(prev => ({ ...prev, [id]: value }));
  };

  const submitFlag = async (id: string) => {
    const flag = flagInputs[id];
    if (!flag) return setMessage("Enter a flag!");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-username": username },
        body: JSON.stringify({ challengeId: id, flag }),
      });
      const data = await res.json();
      setMessage(data.message);
      if (data.correct) fetchChallenges();
    } catch (err) {
      console.error(err);
      setMessage("Error submitting flag.");
    }
  };

  const toggleHint = (id: string) => {
    setChallenges(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, showHint: !ch.showHint } : ch))
    );
  };

  return (
    <div className="app-container">
      <h1>CTF Arena</h1>
      <div className="score-board">
        <span>User: {username}</span>
        <span>Total Score: {score}</span>
      </div>
      {message && <div className="message">{message}</div>}
      <div className="challenges">
        {challenges.map(ch => (
          <div key={ch.id} className={`challenge ${ch.solved ? "solved" : ""}`}>
            <h3>
              [{ch.category.toUpperCase()}] {ch.title} ({ch.points} pts)
            </h3>
            <p>{ch.description}</p>
            {ch.hint && (
              <button onClick={() => toggleHint(ch.id)}>
                {ch.showHint ? "Hide Hint" : "Show Hint"}
              </button>
            )}
            {ch.showHint && <p className="hint">{ch.hint}</p>}
            {ch.solved ? (
              <p className="solved-text">✅ Solved</p>
            ) : (
              <div className="submit-flag">
                <input
                  type="text"
                  placeholder="Enter flag"
                  value={flagInputs[ch.id] || ""}
                  onChange={e => handleFlagChange(ch.id, e.target.value)}
                />
                <button onClick={() => submitFlag(ch.id)}>Submit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
