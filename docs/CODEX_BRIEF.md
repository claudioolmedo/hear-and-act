# Build brief — Hear & Act local app

**One job:** in this repository, build the local app that runs the Hear & Act demo end-to-end on this Mac, following the architecture in `README.md` and the rules below. When it works, stop and report (see "Report back").

**Full specification: `docs/BUILD_GUIDE.md`** — hardware, credential locations, the exact API protocol, the action layer, the demo script and troubleshooting. Read it before writing code; this brief is the summary, the guide is the source of truth.

## What to build

A local app (browser app served by a tiny local server is preferred — fastest to run and demo) that:

1. **Token step (server side, local only):** a small local server reads the AssemblyAI API key from the existing local credential store of the Ferbly project — `~/Library/Application Support/Assembly + Ferbly/credentials.env` (fallback: the `furby/.env` inside the local "Hardware hackathon - turn a vintage toy into a voice agent" project folder) — and mints a 60-second session token from `GET https://agents.assemblyai.com/v1/token?product=voice_agent&expires_in_seconds=60` with header `Authorization: Bearer <key>`. The key must never be printed, logged, written into this repo, or sent to the browser.
2. **Voice session (browser):** connect a WebSocket to `wss://agents.assemblyai.com/v1/ws?token=<TOKEN>`, send `{"type":"session.update","session":{"agent_id":"..."}}` using the existing agent id from the same credential store (`AGENT_ID_MINIMAL`). Stream microphone audio as PCM16 mono at 24 kHz, base64 in `{"type":"input.audio","audio":"..."}` messages; play `reply.audio` back. Show live transcripts (`transcript.user`, `transcript.agent`) on screen. The Ferbly project on this Mac (Electron app in the project folder above) is the working reference implementation for this protocol — reuse its protocol handling where useful.
3. **Microphone:** prefer the ReSpeaker XVF3800 USB mic array when present (device name contains "respeaker"); otherwise the default mic. Speaker output to the ReSpeaker when present, else default output.
4. **Action layer:** watch the conversation for action intents — a `tool.call` event if the agent emits one, or recognized command phrases in the final user/agent transcripts (keep a small, obvious command table, e.g. "wave", "turn left", "turn right", "stop", "dance"). On an action:
   - fire the **on-screen actuator**: a big, unmistakable full-screen visual state change labeled with the action name (this is the guaranteed demo path), and
   - if a serial device is connected (WebSerial, user-granted), send the matching single-byte/line command to it (servo hook). Serial must be optional and fail silently.
5. **UI:** one screen, demo-first: huge status (Listening / Thinking / Acting + the action name), the live transcript, a Start/Stop button, and nothing else that can break live. Big type, high contrast — it will be shown across a room.

## Hard rules

- **No secrets in the repo.** Never write the API key or tokens into any file, commit, log, or screenshot. `.env`/`credentials.env` are git-ignored; keep it that way.
- **Do not modify the Ferbly project or its credential files.** Read-only. If the packaged Ferbly app's agent is reused, reuse its agent id as-is; if a new agent must be published for the action behavior, publish a NEW agent and record only its id in a local (uncommitted) note — do not overwrite the existing agent.
- **Local only.** The demo must run from this Mac on localhost. (The voice API itself is a cloud service — that is expected and already proven.)
- **Keep it small and robust.** No frameworks heavier than needed, no build step if avoidable, no feature beyond this brief. A simple demo that survives the room beats an ambitious one that crashes.
- **Test the full loop once**: speak a command → agent answers by voice → actuator fires. Note the ReSpeaker's physical rate is 16 kHz while the protocol is 24 kHz — resample like the Ferbly renderer does.

## Report back

When done (or if blocked), report exactly:
1. What was built and where (files added in this repo).
2. The exact command(s) to run the demo.
3. Whether the full loop was tested (voice in → voice reply → action fired), and what the test command/action was.
4. Anything that did not work or needs a human decision.
