# 🎮 PlayDaily10 — 10 Daily Games, One Link, Zero Language

A complete, premium, 100% static web-game arcade. Every day the whole world
gets the **exact same 10 challenges** (UTC date-seeded, resetting at 00:00 UTC
at the same instant worldwide — no server needed).

## 🎲 The 10 Games
| # | Game | Type | Daily Twist |
|---|---|---|---|
| 1 | 🧩 BlockFit Daily | Puzzle | Same piece sequence for everyone |
| 2 | 🍉 MergeMelon Daily | Puzzle | Same fruit order; grow the watermelon |
| 3 | ⭕ Perfect Circle Daily | Timing/Skill | New circle-size target daily |
| 4 | 🧪 ColorSort Daily | Puzzle | Solver-verified solvable puzzle + Par |
| 5 | 🚀 TapFly Daily | Arcade | Identical 30-gate course |
| 6 | 🏗️ StackUp Daily | Timing | Daily speed & color pattern |
| 7 | 🍬 Match3 Daily | Puzzle | Same board, 25 moves, score attack |
| 8 | 🐍 Snake Daily Maze | Arcade | Same maze + apple order |
| 9 | ⏱️ Stop 5.000 | Timing | Seeded reaction/precision course (1,000 pts) |
| 10 | 🔢 Mini Sudoku Daily | Puzzle | Unique-solution 6×6; difficulty grows Mon→Sun |

## ✨ Every game includes
- ☀️ **Daily mode + Free Play**, 🔥 streak, 🏆 best score (localStorage;
  kept separate per mode wherever the rules/length differ, so bests stay fair)
- 📲 **Share card** (emoji grid / image where possible) + WhatsApp button
- ⚔️ **Challenge links** — `?seed=…&beat=…` lets a friend replay your exact
  challenge and try to beat your score. The URL is the "multiplayer server".
- 🔊 Sound effects (WebAudio, no files), 🎉 celebrations, ⏸️ pause where relevant
- 📱 Touch-first controls (drag, swipe, tap, D-pad) + keyboard play where it
  fits the game (arrows/space/digits), colorblind-safe symbols in ColorSort
- 🇬🇧 **English UI** designed around icons & numbers — language-light by design

## 📴 PWA
`manifest.webmanifest` + `sw.js` make the arcade installable (“Add to Home
Screen”) and fully playable offline after the first visit. The shared engine
registers the Service Worker on **every page**, including a direct game or
challenge link. Pages are network-first, so updates arrive immediately when
online, while shared assets refresh in the background. Challenge URLs with
`?seed=…&beat=…` also resolve from the offline page cache.

## 🚀 Deploy free on GitHub Pages (5 minutes)
1. Create a GitHub repo, e.g. `playdaily10`
2. Upload **everything inside this folder**, including the hidden `.nojekyll`
   file (keep the structure!)
3. Repo → **Settings → Pages** → Source: `main` branch, `/ (root)` → Save
4. Your site goes live at `https://<username>.github.io/playdaily10/`
5. (Optional) Buy a short domain later and point it to GitHub Pages.

No build step. No backend. Total size ≈ **230 KB** for the whole arcade.

## 🧩 Structure
```
index.html              ← arcade hub
games/*.html            ← the 10 games (one file each)
assets/style.css        ← shared premium design system
assets/engine.js        ← shared Daily Engine (seeds, streaks, share, sound)
assets/icon-*.png       ← PWA icons (including a dedicated maskable icon)
manifest.webmanifest    ← PWA manifest
sw.js                   ← offline service worker
404.html                ← friendly lost-page
.nojekyll               ← GitHub Pages: serve files exactly as authored
```

## ⚖️ Note
All artwork is emoji/CSS and all names are original. Core mechanics are
inspired by classic, widely-played formats; no third-party assets, names or
art are used. Keep it that way when you add your own twists.
