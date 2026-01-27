# Subscription Setup Guide

## Overview
Still Here uses RevenueCat for subscription management. This handles both iOS (App Store) and Android (Google Play) subscriptions with a single integration.

## Step 1: Create RevenueCat Account
1. Go to [revenuecat.com](https://www.revenuecat.com) and sign up
2. Create a new project called "Still Here"

## Step 2: Create Products in App Stores

### App Store Connect (iOS)
1. Go to App Store Connect → Your App → Subscriptions
2. Create a Subscription Group called "Still Here Premium"
3. Add two subscriptions:
   - **Product ID:** `stillhere_monthly_499`
   - **Price:** $4.99/month
   - **Display Name:** Monthly
   
   - **Product ID:** `stillhere_annual_3999`
   - **Price:** $39.99/year
   - **Display Name:** Annual (Best Value)

4. Fill in subscription descriptions and localization

### Google Play Console (Android)
1. Go to Google Play Console → Your App → Monetization → Products → Subscriptions
2. Create two subscriptions:
   - **Product ID:** `stillhere_monthly_499`
   - **Base plan:** $4.99/month
   
   - **Product ID:** `stillhere_annual_3999`  
   - **Base plan:** $39.99/year

## Step 3: Connect Stores to RevenueCat

### iOS
1. In RevenueCat, go to Project Settings → Apps → Add App
2. Select "App Store"
3. Add your App Bundle ID: `app.stillhere.ios`
4. Generate and upload App Store Connect API Key (for server-side receipt validation)

### Android
1. In RevenueCat, add another app for "Google Play"
2. Enter your package name: `app.stillhere.android`
3. Upload your Google Play service account JSON key

## Step 4: Create Products & Entitlements in RevenueCat

1. Go to Products and add your two subscription products
2. Create an Entitlement called `premium`
3. Attach both products to the `premium` entitlement

## Step 5: Create an Offering

1. Go to Offerings → Create New
2. Name it "default"
3. Add packages:
   - **$rc_monthly** → stillhere_monthly_499
   - **$rc_annual** → stillhere_annual_3999

## Step 6: Get API Keys

1. Go to Project Settings → API Keys
2. Copy the **Public App-Specific Keys**:
   - iOS public key (starts with `appl_`)
   - Android public key (starts with `goog_`)

## Step 7: Configure the App

Create a `.env` file in the `client/` folder:

```bash
cp client/.env.example client/.env
```

Then edit `client/.env`:
```
VITE_REVENUECAT_IOS_KEY=appl_your_actual_ios_key
VITE_REVENUECAT_ANDROID_KEY=goog_your_actual_android_key
```

## Step 8: Test Subscriptions

### Sandbox Testing (iOS)
1. Create a sandbox tester in App Store Connect
2. Sign out of App Store on device
3. The app will prompt for sandbox login during purchase

### Testing (Android)
1. Add your Google account as a license tester in Google Play Console
2. Upload the app to internal testing track
3. Test purchases will be free/refundable

## Pricing Summary
- **Monthly:** $4.99/month
- **Annual:** $39.99/year (save 33%)
- Converts to ~$3.33/month

## Revenue Split
- Apple/Google take 15-30% depending on Small Business Program enrollment
- RevenueCat is free up to $2,500/month MTR

## Questions?
- RevenueCat Docs: https://docs.revenuecat.com
- Support: support@revenuecat.com
