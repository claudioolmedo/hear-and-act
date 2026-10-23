# Hear & Act

**A voice-first agent that hears a command, understands it, and acts in the physical world.**

Think of it as **an open-source Alexa** — one you can build yourself, teach new things, and connect to real hardware. Everything lives in this repository.

Submission for the **Beta Fund × AWS × OpenAI Multi-Model Hackathon** — AWS Builder Loft, San Francisco, October 23, 2026.

## The idea

Most hackathon demos live on a screen. This one doesn't.

A person speaks. The agent listens, holds a real conversation, understands the intent — and then **does something physical**: it moves a servo-driven device. Hear → understand → act, live on the table.

It is built for the **Multi-Modal Agents** track: an agent that can hear, reason, and take action across modalities, from voice to the physical world.

## How it works

```
Microphone (ReSpeaker XVF3800 array, or any mic)
  → local app captures audio
  → AssemblyAI Voice Agent API (speech recognition + LLM + voice synthesis, over WebSocket)
  → agent replies by voice AND emits an action when it understands a command
  → action layer: on-screen actuator + optional serial hook to a servo device
```

- The **voice agent** runs on the AssemblyAI Voice Agent API, following the same architecture as the "Assembly + Ferbly" project (a vintage toy turned into a voice agent at the AssemblyAI hardware workshop, Oct 7, 2026).
- The **local app** is the only thing that talks to the API. It mints a short-lived session token with a locally stored API key — **the key never leaves the machine and is never committed to this repo.**
- The **action layer** listens for action intents in the conversation (tool calls / recognized command phrases) and triggers the physical response. With no hardware attached, a full-screen on-screen actuator demonstrates the same loop; with a serial device attached (WebSerial), it drives a real servo.

## Status

- [x] Concept and architecture
- [x] Voice agent already proven (Ferbly project, AssemblyAI workshop)
- [ ] Local app built in this repo (in progress — see `docs/CODEX_BRIEF.md`)
- [ ] Action layer wired to the demo device
- [ ] Demo rehearsed and recorded (backup video)

## Running it

Setup and run instructions land here as the app is built (see `app/`).

Credentials: the app reads `ASSEMBLYAI_API_KEY` from a local env file on the build machine (same credential store as the Ferbly project). Never commit `.env` or `credentials.env` — they are git-ignored.

## Submission

Checklist and links: `docs/SUBMISSION.md` (being finalized against the official Participant Handbook).

## License

MIT — see `LICENSE`.
