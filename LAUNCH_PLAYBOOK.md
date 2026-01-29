# Still Here — Launch Playbook 🚀

**Goal:** Get Still Here live on iOS + Android as fast as possible once developer accounts are approved.

---

## Pre-Launch Checklist (Do Now — While Waiting)

### ✅ Assets You Need

| Asset | Status | Notes |
|-------|--------|-------|
| App Icon (1024x1024) | ⬜ Check | PNG, no transparency, no rounded corners |
| iPhone Screenshots (5) | ⬜ Create | 1290x2796 (6.7") or 1242x2688 (6.5") |
| iPad Screenshots (5) | ⬜ Optional | 2048x2732 — can skip for initial launch |
| Android Screenshots (5) | ⬜ Create | 1080x1920 minimum |
| Feature Graphic (Android) | ⬜ Create | 1024x500 |

### ✅ Copy (Already Done!)
- [x] App Name: Still Here
- [x] Subtitle: Daily safety check-in
- [x] Short Description (80 char)
- [x] Full Description (4000 char)
- [x] Keywords

### ✅ Legal Pages
| Page | URL | Status |
|------|-----|--------|
| Privacy Policy | stillhere.app/privacy | ⬜ Create |
| Terms of Service | stillhere.app/terms | ⬜ Optional for v1 |
| Support Page | stillhere.app/support | ⬜ Create simple FAQ |

### ✅ Technical Checklist
- [ ] Build compiles without errors (iOS)
- [ ] Build compiles without errors (Android)
- [ ] Test on real device (iOS)
- [ ] Test on real device (Android)
- [ ] Push notifications working
- [ ] Email alerts working (SendGrid configured)
- [ ] SMS alerts working (Twilio configured — optional for v1)

---

## Step-by-Step: iOS App Store Submission

### Step 1: Apple Developer Account Approved
Once approved, you'll get access to App Store Connect.

### Step 2: Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Still Here
   - Primary Language: English (U.S.)
   - Bundle ID: Select from dropdown (must match Xcode)
   - SKU: `stillhere-ios-001`

### Step 3: App Information
- **Category:** Health & Fitness
- **Secondary Category:** Lifestyle
- **Content Rights:** "Does not contain third-party content"
- **Age Rating:** Complete questionnaire (all "No" = 4+)

### Step 4: App Privacy
Answer the privacy questions:
- **Data Collection:** Yes
- **Data Types:** Contact Info (name, email for emergency contact)
- **Usage:** App Functionality
- **Linked to User:** No
- **Tracking:** No

### Step 5: Pricing
- **Price:** Free
- **In-App Purchases:** Optional tip jar (can add later)

### Step 6: Upload Build from Xcode
```bash
# In stillhere/client directory
cd /home/clawdbot2/clawd/stillhere/client

# Build for iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select "Any iOS Device" as target
2. Product → Archive
3. Distribute App → App Store Connect → Upload
4. Wait 10-30 minutes for processing

### Step 7: Complete Submission
1. Select the uploaded build in App Store Connect
2. Add screenshots (drag and drop)
3. Fill in "What's New" (first version: "Initial release")
4. Add Review Notes:
```
This app does not require an account to test.
On first launch, enter any name and email during onboarding.
The check-in functionality works immediately.

To test notifications without waiting 48 hours:
Use "Send Test Email" in Settings.
```
5. Click "Submit for Review"

### Step 8: Wait for Review
- **Typical time:** 24-48 hours
- **If rejected:** They'll tell you why. Fix and resubmit.

---

## Step-by-Step: Google Play Store Submission

### Step 1: Google Play Console Access
Once $25 payment clears, you'll have access.

### Step 2: Create App
1. Go to [play.google.com/console](https://play.google.com/console)
2. "Create app"
3. Fill in:
   - App name: Still Here
   - Default language: English (US)
   - App/Game: App
   - Free/Paid: Free
4. Accept policies

### Step 3: Store Listing
1. Go to "Main store listing"
2. Add:
   - Short description (80 char)
   - Full description
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Phone screenshots (2-8)

### Step 4: Content Rating
1. Go to "Content rating"
2. Start questionnaire
3. Answer honestly (mostly "No" for this app)
4. Get rating (likely "Everyone")

### Step 5: Target Audience
- Target age: 18 and over (safety app, adults)
- Not designed for children

### Step 6: App Content
- Ads: No
- Access: Not restricted

### Step 7: Upload APK/AAB
```bash
# In stillhere/client directory
cd /home/clawdbot2/clawd/stillhere/client

# Build for Android
npx cap sync android

# Generate release bundle
cd android
./gradlew bundleRelease
```

Upload the `.aab` file from:
`android/app/build/outputs/bundle/release/app-release.aab`

### Step 8: Review & Publish
1. Go through all policy checklists
2. Click "Submit for review"

### Step 9: Wait
- **Typical time:** 1-3 days (sometimes hours)
- **Longer for new accounts:** First app review can take up to 7 days

---

## Launch Day Checklist

### Before Going Live
- [ ] Test download on real device
- [ ] Verify deep links work
- [ ] Check notifications arrive
- [ ] Confirm email alerts send

### Announcement Posts

**Twitter/X Thread:**
```
🚀 Just launched Still Here

36 million Americans live alone. Most share the same quiet fear:
"What if something happens and no one notices for days?"

Still Here fixes that. One tap per day. That's it.

🧵 Thread:
```

```
1/ How it works:

✅ One tap daily confirms you're okay
⏰ Miss 48 hours? Your emergency contact gets notified
🐾 Pet info included so they know who needs care

No accounts. No subscriptions. No complexity.
```

```
2/ Why I built this:

[Personal story or motivation — makes it human]

Built it for myself first. Now it's free for everyone.
```

```
3/ Download:

📱 iOS: [link]
🤖 Android: [link]
🌐 Web: stillhere.app

If you live alone, or know someone who does — this is for you.
```

**Product Hunt (Optional — Day 2 or 3):**
- Submit at producthunt.com/posts/new
- Best time: 12:01 AM Pacific (Tuesday-Thursday)
- Ask friends to upvote early

**Reddit (Be Careful):**
- r/solotravel, r/livingalone, r/introvert
- Don't spam. Share genuinely. Answer questions.
- "I built this because..." approach works

---

## Post-Launch Tracking

### Metrics to Watch
| Metric | Where | Goal Week 1 |
|--------|-------|-------------|
| Downloads | App Store Connect / Play Console | 100+ |
| DAU | Analytics | 30%+ of downloads |
| Retention D1 | Analytics | 40%+ |
| Retention D7 | Analytics | 20%+ |
| Reviews | Stores | 5+ (ask happy users) |

### How to Get Reviews
- Add in-app prompt after 3rd check-in
- "Enjoying Still Here? A review helps others find us"
- Only prompt happy users (after successful check-in, not after error)

---

## If Rejected

### Common Reasons & Fixes

**Apple:**
| Reason | Fix |
|--------|-----|
| Crashes on launch | Test on real device, fix crash |
| Missing privacy policy | Add URL in App Store Connect |
| Metadata issues | Fix description/screenshots |
| Guideline 4.2 (minimum functionality) | Explain value in review notes |

**Google:**
| Reason | Fix |
|--------|-----|
| Policy violation | Read specific policy, fix |
| Missing privacy policy | Add to store listing |
| Restricted permissions | Justify why you need them |

---

## Timeline Estimate

| Phase | Duration |
|-------|----------|
| Developer account approval | 1-3 days |
| Build & upload | 1-2 hours |
| App Store review (Apple) | 1-2 days |
| Play Store review (Google) | 1-7 days |
| **Total to live:** | **3-7 days** |

---

## What I'll Do For You

While you handle the app store submissions, I can:
- ✅ Create screenshot mockups (tell me what screens exist)
- ✅ Generate feature graphic for Android
- ✅ Write privacy policy page
- ✅ Draft Product Hunt listing
- ✅ Write more launch tweets
- ✅ Research relevant subreddits
- ✅ Set up simple landing page if needed

---

**Next step:** Let me know when accounts are approved, and we'll submit same day. 🎯
