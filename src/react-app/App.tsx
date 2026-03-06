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

interface LeaderboardEntry {
  username: string;
  score: number;
  challengesSolved: number;
  lastSolved?: string;
}

interface UserStats {
  username: string;
  score: number;
  rank: number;
  totalPlayers: number;
  challengesSolved: number;
  recentSolves: string[];
}

function App() {
  // Auth state
  const [username, setUsername] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  
  // Challenge state
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dashboard state
  const [showDashboard, setShowDashboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    // Check for stored username
    const stored = localStorage.getItem("ctf_username");
    if (stored) {
      setUsername(stored);
      setIsLoggedIn(true);
      loadUserData(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserData = async (user: string) => {
    try {
      const res = await fetch("/api/challenges", {
        headers: { "x-username": user },
      });
      const data = await res.json();
      setChallenges(data.challenges || []);
      setTotalScore(data.totalScore || 0);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard", {
        headers: { "x-username": username },
      });
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setUserStats(data.userStats || null);
    } catch (error) {
      console.error("Failed to load leaderboard");
    }
  };

  const handleLogin = async () => {
    if (!usernameInput.trim() || usernameInput.length < 3) {
      alert("Username must be at least 3 characters!");
      return;
    }

    const user = usernameInput.trim();
    localStorage.setItem("ctf_username", user);
    setUsername(user);
    setIsLoggedIn(true);
    
    await loadUserData(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("ctf_username");
    setUsername("");
    setIsLoggedIn(false);
    setChallenges([]);
    setTotalScore(0);
    setSelectedChallenge(null);
    setShowDashboard(false);
  };

  const submitFlag = async () => {
    if (!selectedChallenge || !flagInput.trim()) return;

    setFeedback(null);
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-username": username,
        },
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
      setFeedback({ type: "error", message: "Failed to submit flag" });
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

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">
              <span className="bracket">{'>'}</span>
              <span className="title-text">CTF_ARENA</span>
              <span className="cursor-blink">_</span>
            </h1>
            <p className="login-subtitle">CAPTURE THE FLAG CHALLENGE PLATFORM</p>
          </div>

          <div className="login-box">
            <div className="terminal-window">
              <div className="terminal-header">
                <span className="terminal-button red"></span>
                <span className="terminal-button yellow"></span>
                <span className="terminal-button green"></span>
              </div>
              <div className="terminal-body">
                <p className="terminal-text">$ ACCESS REQUIRED</p>
                <p className="terminal-text">$ ENTER USERNAME TO CONTINUE...</p>
              </div>
            </div>

            <div className="login-form">
              <label htmlFor="username" className="login-label">
                USERNAME:
              </label>
              <input
                id="username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="hacker123"
                className="login-input"
                autoFocus
              />
              <button onClick={handleLogin} className="login-button">
                ENTER ARENA →
              </button>
            </div>

            <div className="login-info">
              <p>🎯 Solve challenges to earn points</p>
              <p>🏆 Compete on the global leaderboard</p>
              <p>🚩 10 challenges across 4 categories</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="terminal-text">LOADING CHALLENGES...</div>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (showDashboard) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1 className="title">
              <span className="bracket">{'>'}</span>
              <span className="title-text">DASHBOARD</span>
            </h1>
            <div className="header-actions">
              <button onClick={() => setShowDashboard(false)} className="nav-button">
                ← CHALLENGES
              </button>
              <button onClick={handleLogout} className="logout-button">
                LOGOUT
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-container">
          <div className="user-stats-card">
            <h2 className="stats-title">
              <span className="terminal-prompt">$</span> PLAYER STATS
            </h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">USERNAME</div>
                <div className="stat-value username-display">@{username}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">TOTAL SCORE</div>
                <div className="stat-value score-highlight">{totalScore}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">RANK</div>
                <div className="stat-value rank-display">
                  {userStats?.rank || "—"} / {userStats?.totalPlayers || "—"}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">SOLVED</div>
                <div className="stat-value">{challenges.filter(c => c.solved).length} / {challenges.length}</div>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-label">COMPLETION PROGRESS</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${(challenges.filter(c => c.solved).length / challenges.length) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="progress-text">
                {Math.round((challenges.filter(c => c.solved).length / challenges.length) * 100)}%
              </div>
            </div>
          </div>

          <div className="leaderboard-card">
            <div className="leaderboard-header">
              <h2 className="stats-title">
                <span className="terminal-prompt">$</span> GLOBAL LEADERBOARD
              </h2>
              <button onClick={loadLeaderboard} className="refresh-button">
                ↻ REFRESH
              </button>
            </div>

            <div className="leaderboard-table">
              <div className="leaderboard-header-row">
                <div className="rank-col">RANK</div>
                <div className="name-col">PLAYER</div>
                <div className="score-col">SCORE</div>
                <div className="solved-col">SOLVED</div>
              </div>
              
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div 
                    key={entry.username} 
                    className={`leaderboard-row ${entry.username === username ? "current-user" : ""} ${index < 3 ? `top-${index + 1}` : ""}`}
                  >
                    <div className="rank-col">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <div className="name-col">
                      {entry.username}
                      {entry.username === username && <span className="you-badge">YOU</span>}
                    </div>
                    <div className="score-col">{entry.score}</div>
                    <div className="solved-col">{entry.challengesSolved}</div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <p>No leaderboard data yet. Click REFRESH to load!</p>
                </div>
              )}
            </div>
          </div>

          <div className="category-stats-card">
            <h2 className="stats-title">
              <span className="terminal-prompt">$</span> CATEGORY BREAKDOWN
            </h2>
            <div className="category-grid">
              {["crypto", "forensics", "web", "misc"].map(category => {
                const categoryChalls = challenges.filter(c => c.category === category);
                const solved = categoryChalls.filter(c => c.solved).length;
                const total = categoryChalls.length;
                const percentage = total > 0 ? (solved / total) * 100 : 0;

                return (
                  <div key={category} className="category-stat-item">
                    <div className="category-name" style={{ color: getCategoryColor(category) }}>
                      {category.toUpperCase()}
                    </div>
                    <div className="category-progress">
                      <div className="mini-progress-bar">
                        <div 
                          className="mini-progress-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(category)
                          }}
                        ></div>
                      </div>
                      <span className="category-count">{solved}/{total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Challenge View (continued in next message due to length)
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="bracket">{'>'}</span>
            <span className="title-text">CTF_ARENA</span>
            <span className="cursor-blink">_</span>
          </h1>
          <div className="header-right">
            <div className="user-info">
              <span className="username-badge">@{username}</span>
            </div>
            <div className="score-display">
              <span className="score-label">SCORE:</span>
              <span className="score-value">{totalScore}</span>
            </div>
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
          <div className="stat-actions">
            <button onClick={() => {
              loadLeaderboard();
              setShowDashboard(true);
            }} className="dashboard-button">
              📊 DASHBOARD
            </button>
            <button onClick={handleLogout} className="logout-mini-button">
              LOGOUT
            </button>
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

export default App;
