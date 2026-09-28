# Categorize — Real-Time Multiplayer Categorization Game

A fast-paced, real-time multiplayer speed-and-accuracy categorization challenge featuring a modern **light-theme 3D tactile UI**, authoritative server-side scoring, WebSocket-powered live synchronization, and dedicated Host and Player experiences.

---

## 🌟 Key Features

### 1. Host Dashboard (Creator Role)
- **Room Management**: Create unique game rooms with 6-character room codes (e.g., `#A7X92K`).
- **Question Manager**:
  - Pre-seeded with 4 diverse categories & items questions (Food/Animals/Vehicles/Tech, Earth & Universe, Tech Stack, Sports & Arts).
  - Add, Edit, Delete, Duplicate, and Randomize questions.
  - Unlimited items and customizable category tags with color accents.
  - Configurable time limits per round.
- **Authoritative Game Engine**:
  - Synchronized 3-second starting countdown (`3.. 2.. 1.. GO!`).
  - Pause & Resume round timers anytime.
  - Advance to next round or end game early.
  - **Live Scoreboard (Host Eyes Only)**: Real-time table streaming player rank, status (Thinking vs. Submitted), correct count, wrong count, completion time, round score, and cumulative total score.
  - **Reveal Leaderboard Toggle**: Optional host-controlled reveal of final rankings at game conclusion.

### 2. Player Experience
- **Simple Room Join**: Join with Game ID / Room Code + Player Name.
- **Waiting Room**: Real-time connected player list with live presence dots.
- **Question Screen**:
  - Clean light-theme 3D design language (soft depth, elevated cards, tactile button press physics).
  - Dual-input categorization:
    - **Smooth 3D Drag-and-Drop**: Lift, tilt, realistic shadow depth, and target highlighting.
    - **Tap / Click-to-Place Fallback**: Perfect for smartphones and tablets.
  - Dynamic 3D Countdown Timer with color transitions (indigo → amber → warning rose below 7s with tick sound).
  - Personal progress counter and live score gain.
  - **Zero Score Leaks**: Live rankings and opponents' scores are strictly hidden from players during gameplay.
- **Round Intermission & Final Results**:
  - Displays personal accuracy percentage, speed, correct/wrong counts, and cumulative score.
  - Celebratory victory confetti fanfare on game completion.
  - Revealed final leaderboard when unlocked by the host.

### 3. Fair Play & Security
- **Server-Side Validation**: Correct category mappings are NEVER sent to the player client before submission.
- **Authoritative Scoring**:
  - Accuracy: Correct items receive full points; wrong placements receive 0 points.
  - Speed bonus tiers based on server-side elapsed timestamps:
    - 0–10s: 100 points / item
    - 11–20s: 80 points / item
    - 21–30s: 60 points / item
    - 31–40s: 40 points / item
    - 41–50s+: 20 points / item

### 4. Synthesized Audio Engine
- Built-in Web Audio API synthesizer for tactile clicks, drag-lift tones, drop settle clicks, correct chimes, wrong thuds, and victory fanfares without external audio file dependencies.
- Persistent Sound On/Off mute toggle in header.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS 3D Design System (`theme.css`), Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.IO, TypeScript.
- **Database / Persistence**: Relational schema persistence layer in `server/data/database.json`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:3001`.

### 2. Start Frontend Client
In a new terminal:
```bash
cd client
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 🎮 How to Play Multi-Window Demo

1. Open `http://localhost:5173/` in Browser Window 1 (Host).
2. Click **CREATE GAME**, enter a title, and launch the Host Dashboard. Note the Game ID (e.g., `#A7X92K`).
3. Open `http://localhost:5173/` in Browser Window 2 (Player 1, e.g., "Arun").
4. Click **JOIN GAME**, enter the Room Code and name "Arun".
5. Optionally open Browser Window 3 (Player 2, e.g., "Priya") and join the same room.
6. In Window 1 (Host), see Arun and Priya appear in the Connected Players list and click **Start Game**.
7. In the Player windows, watch the 3-second countdown and sort items into categories.
8. Submit answers and see the Host's Live Scoreboard update instantaneously!
