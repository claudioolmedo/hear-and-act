# Hear & Act

**A voice-first agent that hears a command, understands it, and acts in the physical world.**

Think of it as **an open-source Alexa** — one you can build yourself, teach new things, and connect to real hardware. Everything lives in this repository.

Submission for the **Beta Fund × AWS × OpenAI Multi-Model Hackathon** — AWS Builder Loft, San Francisco, October 23, 2026.

## The idea

Most hackathon demos live on a screen. This one doesn't.

A person speaks. The agent listens, holds a real conversation, understands the intent — and then **does something physical**: it moves a servo-driven device. Hear → understand → act, live on the table.

It is built for the **Multi-Modal Agents** track: an agent that can hear, reason, and take action across modalities, from voice to the physical world.

## Built with the sponsors

- **AssemblyAI Voice Agent API** — the ears and the voice (a stack already proven live at AssemblyAI's own hardware workshop).
- **Keenable** — the knowledge: live web search for agents, so Hear & Act can answer real questions about the world, not just chat. ($200 in credits claimed at this event.)
- **Nebius Token Factory** — the inference credits behind the demo ($100 event promo).

## How it works

```
Microphone (ReSpeaker XVF3800 array, or any mic)
  → local app captures audio
  → AssemblyAI Voice Agent API (speech recognition + LLM + voice synthesis, over WebSocket)
  → agent replies by voice AND emits an action when it understands a command
  → action layer: on-screen actuator + optional serial hook to a servo device
```

- The **voice agent** runs on the AssemblyAI Voice Agent API, following the architecture already proven live at the AssemblyAI hardware workshop (Oct 7, 2026), where a vintage toy was turned into a working voice agent.
- The **local app** is the only thing that talks to the API. It mints a short-lived session token with a locally stored API key — **the key never leaves the machine and is never committed to this repo.**
- The **action layer** listens for action intents in the conversation (tool calls / recognized command phrases) and triggers the physical response. With no hardware attached, a full-screen on-screen actuator demonstrates the same loop; with a serial device attached (WebSerial), it drives a real servo.

## Status

- [x] Concept and architecture
- [x] Voice agent already proven live (AssemblyAI hardware workshop)
- [x] Local app built in this repo (`app/` — ready to run, see `app/README.md`)
- [ ] Action layer wired to the demo device
- [ ] Demo rehearsed and recorded (backup video)

## Running it

For the builder: start with `docs/CODEX_BRIEF.md` (the job) and `docs/BUILD_GUIDE.md` (the full spec — hardware, protocol, demo script). Run instructions land in `app/README.md` as the app is built.

Credentials: the app reads `ASSEMBLYAI_API_KEY` from a local env file on the build machine (the local credential store of the earlier workshop project). Never commit `.env` or `credentials.env` — they are git-ignored.

## Submission

Checklist and links: `docs/SUBMISSION.md` (being finalized against the official Participant Handbook).

## License

MIT — see `LICENSE`.
