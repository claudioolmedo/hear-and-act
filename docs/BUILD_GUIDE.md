# Build Guide — Hear & Act local demo

**Audience: the coding agent (Codex) building on Claudio's Mac.** Read this whole file before writing code. The one-job brief is `docs/CODEX_BRIEF.md`; this guide is the full specification behind it.

## 0. What you are building

**Hear & Act** — think of it as **an open-source Alexa you can build and teach**: a local app where a person talks to a voice agent, the agent converses back by voice, understands a command, and **acts in the physical world** (a servo device moves; an on-screen actuator shows the action when no hardware is attached).

It is a hackathon demo (Beta Fund × AWS × OpenAI Multi-Model Hackathon, Oct 23, 2026) built on the AssemblyAI Voice Agent API, reusing the proven architecture of the **Ferbly** project that already exists on this Mac. Everything you produce lives in this repository.

## 1. Hardware and prerequisites

- **This Mac** — the demo runs locally, served on `localhost`.
- **ReSpeaker XVF3800 USB 4-Mic Array** (Seeed Studio) — preferred microphone/speaker. Connect by USB. In the browser/app it appears as an audio device whose name contains **"respeaker"** (XMOS firmware). If absent, fall back to the default mic/speaker — the demo must still work.
- **Optional actuator hardware:** a servo device on USB serial (e.g., an Arduino-class board). Optional — the on-screen actuator is the guaranteed path; serial must never block the demo.
- **Software:** Node.js 18+ and a Chromium-based browser. No build step if avoidable.
- **Reference implementation on this machine:** the Ferbly project folder `~/Documents/ChatGPT/Hardware hackathon - turn a vintage toy into a voice agent/` (Electron app + handoff doc `FERBLY_HANDOFF_COMPLETO.md`). It already speaks the exact protocol below — mirror its protocol handling.

## 2. Credentials — read the rules twice

- The AssemblyAI API key lives **only** in the local credential store of the Ferbly project:
  - Primary: `~/Library/Application Support/Assembly + Ferbly/credentials.env` (permissions 0600) — variables include `ASSEMBLYAI_API_KEY` and `AGENT_ID_MINIMAL`.
  - Fallback: `furby/.env` inside the Ferbly project folder.
- **Read-only.** Never modify those files. Never print, log, screenshot, or commit the key or any session token. Never send the key to the browser — the local server uses it to mint a short-lived token (step 4.1) and only the token goes to the page.
- `.env` / `credentials.env` are git-ignored in this repo. Keep it that way.
- If a new agent must be published for the action behavior, publish a **new** agent and keep its id in a local uncommitted note. Never overwrite or reconfigure the existing Ferbly agent.

## 3. Architecture

```
ReSpeaker / mic ──► local web app (browser, localhost)
                        │  mic audio (PCM16, 24 kHz, base64)
                        ▼
                  local token server (Node, localhost)
                        │  mints 60 s token with the local API key
                        ▼
                  AssemblyAI Voice Agent API (WebSocket)
                        │  voice replies + transcripts (+ tool calls)
                        ▼
                  action layer (in the page)
                        ├─► on-screen actuator (always)
                        └─► WebSerial → servo device (optional)
```

## 4. Protocol reference (AssemblyAI Voice Agent API)

Proven in the Ferbly project — follow it exactly.

### 4.1 Session token (server side only)

```
GET https://agents.assemblyai.com/v1/token?product=voice_agent&expires_in_seconds=60
Header: Authorization: Bearer <ASSEMBLYAI_API_KEY>
```

Response contains the session token. Tokens live 60 seconds — mint a fresh one per session start.

### 4.2 Session (browser WebSocket)

```
wss://agents.assemblyai.com/v1/ws?token=<TOKEN>
```

On open, send:

```json
{ "type": "session.update", "session": { "agent_id": "<AGENT_ID_MINIMAL>" } }
```

(The current agent declares **no external tools**, so actions are detected from transcripts — see 4.4.)

### 4.3 Audio

- **Outbound (mic → API):** PCM16 mono, **24 kHz**, base64-encoded chunks:

```json
{ "type": "input.audio", "audio": "<base64 PCM16>" }
```

- **Inbound (API → speaker):** `reply.audio` messages carry base64 PCM16 at 24 kHz — play them back through the selected output device.
- **Sample-rate gotcha:** the ReSpeaker hardware runs at **16 kHz**; the protocol is 24 kHz. **Resample capture 16 kHz → 24 kHz** exactly as the Ferbly renderer does. Playback captured at the wrong rate sounds pitched — if the voice sounds wrong, check here first.

### 4.4 Events to handle

- `transcript.user` — what the person said (show it live).
- `transcript.agent` — what the agent replied (show it live).
- `tool.call` — if the agent ever emits one, treat its name/arguments as an action (see section 5).
- Session end / errors — surface them visibly; a silent failure kills a live demo.

## 5. The action layer

Watch the conversation for action intents, from (in priority order):

1. A `tool.call` event, if present.
2. Recognized command phrases in the final user/agent transcripts — keep a **small, obvious command table**, e.g.:

| Spoken command | Action |
|---|---|
| "wave" | Servo waves / actuator shows WAVE |
| "turn left" | Servo turns left / actuator shows TURN LEFT |
| "turn right" | Servo turns right / actuator shows TURN RIGHT |
| "stop" | Everything stops / actuator shows STOP |
| "dance" | Servo sequence / actuator shows DANCE |

On an action:

- **On-screen actuator (always):** a full-screen, unmistakable visual state change with the action name in huge type. This is the path the judges see even if hardware fails.
- **Serial (optional):** if the user has granted a WebSerial port, send the matching single-line command to the device. If no port is granted or the write fails, ignore silently and rely on the actuator.

## 6. UI — one screen, demo-first

- Huge status line: **Listening / Thinking / Acting — <ACTION NAME>**.
- Live transcript (user + agent), large enough to read across a room.
- One Start/Stop button. A device picker only if trivial.
- Nothing else that can break live. Big type, high contrast.

## 7. Run contract

When the build is done, Codex must leave in `app/README.md`:

- The exact command(s) to start the demo (server + page URL).
- How the demo was tested end-to-end (which spoken command fired which action).

## 8. The demo — what "done" looks like

### 8.1 Demo video (for the submission slide — max 2 minutes)

Film on this Mac with the ReSpeaker connected:

1. **0:00–0:20 — The hook:** "Voice assistants today can talk, but they can't do anything. This one can." Show the device at rest.
2. **0:20–1:20 — The loop, three times:** speak a command (wave / turn left / dance) → the agent answers by voice → the device moves and the actuator fires. Keep each cycle tight.
3. **1:20–1:50 — How it works:** show the app screen (live transcript + status) while one more command runs. One sentence on the architecture: AssemblyAI Voice Agent API + a local action layer.
4. **1:50–2:00 — The close:** "Hear & Act — an open-source Alexa you can build, teach, and connect to the physical world."

### 8.2 Live demo (3 minutes, strict, follows the 3 slides)

- **Slide 1 (Who):** name + one line of background each.
- **Slide 2 (What):** problem in one sentence, then run the loop live (the video is the backup if anything fails).
- **Slide 3 (Why):** 12 years of the One Dollar Computer; the voice stack already proven at AssemblyAI's own workshop; close with "Hear. Understand. Act."

Judges score: Multi-Modal Depth · Technical Execution · Usefulness & Impact · Product & Shipability · Demo Clarity. Every sentence of the demo should feed one of those.

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Agent never connects | Token expired (60 s) or key not loaded | Mint a fresh token at session start; verify the server read the credentials file |
| Voice sounds pitched/slow | Sample-rate mismatch | Resample capture 16 kHz → 24 kHz (see 4.3) |
| No mic in browser | Permission or wrong device | Serve over `localhost` (secure context); pick the "respeaker" device |
| Agent replies but nothing acts | Command not in the table / transcript not final | Check the command table against final transcripts; log detected intents on screen during testing |
| Serial device silent | Port not granted | Expected — the on-screen actuator is the demo path; never block on serial |

## 10. Guardrails

- **No secrets in the repo** — no key, no token, no `.env`, ever.
- **Do not modify the Ferbly project or its credential files.** Read-only reference.
- **Local only.** The app runs from this Mac on localhost. (The voice API is a cloud service — that is expected and already proven.)
- **Small and robust beats ambitious.** If a feature is not in this guide, it is out of scope.
