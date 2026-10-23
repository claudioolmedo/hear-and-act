# Hear & Act — local demo app (READY TO RUN)

Zero dependencies. Node 18+ and Chrome are all you need.

## Run it (on Claudio's Mac)

```bash
git clone https://github.com/claudioolmedo/hear-and-act.git   # or: cd hear-and-act && git pull
cd hear-and-act/app
node server.js
```

Then open **http://localhost:8787** in Chrome:

1. The mic list auto-selects the **ReSpeaker** when it is plugged in (USB).
2. Click **▶ Start** and allow microphone access.
3. Speak: talk to the agent — and try **"wave"**, **"turn left"**, **"turn right"**, **"dance"**, **"stop"**. The agent answers by voice and the action fires full-screen.

## How credentials work

No setup needed on Claudio's Mac: `server.js` reads `ASSEMBLYAI_API_KEY` and `AGENT_ID_MINIMAL` automatically from the local credential store of the earlier workshop project (the server auto-discovers the `credentials.env` in that project's application-support folder; fallback: the `.env` in the project folder). The key is used only on this machine to mint a 60-second session token — it never reaches the browser and is never committed. On any other machine, copy `.env.example` to `.env` and fill it in locally.

## Demo checklist

- [ ] ReSpeaker plugged in and selected
- [ ] One full test: speak a command → voice reply → action fires
- [ ] Record the demo video (max 2 minutes — shot list in `docs/BUILD_GUIDE.md`, section 8.1)
- [ ] Keep this tab full-screen during the live demo

## Files

- `server.js` — static server + `/token` endpoint (mints the AssemblyAI session token locally)
- `index.html` — the whole demo UI: voice session, live transcripts, action layer, on-screen actuator, optional WebSerial servo hook
- `pcm-worklet.js` — mic capture, downsamples to 24 kHz PCM16 for the Voice Agent API

Spec and background: `docs/BUILD_GUIDE.md`.
