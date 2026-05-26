# streamtracker

A CLI tool to track Twitch streamers and their League of Legends accounts in real time.

Built with Node.js, Twitch API, and Riot Games API.

> **GUI is in development** — CLI is live and fully functional.

## Features

**Twitch**
- Live status, viewer count, stream title, current game

**League of Legends**
- SoloQ and FlexQ rank with winrate
- In-game detection with champion name
- Last 20 matches with KDA, CS, duration, queue type, date
- Winrate breakdown per queue type

**Accounts**
- Track streamers with their linked LoL accounts
- Track LoL accounts standalone, without a Twitch channel

## Installation

```bash
git clone https://github.com/PastelDastel/streamtracker.git
cd streamtracker
npm install
```

Create a `.env` file in the root:

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
RIOT_API_KEY=your_riot_api_key
```

Then install globally:

```bash
npm install -g .
```

**Twitch API** — register your app at [dev.twitch.tv](https://dev.twitch.tv)

**Riot API** — get your key at [developer.riotgames.com](https://developer.riotgames.com)

> Riot dev keys expire every 24h. For production use you need to apply for a production key.

## Usage

### Streamers

```bash
# Add a streamer with linked LoL accounts
streamtracker add caedrel --lol "Caedrel#EUW#euw1,AltAccount#EUW#euw1"

# Check all streamers
streamtracker check

# Check a specific streamer
streamtracker check caedrel

# List saved streamers
streamtracker list

# Remove a streamer
streamtracker remove caedrel
```

### LoL accounts (standalone)

```bash
# Add a LoL account
streamtracker add-lol DesperateNasus#TWTV#euw1

# Full infodump on an account
streamtracker check-lol DesperateNasus#TWTV#euw1

# Check all saved LoL accounts
streamtracker check-lol

# Remove a LoL account
streamtracker remove-lol DesperateNasus#TWTV#euw1
```

### Example output

```
── desperatenasus ──
  🔴 LIVE — League of Legends — 376 viewers
     "EUW 2130 LP START I !Patreon !Korea !Coaching"

  LoL: DesperateNasus#TWTV (euw1)
  SoloQ: CHALLENGER I 2250LP (371W 292L) 55.9% WR
  FlexQ: Unranked
  🎮 In game — Kayle
```

```
── DesperateNasus#TWTV (euw1) ──
  SoloQ:       CHALLENGER I 2250LP (371W 292L) 55.9% WR
  FlexQ:       Unranked
  🎮 In game — Kayle

  SoloQ        (12W 8L) 60.0% WR
  Draft        (3W 2L)  60.0% WR
  WR Last 20: 15W 5L (75.0%)

  Last 20 games:
  W Kayle           8/2/10       CS:187  32min  SoloQ      26/05/2026
  L Nasus           4/7/3        CS:210  28min  SoloQ      26/05/2026
  ...
```

## Supported regions

`euw1` `eun1` `na1` `kr` `br1` `la1` `la2` `tr1` `ru` `jp1` `oc1`

## Tech stack

- **Node.js** — no framework, native modules
- **commander** — CLI parsing
- **chalk** — colored terminal output
- **axios** — HTTP requests
- **Twitch Helix API** — streamer and stream data
- **Riot Games API** — account, rank, match history

## Roadmap

- [ ] GUI (in development)
- [ ] Multi-streamer check in parallel
- [ ] Champion stats across last N games
- [ ] Notifications when a streamer goes live

## License

MIT