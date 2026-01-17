# 🎮 Testing Guide - Quick Start

## Current Status
✅ Server is running on port 3001
✅ Client is running on http://localhost:3000
✅ Game is functional (TypeScript errors are editor-only, not runtime)

## How to Test the Game

### Step 1: Open the Game
Go to: **http://localhost:3000**

### Step 2: Connect Wallet (Mock)
1. Click the **"CONNECT WALLET (MOCK)"** button
2. You'll see a green checkmark with a mock wallet address
3. This simulates a TRON wallet connection (no real crypto needed)

### Step 3: Join the Game
1. Click **"ENTER ARENA ($1.00)"** button
2. You'll be added to the lobby
3. The game will show: "LOBBY: 1/16 PLAYERS"

### Step 4: Wait for Game Start
The game will start automatically when:
- **16 players join** (instant start), OR
- **60 seconds pass** (bots will fill remaining slots)

For testing, just wait 60 seconds and bots will join automatically.

### Step 5: Play the Game
Once the game starts:
- Use **Arrow Keys** (↑ ↓ ← →) to control your lightcycle
- Avoid hitting trails (yours or others')
- Survive as long as possible
- The arena shrinks over time

### Step 6: Game Over
When the game ends:
- You'll see your final rank
- Top 3 players get prizes
- Click "RE-ENTER ARENA" to play again

## Testing with Multiple Players

### Option 1: Multiple Browser Windows
1. Open http://localhost:3000 in multiple windows
2. Each window = separate player
3. Connect wallet and join in each window

### Option 2: Different Browsers
1. Chrome window
2. Firefox window
3. Edge window
4. Each acts as a different player

### Option 3: Incognito Mode
1. Regular window + Incognito window
2. Each has separate session

## Checking if Everything Works

### Browser Console (F12)
You should see:
```
[SOCKET] Connected: <socket-id>
[<timestamp>] CONNECTED AS <socket-id>
[<timestamp>] LOBBY: 1/16 PLAYERS
```

### Server Console
You should see:
```
[CONNECT] Player <socket-id> connected
[LOBBY] Player TRADER_XXXX joined. Lobby size: 1/16
```

## Common Issues & Solutions

### Issue: "CONNECT WALLET (MOCK)" button doesn't work
**Solution:** Check browser console (F12) for errors

### Issue: Game doesn't start
**Solution:** Wait 60 seconds for bots to fill, or open multiple browser windows

### Issue: Arrow keys don't work
**Solution:** Click on the game canvas area first to focus it

### Issue: Can't see the game arena
**Solution:** Make sure the game has started (wait for countdown)

## TypeScript Errors (Can Ignore)

The TypeScript errors you see in VS Code are **editor-only** and don't affect the running game:
- ❌ Editor shows errors
- ✅ Game runs perfectly

To fix editor errors:
1. Press `Ctrl+Shift+P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter

Or just ignore them - they don't affect gameplay!

## What to Test

### Basic Functionality
- [ ] Wallet connection works
- [ ] Lobby joining works
- [ ] Game starts (with bots)
- [ ] Player movement (arrow keys)
- [ ] Collision detection
- [ ] Trail rendering
- [ ] Arena shrinking
- [ ] Game over screen
- [ ] Rankings display

### Multiplayer (if testing with multiple windows)
- [ ] Multiple players can join
- [ ] All players see each other
- [ ] Collisions work between players
- [ ] Game ends when ≤3 players alive

### Bot AI
- [ ] Bots move intelligently
- [ ] Bots avoid collisions
- [ ] Bots compete fairly

## Performance Check

The game should run at **60 FPS** smoothly. If it's laggy:
- Close other applications
- Try a different browser
- Check CPU usage

## Next Steps After Testing

Once you've confirmed everything works:
1. Read `DEPLOYMENT.md` for production setup
2. Deploy smart contract to TRON testnet
3. Enable real wallet integration
4. Deploy to production servers

---

**Enjoy testing! 🎮⚡**

If you find bugs, note them down and we can fix them together.
