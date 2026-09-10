# OpenWA — outbound WhatsApp notifications

Repo: `github.com/rmyndharis/OpenWA` · MIT · NestJS · ~14k stars · active.
Self-hosted HTTP API in front of a reverse-engineered WhatsApp Web client. Not Meta's official API.

## Decision (2026-09-10)

OpenWA is the notification channel, used **outbound only**. Target users are iPhone-heavy and iOS Web Push needs a home-screen PWA install first, so Push cannot be the primary channel; WhatsApp is near-universal in Palestine regardless of phone. Web Push stays as the Android-side extra.

Built at **slice 7**. Outbound-only means nothing in slices 0–6 depends on it, and there is nothing to notify about before the standings engine exists.

## What we send — five messages, nothing more

| Message | Trigger | Endpoint |
|---|---|---|
| Your full schedule | admin publishes fixtures | `send-template` |
| Match tomorrow | cron, 24h before kickoff | `send-template` |
| A result needs your confirmation | opposing captain submitted a score | `send-template` with a deep link |
| Payment installment due | installment date passes, still unpaid | `send-template` |
| Standings after the round | admin confirms the last match of a round | `send-bulk` (one per captain) |

Templates are stored in OpenWA (`POST /templates`, `{{vars}}`), not in our database.

## What we deliberately do NOT do

| Rejected | Why |
|---|---|
| Parse inbound replies (`3-2`, `نعم`) | Which match? Two pending? «تلاتة اثنين»? All the complexity lives here. Instead the confirm message carries a **deep link** — «خصمك سجّل 3-2 👈 [أكّد]» — one tap into the app, one button. Zero parsing, and it pulls the user into the app. |
| Result entry over WhatsApp | The in-app form is ~40 lines and unambiguous. |
| Payment proof over WhatsApp media | Supabase Storage is already wired for avatars and logos; in-app upload saves nothing. |
| `ترتيب` / `هدافين` query bot | The public league page already answers this. Send the link. |
| MOTM poll (`send-poll`) | MOTM is post-MVP. Revisit at slice 6. |
| Invite-link delivery to non-users | First-contact drop (#830). The captain sends the `wa.me` link from their own WhatsApp. |
| Signup OTP | First-contact drop (#830). Auth stays phone + password. |

## The one inbound path — the #830 handshake

WhatsApp silently drops the **first** message to a number that has never messaged the league number (OpenWA issue #830 — the send API returns success, delivery does not happen). Not a ban, not fixable by SIM swap.

So every user opens a two-way contact once. Onboarding step after signup: show the league number and «أرسل كلمة "جاهز" إلى الرقم ده عشان تستقبل إشعارات مبارياتك». The `message.received` webhook does exactly one thing — set `profiles.wa_contact_opened_at`. It is not a reply parser.

Every send is gated on that column. A user who skipped the handshake gets an in-app banner, never a silently-dropped WhatsApp message.

## The whole build (~200 lines)

```
sendWhatsApp(profileId, templateKey, vars)   one function, gated on wa_contact_opened_at
5 templates                                   stored in OpenWA
1 cron job                                     tomorrow's matches
5 trigger points                               fixtures / result / round-done / payment-due / cron
1 webhook route                                sets wa_contact_opened_at, nothing else
```

## Volume

56 players × (1 reminder + 1 standings) per week ≈ 16 messages/day, spread with 3s jitter. Trivial for the API. Too much to send by hand — ~390 reminders a season — which is what earns the VM.

## Infra and cost

Not $0 on the stack we have. Free host that can run it: **Oracle Cloud Always Free** ARM VM (4 vCPU / 24 GB, free indefinitely, Docker). Needs an Oracle Cloud account. One `docker compose up` with the production compose file.

Ongoing: a dedicated SIM, kept replaceable. A restriction is unappealable through the tool (OpenWA's own risk register rates account ban ~50%). A replacement number needs ~1 week of warmup and a QR re-pair. Protocol breakage on a WhatsApp update (their R001, ~70%) needs an operator to `docker pull` a fixed image.

**Ban risk is about the sending number, not recipients' phones.** WhatsApp watches the league number's send patterns — burst rate, duplicate text, a fresh number reaching strangers. Recipient OS is irrelevant.

## Operating rules

- Engine `whatsapp-web.js`, not `baileys` — lower fingerprint, worth the RAM.
- `SEND_PACING_ENABLED=true` — age-based daily cap, cold-conversation cap, failure breaker. Off by default; turn it on.
- Warm the SIM ~1 week before the season (scan QR, chat real contacts, set a photo) before any automated send.
- If the number is restricted mid-season: reminders degrade, logins and standings do not. Swap the SIM, re-pair, re-warm.
