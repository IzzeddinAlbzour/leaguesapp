# OpenWA assessment — WhatsApp as a notification channel

Repo: `github.com/rmyndharis/OpenWA` · MIT · NestJS · ~14k stars · active (commits daily).
Self-hosted HTTP API in front of a reverse-engineered WhatsApp Web client. Not Meta's official API.

## Verdict

**Not for the MVP. Add it at slice 7 as the notification reach-layer, exactly where the spec already puts it.**

It solves a real problem we will have — reaching captains who never install the PWA, and collecting result confirmations by reply — but none of that is on the path to proving the `fixtures → results → standings` engine works, which is the only thing the MVP has to do.

## What it can do for us

| Use | Endpoint | Safety |
|---|---|---|
| Match-day reminder ("الجمعة 8:00، ملعب السلام، ضد أسود جنين") | `send-template` with `{{vars}}` | Safe — opted-in recipient, low volume |
| Result-confirmation ping + **capture the reply** ("خصمك سجّل 3-2، رد نعم") | `send-text` out, `message.received` webhook in | Safe, and high value — see below |
| Payment-installment nudge | `send-template` | Safe |
| Post-round standings broadcast to all captains | `send-bulk` (≤100/batch, async, 3s jittered pacing) | Safe — 8-team league is 8 messages |

**The confirmation reply is the strongest case.** The spec's result flow stalls on the opposing captain confirming. A WhatsApp round-trip — we send the score, they reply `نعم`, an HMAC-signed `message.received` webhook hits our app and flips the match to `admin_confirmed` — closes that loop without either captain opening anything. Web Push cannot receive a reply.

## What it cannot do

- **Signup OTP.** WhatsApp silently drops the first message to a number that has never messaged the sender (OpenWA issue #830 — the API returns success, delivery does not happen). Every signup OTP is a first-contact. This is why auth stays phone + password; it is not a limitation we can pace around.
- **Invite-link delivery to non-users.** Same first-contact problem. The captain pastes the link in their own WhatsApp; we do not send it from the league number.
- **Run on our current infra.** Needs a persistent host with Docker and ~1 GB RAM (the `whatsapp-web.js` engine drives a headless Chromium, 300–500 MB per session; the compose file sets a 1–2 GB limit). Not serverless, not Vercel, not the Supabase box.

## Cost

Not $0 on the stack we have. The one genuinely free host that can run it: **Oracle Cloud Always Free** ARM VM (4 vCPU / 24 GB, free indefinitely, runs Docker). One `docker compose up`.

Ongoing: a dedicated SIM (never a personal or business number — bans are real, ~50% probability in OpenWA's own risk register, and unappealable through the tool). Plus the ops burden of a number that can get restricted mid-season and a protocol that can break on a WhatsApp update (their R001: 70% probability, needs an operator to pull a fix).

## If/when we adopt it

- Engine `whatsapp-web.js`, not `baileys` — lower fingerprint, worth the RAM.
- `SEND_PACING_ENABLED=true` — age-based daily cap, cold-conversation cap, consecutive-failure breaker. Off by default; turn it on.
- Dedicated SIM. Warm it for ~1 week before the season (scan QR, chat real contacts, set a photo) before any automated send.
- Keep Web Push as the primary channel. WhatsApp degrades to reach-only: if the number is restricted, reminders suffer but logins and standings do not.
