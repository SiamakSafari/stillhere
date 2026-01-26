<p align="center">
  <img src="https://img.shields.io/badge/status-shipping-brightgreen?style=for-the-badge" alt="Status: Shipping" />
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">Still Here</h1>

<p align="center">
  <strong>One tap a day. Peace of mind for people who live alone.</strong>
</p>

<p align="center">
  <em>36 million Americans live alone. Most share the same quiet fear:<br/>"What if something happens and no one notices for days?"</em>
</p>

---

## The Problem

People who live alone don't need another wellness app. They don't need mood tracking, journaling, or AI insights.

They need **one thing**: someone to know if they go silent.

## The Solution

**Still Here** is dead simple:

1. ✅ **One tap per day** — Confirm you're okay
2. ⏰ **48 hours of silence** — Your emergency contact is notified
3. 🐾 **Pet info included** — So they know who needs care

That's it. No complexity. No clutter. Just peace of mind.

---

## Features

| Feature | Description |
|---------|-------------|
| **One-Tap Check-In** | 10 seconds. That's all it takes. |
| **Smart Alerts** | 24h reminder → 48h emergency contact notification |
| **Vacation Mode** | Going off-grid? Pause alerts with one tap |
| **Pet Safety** | Include pet info so they're cared for too |
| **Activity Mode** | Going hiking? Set a timed check-in |
| **Family Dashboard** | Let loved ones see you're okay (optional) |
| **Offline-First** | Works without internet. Syncs when connected. |

---

## Tech Stack

**Client:**
- React 18 + Vite
- Capacitor (iOS/Android)
- Lottie animations
- PWA-ready

**Server:**
- Node.js + Express
- SQLite (sql.js)
- SendGrid (email)
- Twilio (SMS)
- Web Push notifications

---

## Quick Start

```bash
# Install dependencies
npm run install-all

# Start development (client + server)
npm run dev

# Build for production
npm run build
```

**Environment Variables:**
```bash
# Server (.env)
SENDGRID_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

See `server/.env.example` for full configuration.

---

## Why This Exists

| Competitor | Problem |
|------------|---------|
| Snug | Too many features, dispatch services, confusing |
| Circle Alert | Clinical UI, feels like medical equipment |
| Life Alert | Hardware, expensive, "elderly" stigma |

**Still Here** is different: One button. One contact. One purpose.

---

## Roadmap

- [x] Core check-in flow
- [x] Email/SMS alerts
- [x] Vacation mode
- [x] Activity mode (timed check-ins)
- [x] Family dashboard
- [ ] iOS App Store launch
- [ ] Android Play Store launch
- [ ] Apple Watch complications
- [ ] Widgets (iOS/Android)

---

## Contributing

This is a solo project being built in public. Follow the journey:

- **Twitter/X:** [@21ada_](https://x.com/21ada_)
- **Progress:** Watch this repo for updates

---

## License

MIT — Use it, fork it, make it better.

---

<p align="center">
  <strong>Built with ❤️ for the 36 million who live alone</strong>
</p>
