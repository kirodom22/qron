# QRON - Lightcycle Arena

A real-time multiplayer TRON-style lightcycle battle game with demo wallet integration.

## Features

- **Real-time Multiplayer** - Compete against real players online
- **Demo Wallet System** - Play with demo money (no real wallet needed)
- **Multiple Game Modes** - 1v1 Duel, Squad (4 players), Ranked (8), Arena (10)
- **Player Profiles** - Track win/loss, profit, and match history
- **Match Replays** - View past games
- **Professional UI** - Clean, dark theme with smooth animations

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Zustand
- **Backend**: Node.js, Express, Socket.io
- **Styling**: CSS with modern design patterns

## Local Development

```bash
# Install dependencies
npm install

# Run both frontend and backend
npm run dev

# Frontend only: http://localhost:3000
# Backend API: http://localhost:3001
```

## Deployment

This app requires **two separate deployments**:

### 1. Frontend (Netlify)

The frontend is static and can be deployed to Netlify:

1. Push to GitHub
2. Connect repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variable:
   - `VITE_SERVER_URL` = Your Railway backend URL

### 2. Backend (Railway/Render)

The WebSocket server needs a Node.js host:

**Railway:**
1. Connect repo to Railway
2. Set start command: `npm run server`
3. Add environment variables:
   - `NODE_ENV=production`
   - `DEMO_MODE=true`
   - `ALLOWED_ORIGINS=https://your-netlify-app.netlify.app`

**Render:**
1. Create a Web Service
2. Set build command: `npm install`
3. Set start command: `npm run server`
4. Add same environment variables as Railway

## Environment Variables

### Frontend (.env)
```
VITE_SERVER_URL=https://your-backend.railway.app
```

### Backend (set in hosting dashboard)
```
PORT=3001
NODE_ENV=production
DEMO_MODE=true
ALLOWED_ORIGINS=https://your-app.netlify.app
```

## Game Modes

| Mode | Players | Entry Fee | Prize Pool |
|------|---------|-----------|-----------|
| 1v1 Duel | 2 | $0.50 | $0.90 |
| Squad | 4 | $0.50 | $1.80 |
| Ranked | 8 | $1.00 | $7.20 |
| Arena | 10 | $1.00 | $9.00 |

## Demo Mode

When `DEMO_MODE=true`:
- No bots - games wait for real players only
- Demo wallet with fake money
- Perfect for testing and development

## Project Structure

```
QRON/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── store/              # Zustand state stores
│   └── services/           # Socket.io client
├── server/                 # Backend Node.js server
│   ├── game/               # Game logic
│   ├── middleware/         # Input validation
│   └── security/           # Anti-cheat
├── netlify.toml            # Netlify config
├── railway.json            # Railway config
└── package.json
```

## Controls

- **Arrow Keys** - Change direction
- **WASD** - Alternative controls
- **Avoid** - All trails (including your own)
- **Survive** - Outlast other players

## License

MIT
