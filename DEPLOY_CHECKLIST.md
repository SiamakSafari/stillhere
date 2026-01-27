# Still Here - Deployment Checklist

## 🔑 Accounts Needed

### Required (Do These First!)
- [ ] **Apple Developer Account** - $99/year
  - https://developer.apple.com/programs/
  - Takes 24-48h to approve
  
- [ ] **Google Play Developer Account** - $25 one-time
  - https://play.google.com/console
  - Usually instant approval

### For Backend
- [ ] **SendGrid Account** (email alerts) - Free tier available
  - https://sendgrid.com/
  - Free: 100 emails/day
  
- [ ] **Twilio Account** (SMS alerts) - Optional, pay-as-you-go
  - https://twilio.com/
  - ~$0.01/SMS

### For Hosting
- [ ] **Vercel** (landing page) - Free tier
- [ ] **Railway** or **Render** (backend) - Free tier available
- [ ] **Domain** - stillhere.app (~$15/year)

---

## 🚀 Deployment Steps

### 1. Landing Page (Vercel)
```bash
cd stillhere-landing
npx vercel
```
Or connect GitHub repo to Vercel dashboard.

### 2. Backend (Railway recommended)
```bash
# In stillhere-repo/server
railway init
railway up
```

Set environment variables in Railway dashboard:
- `SENDGRID_API_KEY`
- `AUTH_ENABLED=true`
- `APP_URL=https://your-backend.railway.app`
- `FROM_EMAIL=alerts@stillhere.app`

### 3. Connect Domain
- Point `stillhere.app` to Vercel (landing)
- Point `api.stillhere.app` to Railway (backend)

### 4. Build Mobile Apps

**iOS:**
```bash
cd client
npm run build
npx cap sync ios
npx cap open ios
```
Then archive and upload in Xcode.

**Android:**
```bash
cd client
npm run build
npx cap sync android
npx cap open android
```
Build signed APK/AAB in Android Studio.

---

## 📱 App Store Submission

### iOS App Store
1. Screenshots (see SCREENSHOT_GUIDE.md)
2. App description (see STORE_LISTING.md)
3. Privacy policy URL
4. Support URL
5. 1024x1024 app icon

### Google Play Store
1. Screenshots (see SCREENSHOT_GUIDE.md)
2. Feature graphic (1024x500)
3. App description (see STORE_LISTING.md)
4. Privacy policy URL
5. 512x512 app icon

---

## ⚡ Quick Start (Minimum Viable Launch)

**Day 1:**
1. Sign up for Apple Developer + Google Play
2. Sign up for SendGrid (get API key)
3. Deploy landing page to Vercel

**Day 2-3:**
1. Deploy backend to Railway
2. Configure SendGrid
3. Test email alerts work

**Day 4-5:**
1. Build iOS app, submit to App Store
2. Build Android app, submit to Play Store

**Day 6+:**
1. Wait for app review (iOS: 1-3 days, Android: hours-days)
2. Launch marketing push
3. 🚀

---

## 🔒 Security Before Launch

- [ ] Set `AUTH_ENABLED=true` in production
- [ ] Use HTTPS everywhere
- [ ] Set secure CORS origins
- [ ] Review rate limiting config
- [ ] Test alert flow end-to-end

---

## 📊 Post-Launch Monitoring

- [ ] Set up Sentry (error tracking)
- [ ] Monitor SendGrid delivery rates
- [ ] Watch App Store reviews
- [ ] Track daily active users
