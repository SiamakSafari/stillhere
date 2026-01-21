# Still Here — Product Requirements Document

**Version:** 2.2  
**Last Updated:** January 19, 2026  
**Status:** Ready for Development

---

## Executive Summary

**Still Here** is a simple daily check-in app for people who live alone. One tap per day confirms you're okay. If you don't check in for 48 hours, your emergency contact is notified.

That's it. No complexity. No clutter. Just peace of mind.

### Why This Exists

- 36+ million Americans live alone
- China's "Are You Dead?" app went viral proving massive demand among young solo dwellers
- Existing North American apps (Snug, Circle Alert) are cluttered and clinical
- People want simple safety, not another app to manage

### Business Model

- **Free** with optional tip jar / one-time purchase ($2.99)
- No subscriptions, no premium tiers, no upsells

---

## Problem Statement

People who live alone have a simple fear: *"What if something happens to me and no one notices for days?"*

They don't need mood tracking. They don't need wellness insights. They don't need legacy messages.

They need someone to know if they disappear.

### Why Existing Solutions Overcomplicate This

| App | Problem |
|-----|---------|
| Snug | Multiple plans, dispatch services, too many features |
| Circle Alert | Cluttered UI, medical framing |
| Life Alert | Hardware, expensive, elderly stigma |

### What Users Actually Want

1. One button to tap
2. Someone notified if they go silent
3. Their pet cared for if something happens
4. That's it

---

## Target Users

### Primary: "Independent Emma"

- **Age:** 25-45
- **Situation:** Lives alone, works remotely, has a cat
- **Need:** Peace of mind without complexity
- **Quote:** *"I just want to know someone will check on me if I don't show up."*

### Secondary: "Worried Mom's Kid"

- **Age:** 22-35  
- **Situation:** Parents worry about them living alone in the city
- **Need:** Something to tell mom so she stops texting every day
- **Quote:** *"My mom asks if I'm alive every morning. This would actually help."*

---

## Product Vision

> One tap. One contact. Peace of mind.

### Core Principles

1. **Dead simple** — A child could use it
2. **One screen** — No tabs, no navigation, no hunting
3. **10 seconds** — Daily time commitment maximum
4. **Not morbid** — Life-affirming, not death-focused

---

## Features

### 1. Onboarding

Three steps. Under 60 seconds.

#### Step 1: Your Name
- Header: "What's your name?"
- Single text input
- Continue button

#### Step 2: Emergency Contact
- Header: "Emergency contact"
- Subtext: "Who should we notify if you go quiet?"
- Fields: Name, Email
- Continue button

#### Step 3: Pet (Optional)
- Header: "Any pets? 🐾"
- Subtext: "Optional — we'll include care info in alerts"
- Fields: Pet name, Care notes (if pet name entered)
- Skip or complete

#### Step 4: Location Permission (Optional)
- Header: "Share location in alerts?"
- Subtext: "Helps your contact find you in an emergency"
- Toggle: Enable / Skip
- Note: "Location is only captured when you check in — no constant tracking"
- Skip or enable

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ONB-1 | Name required | P0 |
| ONB-2 | Contact name and email required | P0 |
| ONB-3 | Pet info optional, can skip | P0 |
| ONB-4 | Complete onboarding in under 60 seconds | P0 |
| ONB-5 | Progress dots show current step | P1 |
| ONB-6 | Back button on steps 2-4 | P1 |
| ONB-7 | Location permission optional, can skip | P0 |
| ONB-8 | Location only captured at check-in time (not continuous) | P0 |

---

### 2. Main Screen

One screen. One button. Everything visible at once.

#### Layout (top to bottom)

1. **Settings icon** (top right) — Reset app
2. **Date & time** — Current day and clock
3. **Greeting** — "Good morning, Emma 👋"
4. **Check-in button** — Large green circle, center of screen
5. **Status text** — "Tap the button to check in" or "You're here. That matters."
6. **Stats** — Day streak + Protected shield + Location indicator (if enabled)
7. **Contact info** — Shows emergency contact name/email
8. **Pet info** — Shows pet name if added
9. **Footer** — "48 hours without check-in → your contact is notified"

#### Check-in Button States

**Not checked in today:**
- Bright green gradient
- Glowing shadow effect
- Text: "TAP / I'm here"
- Hover: Scale up slightly

**Checked in today:**
- Darker green
- Subtle glow
- Shows checkmark + "Done"
- Not clickable

#### Check-in Animation
- Ripple rings expand outward on tap
- Satisfying visual feedback

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| MAIN-1 | Single screen, no navigation | P0 |
| MAIN-2 | Check-in completes in one tap | P0 |
| MAIN-3 | Only one check-in per day allowed | P0 |
| MAIN-4 | Visual distinction between checked-in and not | P0 |
| MAIN-5 | Streak counter increments on check-in | P0 |
| MAIN-6 | Contact info visible on main screen | P0 |
| MAIN-7 | Ripple animation on check-in | P1 |
| MAIN-8 | Button scales on hover | P1 |
| MAIN-9 | Ambient glow behind button | P1 |
| MAIN-10 | Capture location at check-in time (if enabled) | P1 |
| MAIN-11 | Show location indicator icon if location enabled | P2 |

---

### 3. Alert System

Simple escalation. No complexity.

| Time Since Last Check-In | Action |
|--------------------------|--------|
| **24 hours** | Push notification reminder to user |
| **48 hours** | Email sent to emergency contact |

#### Emergency Alert Email

```
Subject: Still Here Alert: [User Name] hasn't checked in

Hi [Contact Name],

[User Name] added you as their emergency contact on Still Here.
They haven't checked in for 48 hours.

This could be nothing — but we wanted to make sure someone knows.

[IF LOCATION ENABLED]
📍 Last check-in location: [City, State]
[Google Maps Link]
[END IF]

[IF PET]
They have a pet that may need care:
🐾 [Pet Name]
Care notes: [Pet Notes]
[END IF]

— Still Here
```

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ALR-1 | Push notification at 24 hours | P0 |
| ALR-2 | Email to contact at 48 hours | P0 |
| ALR-3 | Pet info included in alert email | P0 |
| ALR-4 | Email delivery success rate >99% | P0 |
| ALR-5 | Include last check-in location in email (if enabled) | P1 |
| ALR-6 | Location displayed as city/state + map link (not exact address) | P1 |

---

### 4. Data & Settings

Minimal. Just a reset option.

#### Settings (via gear icon)
- Tap gear → Confirm dialog → Reset all data

#### Data Stored Locally
- User name
- Contact name
- Contact email
- Pet name (optional)
- Pet notes (optional)
- Location enabled (boolean)
- Last check-in timestamp
- Last check-in location (if enabled)
- Current streak

#### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SET-1 | Reset requires confirmation | P0 |
| SET-2 | All data stored locally | P0 |
| SET-3 | Data persists across app restarts | P0 |

---

## Design System

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Background Dark** | `#0a0a0a` | Top of gradient |
| **Background Mid** | `#1a1a2e` | Middle of gradient |
| **Background Light** | `#16213e` | Bottom of gradient |
| **Green Primary** | `#4ade80` | Button, accents, streak |
| **Green Dark** | `#22c55e` | Button gradient |
| **Green Darker** | `#16a34a` | Checked-in state |
| **Blue Accent** | `#60a5fa` | Shield icon |
| **White** | `#ffffff` | Text (various opacities) |

### Typography

| Element | Font | Size | Color |
|---------|------|------|-------|
| Greeting | Space Mono | 24px | White |
| Time | Space Mono | 28px | White 60% |
| Date | Space Mono | 12px | White 40% |
| Button text | Space Mono | 18px | Black |
| Stats number | Space Mono | 32px | Green |
| Stats label | Space Mono | 11px | White 40% |
| Footer | Space Mono | 11px | White 20% |

### Button

- Size: 200px × 200px
- Border radius: 50% (circle)
- Background: Linear gradient (green primary → green dark)
- Shadow: `0 0 80px rgba(74, 222, 128, 0.4)`
- Hover: `transform: scale(1.05)`

### Animations

- **Ripple on check-in:** Two concentric rings expand and fade
- **Ambient glow:** Subtle pulse behind button (optional)
- **Button hover:** Scale to 1.05 over 200ms

---

## Technical Spec

### Platform

- **Phase 1:** React web app (PWA)
- **Phase 2:** iOS (React Native or Swift)
- **Phase 3:** Android

### Data Storage

**Local (MVP):**
```javascript
localStorage.setItem('stillhere_v2', JSON.stringify({
  userName: "Emma",
  contactName: "Mom",
  contactEmail: "mom@email.com",
  petName: "Luna",
  petNotes: "Feed twice daily, vet is Dr. Smith",
  streak: 14,
  lastCheckIn: "2026-01-18T09:32:00Z"
}));
```

**Backend (Phase 2):**
- Simple database: Users table, CheckIns table
- Email service: SendGrid or AWS SES
- Push notifications: Firebase

### Data Model (Backend)

```
User
├── id (UUID)
├── name (string)
├── contact_name (string)
├── contact_email (string)
├── pet_name (string, nullable)
├── pet_notes (text, nullable)
├── location_enabled (boolean, default false)
├── last_location_lat (float, nullable)
├── last_location_lng (float, nullable)
├── last_location_city (string, nullable)
├── streak (integer)
├── last_check_in (timestamp)
└── created_at (timestamp)
```

---

## Success Metrics

### North Star

**Daily Check-in Rate:** % of users who check in each day

### Key Metrics

| Metric | Target |
|--------|--------|
| Day 1 retention | >70% |
| Day 7 retention | >50% |
| Day 30 retention | >30% |
| Check-in time | <5 seconds |
| Onboarding completion | >90% |
| False alarm rate | <5% |

### Activity Mode Metrics (Phase 2)

| Metric | Target |
|--------|--------|
| Activity Mode adoption | >30% of users try it |
| Activities completed safely | >95% |
| Activity false alarm rate | <3% |
| Most used activity types | Track for product insights |
| Average activities per user/month | Track for engagement |

---

## Competitive Analysis

### vs. Are You Dead? (Sileme/Demumu)

| Feature | Still Here | Are You Dead? |
|---------|------------|---------------|
| Check-in method | Tap green button | Tap green button |
| Check-in window | 48 hours | 48 hours |
| Alert method | Email | Email |
| Price | Free | $1.15 |
| Pet care info | ✅ | ❌ |
| Location in alerts | ✅ Optional | ✅ Yes |
| Streak tracking | ✅ | ❌ |
| Continuous tracking | ❌ No (privacy-first) | Unclear |
| Account required | ❌ | ❌ |
| Target market | North America | China |
| Branding | Life-affirming | Morbid/dark humor |

### vs. All Competitors

| Feature | Still Here | Snug | Are You Dead? | Life360 | bSafe |
|---------|------------|------|---------------|---------|-------|
| One-tap check-in | ✅ | ✅ | ✅ | ❌ | ❌ |
| Single screen UI | ✅ | ❌ | ✅ | ❌ | ❌ |
| Pet care info | ✅ | ❌ | ❌ | ✅ (GPS) | ❌ |
| Location in alerts | ✅ Optional | ✅ | ✅ | ✅ Always | ✅ |
| Activity Mode (timed) | ✅ Phase 2 | ❌ | ❌ | ❌ | ❌ |
| Free | ✅ | Freemium | $1.15 | Freemium | Freemium |
| No constant tracking | ✅ | ✅ | Unclear | ❌ | ❌ |
| Beautiful design | ✅ | ❌ | ⚠️ | ⚠️ | ❌ |
| No account required | ✅ | ❌ | ❌ | ❌ | ❌ |

### Our Advantages

1. **Privacy-first location** — Only captured at check-in, not continuous surveillance
2. **Pet protection** — Care instructions in alerts (unique vs. Are You Dead?)
3. **Streak gamification** — Encourages daily habit
4. **Positive branding** — "Still Here?" vs "Are You Dead?"
5. **Completely free** — No paywall, no subscriptions
6. **Best-in-class design** — Dark mode, green glow, satisfying animations
7. **Activity Mode (Phase 2)** — Timed check-ins for dates, runs, showings — no competitor does this well

---

## Roadmap

### Phase 1: MVP (Week 1-2)
- [x] Onboarding flow
- [x] Main check-in screen
- [x] Local data storage
- [x] Streak tracking
- [ ] Push notifications (24h reminder)
- [ ] Email alerts (48h)

### Phase 2: Native Apps + Activity Mode (Month 2-3)
- [ ] iOS app
- [ ] Android app
- [ ] Backend for notifications/alerts
- [ ] **Activity Mode** — timed check-ins for short-term situations (see below)

### Phase 3: Polish (Month 4)
- [ ] Widget for home screen
- [ ] Apple Watch complication
- [ ] Customizable check-in time
- [ ] Vacation mode

### Not Planned
- ~~Mood tracking~~
- ~~Multiple contacts~~
- ~~Legacy messages~~
- ~~Wellness insights~~
- ~~Premium subscriptions~~

---

## Activity Mode (Phase 2)

### Overview

Activity Mode provides **short-term, timed safety check-ins** for real-world situations — especially valuable for women.

Unlike the daily 48-hour check-in, Activity Mode lets users start a timer for specific activities. If they don't check back in when the timer ends, their emergency contact is alerted immediately.

### Target Use Cases

| Activity | Default Time | Who Uses This |
|----------|--------------|---------------|
| 🏃‍♀️ Going for a run | 1 hour | Runners, especially early AM/evening |
| 💜 Going on a date | 2 hours | Anyone meeting someone from a dating app |
| 🏠 House showing | 1 hour | Real estate agents, landlords |
| 🚗 Rideshare | 30 min | Uber/Lyft riders |
| 🚶‍♀️ Walking home | 30 min | Anyone walking alone at night |
| 🤝 Meeting a stranger | 1 hour | Craigslist/Marketplace meetups, interviews |
| 🌙 Night out | 3 hours | Going to bars/clubs alone |
| ✏️ Custom | Custom | Any situation |

### User Flow

#### Starting an Activity

```
┌─────────────────────────────────────┐
│                                     │
│  What are you doing?                │
│                                     │
│  [🏃‍♀️ Run    ] [💜 Date   ]         │
│  [🏠 Showing ] [🚗 Ride   ]         │
│  [🚶‍♀️ Walking] [🤝 Meeting]         │
│  [✏️ Custom                    ]    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Check back in:  [ 1 hour  ▼]       │
│                                     │
│  📍 Share my location: [✓]          │
│                                     │
│        [ Start Activity ]           │
│                                     │
└─────────────────────────────────────┘
```

#### During Activity (Timer Running)

```
┌─────────────────────────────────────┐
│                                     │
│  🏃‍♀️ On a run                       │
│                                     │
│         ┌──────────┐                │
│         │  47:23   │                │
│         │remaining │                │
│         └──────────┘                │
│                                     │
│  [ ✓ I'm Back Safe ]                │
│                                     │
│  [ + Add 30 min ]  [ End Early ]    │
│                                     │
│  ─────────────────────────────────  │
│  If timer ends, Sarah will be       │
│  notified with your last location   │
└─────────────────────────────────────┘
```

#### Completing Activity

- User taps "I'm Back Safe" → Timer cancelled, no alert
- Optional: Quick mood check ("How'd it go?" — Good / Fine / Not great)

#### Missed Check-In

If timer runs out:
1. **Grace period:** 5-minute warning with alarm sound + vibration
2. **Alert sent:** SMS/Email to emergency contact with activity type + location

### Activity Alert Message

```
Subject: Still Here Alert: [Name] hasn't checked back in

Hi [Contact Name],

[Name] started an activity on Still Here and hasn't checked back in.

Activity: 🏃‍♀️ Going for a run
Started: 6:00 PM
Expected back: 7:00 PM (45 minutes ago)

📍 Last location: Brooklyn, NY
[Google Maps Link]

This may be nothing — but [Name] wanted you to know just in case.

— Still Here
```

### Optional: Activity Details

For higher-risk activities, users can optionally add context:

| Activity | Optional Fields |
|----------|-----------------|
| 💜 Date | Person's name, where meeting, screenshot of profile |
| 🏠 House showing | Property address, client name/phone |
| 🚗 Rideshare | Share trip link, driver name, license plate |
| 🤝 Meeting stranger | Person's name, meeting location, reason |

This info is **only shared in the alert** if the user doesn't check back in.

### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ACT-1 | User can start timed activity from main screen | P0 |
| ACT-2 | Preset activity types with default durations | P0 |
| ACT-3 | Custom activity with custom duration | P0 |
| ACT-4 | Timer visible during activity | P0 |
| ACT-5 | "I'm Back Safe" cancels timer | P0 |
| ACT-6 | Alert sent to contact if timer expires | P0 |
| ACT-7 | 5-minute grace period with warning before alert | P0 |
| ACT-8 | Location captured at activity start (if enabled) | P1 |
| ACT-9 | "Add time" button to extend timer | P1 |
| ACT-10 | Optional activity details (date name, address, etc.) | P2 |
| ACT-11 | Activity history log | P2 |
| ACT-12 | Quick-start widget for common activities | P3 |

### Why This Matters

**Market gap:** No app does activity-based timed check-ins well.

| App | Problem |
|-----|---------|
| bSafe | Panic button focus, not timer-based |
| Noonlight | Have to hold button down, awkward |
| Life360 | Constant surveillance, not activity-specific |
| Kitestring | Text-based, shut down |

**Target demographic:** Women are 50%+ of solo dwellers and face unique safety concerns that daily check-in doesn't address.

**Viral potential:** Women actively share safety tips with each other. Activity Mode is highly shareable.

---

## Risks

| Risk | Mitigation |
|------|------------|
| User forgets to check in while traveling | Add "vacation mode" in Phase 3 |
| False alarms annoy contacts | Clear email explaining this may be nothing |
| Email goes to spam | Use proper email authentication (SPF, DKIM) |
| Location privacy concerns | Location is optional, only captured at check-in (not continuous), displayed as city-level (not exact address) |
| Users decline location permission | App works fully without it — location is a bonus, not required |

---

## Summary

Still Here is deliberately simple:

1. **Setup:** Name, contact, pet (optional), location (optional) — 60 seconds
2. **Daily:** Tap the big green button — 5 seconds
3. **Safety:** Contact emailed if 48 hours pass — includes last location + pet info
4. **Activity Mode (Phase 2):** Timed check-ins for runs, dates, house showings, and more

No accounts. No subscriptions. No constant tracking. No feature bloat.

Just peace of mind for people who live alone.

---

*"The scariest thing isn't loneliness – it's disappearing."*  
— User on Weibo about China's "Are You Dead?" app
