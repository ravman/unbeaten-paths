# UNBEATEN PATHS 🗺️

> Off-beat city discovery app — find the real city, not the tourist traps.

A full-stack React app for discovering genuinely local, non-touristy spots rated by locals and travellers on **Vibe**, **Local Love**, and **Uniqueness**.

## Features

### 🔍 Explore
- Browse 112 verified Bangkok spots across restaurants, bars, experiences, and markets
- Filter by type and search by name, neighbourhood, or tag
- Each spot rated on Vibe, Local Love, and Uniqueness with an overall score

### 📍 Submit a Spot
- Community submission form with dual AI agent validation
- **Agent 1 — Fact Checker**: Verifies the spot is plausible and genuinely local
- **Agent 2 — Vibe Curator**: Ensures it's truly off the tourist trail
- Both agents must approve before the spot enters the admin queue

### ⚙️ Admin Panel
- **Discovery Engine**: 10 specialist agents covering Bangkok districts, each finding 10 spots (target: 100)
- Live terminal view per agent with real-time log streaming
- Approve / reject community submissions with full agent verdict display
- Manage live spots and add new cities

## Discovery Agents

| Agent | Zone | Focus |
|-------|------|-------|
| 🌙 | Thonglor / Ekkamai | Late-night bars, speakeasies, craft cocktail dens |
| 🏛️ | Old Town / Rattanakosin | Hidden temples, canal teahouses, artisan workshops |
| 🐉 | Chinatown / Talat Noi | Dawn street food, old-school coffee, herbal bars |
| 🌊 | Riverside / Chao Phraya | Longtail-accessible bars, canal kitchens |
| 🎨 | Ari / Phahon Yothin | Vinyl cafes, natural wine bars, indie brunch |
| 🌿 | Thonburi West Bank | Canal villages, fruit orchards, shadow puppets |
| ⚡ | Ratchada / Lat Phrao | Underground music, street-food clusters |
| 🍸 | Silom / Sathorn | Jazz dens, wine caves, private dining |
| 🎭 | Banglamphu / Phra Nakhon | Bookshop bars, folk music, mural trails |
| 🔮 | Sukhumvit Mid | Unmarked tasting menus, fermentation cafes |

## Getting Started

### Prerequisites
- Node.js 18+
- An Anthropic API key (for the AI agent features)

### Installation

```bash
npm create vite@latest unbeaten-paths -- --template react
cd unbeaten-paths
npm install
cp ../offbeat-city-app.jsx src/App.jsx
npm run dev
```

### API Key Setup

The app calls the Anthropic API directly from the browser artifact environment. For local development, you'll need to proxy requests through a backend or use a Vite proxy config:

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, '')
      }
    }
  }
}
```

## Data

`discovered_spots.json` contains all 100 agent-discovered Bangkok spots with full metadata:
- Name, type, neighbourhood
- Vibe / Local Love / Uniqueness scores
- Insider tip and full description
- Tags and agent provenance

## Admin Access

Demo password: `unbeaten2025`

## Tech Stack

- **React** (hooks, no external state library)
- **Anthropic Claude API** (claude-sonnet-4) for agent validation and discovery
- **Pure CSS-in-JS** with custom design system (dark editorial aesthetic)
- **Google Fonts** — Cormorant Garamond, DM Sans, Space Mono

## Spot Rating System

Each spot is scored across three dimensions (1–10):

| Dimension | What it measures |
|-----------|-----------------|
| **Vibe** | Atmosphere, energy, overall feel |
| **Local Love** | How much locals actually use and recommend it |
| **Uniqueness** | How off-beat and irreplaceable it is |

Overall score = average of the three dimensions.

## Cities

Currently: **Bangkok 🇹🇭**

Admin can add new cities via the Cities tab. Discovery Engine can be re-run for any active city.

---

Built with [Claude](https://claude.ai) · No tourist traps, ever.
