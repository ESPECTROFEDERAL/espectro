// src/App.tsx
import { useState, useEffect } from "react";
import "./App.css";

interface Challenge {
  id: string;
  title: string;
  category: "crypto" | "forensics" | "web" | "misc";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  description: string;
  hint?: string;
  solved: boolean;
}

interface SubmitResponse {
  correct: boolean;
  message: string;
  points?: number;
}

function App() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch challenges from API
    fetch("/api/challenges")
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setTotalScore(data.totalScore || 0);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to demo data if API not ready
        setChallenges(DEMO_CHALLENGES);
        setLoading(false);
      });
  }, []);

  const submitFlag = async () => {
    if (!selectedChallenge || !flagInput.trim()) return;

    setFeedback(null);
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          flag: flagInput.trim(),
        }),
      });

      const data: SubmitResponse = await res.json();

      if (data.correct) {
        setFeedback({ type: "success", message: data.message });
        setChallenges(prev =>
          prev.map(c =>
            c.id === selectedChallenge.id ? { ...c, solved: true } : c
          )
        );
        setTotalScore(prev => prev + (data.points || 0));
        setSelectedChallenge({ ...selectedChallenge, solved: true });
        setFlagInput("");
        setShowHint(false);
      } else {
        setFeedback({ type: "error", message: data.message });
      }
    } catch (error) {
      // Demo mode validation
      if (selectedChallenge.id === "lookeecode" && flagInput.toLowerCase() === "flag{lookeecode}") {
        setFeedback({ type: "success", message: "🎉 Correct! You decoded the cipher!" });
        setChallenges(prev =>
          prev.map(c => c.id === selectedChallenge.id ? { ...c, solved: true } : c)
        );
        setTotalScore(prev => prev + selectedChallenge.points);
        setSelectedChallenge({ ...selectedChallenge, solved: true });
        setFlagInput("");
      } else {
        setFeedback({ type: "error", message: "❌ Incorrect flag. Try again!" });
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      crypto: "#00ff88",
      forensics: "#00d4ff",
      web: "#ff00ff",
      misc: "#ffaa00",
    };
    return colors[category as keyof typeof colors] || "#888";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: "#00ff88",
      medium: "#ffaa00",
      hard: "#ff3366",
    };
    return colors[difficulty as keyof typeof colors] || "#888";
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="terminal-text">LOADING CHALLENGES...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="bracket">{'>'}</span>
            <span className="title-text">CTF_ARENA</span>
            <span className="cursor-blink">_</span>
          </h1>
          <div className="score-display">
            <span className="score-label">SCORE:</span>
            <span className="score-value">{totalScore}</span>
          </div>
        </div>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">CHALLENGES:</span>
            <span className="stat-value">{challenges.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">SOLVED:</span>
            <span className="stat-value">{challenges.filter(c => c.solved).length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">REMAINING:</span>
            <span className="stat-value">{challenges.filter(c => !c.solved).length}</span>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className="challenges-list">
          <h2 className="section-title">
            <span className="terminal-prompt">$</span> CHALLENGES
          </h2>
          
          {["crypto", "forensics", "web", "misc"].map(category => {
            const categoryChalls = challenges.filter(c => c.category === category);
            if (categoryChalls.length === 0) return null;
            
            return (
              <div key={category} className="category-group">
                <div className="category-header" style={{ color: getCategoryColor(category) }}>
                  {category.toUpperCase()}
                </div>
                {categoryChalls.map(challenge => (
                  <button
                    key={challenge.id}
                    className={`challenge-item ${selectedChallenge?.id === challenge.id ? "active" : ""} ${challenge.solved ? "solved" : ""}`}
                    onClick={() => {
                      setSelectedChallenge(challenge);
                      setFlagInput("");
                      setFeedback(null);
                      setShowHint(false);
                    }}
                  >
                    <div className="challenge-item-header">
                      <span className="challenge-name">{challenge.title}</span>
                      {challenge.solved && <span className="solved-badge">✓</span>}
                    </div>
                    <div className="challenge-meta">
                      <span className="difficulty" style={{ color: getDifficultyColor(challenge.difficulty) }}>
                        {challenge.difficulty}
                      </span>
                      <span className="points">{challenge.points}pts</span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        <main className="challenge-details">
          {selectedChallenge ? (
            <>
              <div className="challenge-header">
                <div className="challenge-title-row">
                  <h2 className="challenge-title">{selectedChallenge.title}</h2>
                  {selectedChallenge.solved && (
                    <div className="solved-indicator">SOLVED ✓</div>
                  )}
                </div>
                <div className="challenge-badges">
                  <span className="badge category-badge" style={{ backgroundColor: getCategoryColor(selectedChallenge.category) }}>
                    {selectedChallenge.category}
                  </span>
                  <span className="badge difficulty-badge" style={{ backgroundColor: getDifficultyColor(selectedChallenge.difficulty) }}>
                    {selectedChallenge.difficulty}
                  </span>
                  <span className="badge points-badge">{selectedChallenge.points} points</span>
                </div>
              </div>

              <div className="challenge-description">
                <div className="terminal-window">
                  <div className="terminal-header">
                    <span className="terminal-button red"></span>
                    <span className="terminal-button yellow"></span>
                    <span className="terminal-button green"></span>
                  </div>
                  <div className="terminal-body">
                    <p className="terminal-text">{selectedChallenge.description}</p>
                  </div>
                </div>
              </div>

              {selectedChallenge.hint && (
                <div className="hint-section">
                  <button
                    className="hint-toggle"
                    onClick={() => setShowHint(!showHint)}
                  >
                    {showHint ? "Hide Hint" : "Show Hint"}
                  </button>
                  {showHint && (
                    <div className="hint-content">
                      💡 {selectedChallenge.hint}
                    </div>
                  )}
                </div>
              )}

              <div className="submit-section">
                <div className="flag-input-group">
                  <label htmlFor="flag-input" className="flag-label">
                    ENTER FLAG:
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="flag-input"
                      type="text"
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && submitFlag()}
                      placeholder="flag{...}"
                      className="flag-input"
                      disabled={selectedChallenge.solved}
                    />
                    <button
                      onClick={submitFlag}
                      className="submit-button"
                      disabled={!flagInput.trim() || selectedChallenge.solved}
                    >
                      SUBMIT
                    </button>
                  </div>
                </div>

                {feedback && (
                  <div className={`feedback ${feedback.type}`}>
                    {feedback.message}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <div className="ascii-art">
                {`
   _____ _______ ______   
  / ____|__   __|  ____|  
 | |       | |  | |__     
 | |       | |  |  __|    
 | |____   | |  | |       
  \\_____|  |_|  |_|       
                `}
              </div>
              <p className="select-challenge-text">
                Select a challenge from the left to begin
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Demo challenges (fallback if API not ready)
const DEMO_CHALLENGES: Challenge[] = [
  {
    id: "lookeecode",
    title: "Look E Code",
    category: "crypto",
    difficulty: "easy",
    points: 100,
    description: "We intercepted this mysterious image with geometric symbols. Can you decode the hidden message?\n\nFlag format: flag{decoded_message}",
    hint: "The shapes look like parts of letters! Try matching them visually.",
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
    solved: false,
  },
];

export default App;
