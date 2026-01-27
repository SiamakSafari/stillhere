import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

// RevenueCat API keys - replace with your actual keys from RevenueCat dashboard
const REVENUECAT_IOS_KEY = 'your_ios_api_key';
const REVENUECAT_ANDROID_KEY = 'your_android_api_key';

// Product identifiers - must match what you create in App Store Connect / Google Play
export const PRODUCT_IDS = {
  MONTHLY: 'stillhere_monthly_499',
  ANNUAL: 'stillhere_annual_3999'
};

// Entitlement identifier - the "access" users get when subscribed
export const ENTITLEMENT_ID = 'premium';

let isConfigured = false;

/**
 * Initialize RevenueCat SDK
 * Call this once when app starts
 */
export const initializePurchases = async (userId = null) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Purchases] Running in browser, skipping RevenueCat init');
    return false;
  }

  try {
    // Set log level for debugging (change to LOG_LEVEL.ERROR for production)
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

    const apiKey = Capacitor.getPlatform() === 'ios' 
      ? REVENUECAT_IOS_KEY 
      : REVENUECAT_ANDROID_KEY;

    // Configure RevenueCat
    await Purchases.configure({
      apiKey,
      appUserID: userId || null // null = anonymous, RevenueCat generates ID
    });

    isConfigured = true;
    console.log('[Purchases] RevenueCat configured successfully');
    return true;
  } catch (error) {
    console.error('[Purchases] Failed to configure RevenueCat:', error);
    return false;
  }
};

/**
 * Check if user has active subscription
 */
export const checkSubscriptionStatus = async () => {
  if (!Capacitor.isNativePlatform()) {
    // In browser/dev, return mock "subscribed" for testing
    console.log('[Purchases] Browser mode - returning mock subscription');
    return { isSubscribed: true, isPremium: true };
  }

  if (!isConfigured) {
    await initializePurchases();
  }

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    return {
      isSubscribed: !!entitlement,
      isPremium: !!entitlement,
      expirationDate: entitlement?.expirationDate || null,
      willRenew: entitlement?.willRenew || false,
      productId: entitlement?.productIdentifier || null
    };
  } catch (error) {
    console.error('[Purchases] Failed to check subscription:', error);
    return { isSubscribed: false, isPremium: false };
  }
};

/**
 * Get available packages/products for purchase
 */
export const getOfferings = async () => {
  if (!Capacitor.isNativePlatform()) {
    // Return mock offerings for browser testing
    return {
      current: {
        monthly: {
          identifier: PRODUCT_IDS.MONTHLY,
          product: {
            price: 4.99,
            priceString: '$4.99',
            title: 'Monthly',
            description: 'Billed monthly'
          }
        },
        annual: {
          identifier: PRODUCT_IDS.ANNUAL,
          product: {
            price: 39.99,
            priceString: '$39.99',
            title: 'Annual',
            description: 'Billed yearly - Save 33%'
          }
        }
      }
    };
  }

  if (!isConfigured) {
    await initializePurchases();
  }

  try {
    const { offerings } = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('[Purchases] Failed to get offerings:', error);
    return null;
  }
};

/**
 * Purchase a package
 * @param {Object} pkg - The package to purchase from getOfferings()
 */
export const purchasePackage = async (pkg) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Purchases] Browser mode - simulating purchase');
    return { success: true, customerInfo: { entitlements: { active: { [ENTITLEMENT_ID]: true } } } };
  }

  if (!isConfigured) {
    await initializePurchases();
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const isNowSubscribed = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    return {
      success: isNowSubscribed,
      customerInfo
    };
  } catch (error) {
    // User cancelled or error
    if (error.code === 'PURCHASE_CANCELLED') {
      return { success: false, cancelled: true };
    }
    console.error('[Purchases] Purchase failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore previous purchases (for users who reinstall)
 */
export const restorePurchases = async () => {
  if (!Capacitor.isNativePlatform()) {
    return { success: true, isSubscribed: true };
  }

  if (!isConfigured) {
    await initializePurchases();
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const isSubscribed = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    return {
      success: true,
      isSubscribed,
      customerInfo
    };
  } catch (error) {
    console.error('[Purchases] Restore failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set user ID for RevenueCat (call after user signs up/logs in)
 */
export const setUserId = async (userId) => {
  if (!Capacitor.isNativePlatform() || !isConfigured) return;

  try {
    await Purchases.logIn({ appUserID: userId });
    console.log('[Purchases] User ID set:', userId);
  } catch (error) {
    console.error('[Purchases] Failed to set user ID:', error);
  }
};

export default {
  initializePurchases,
  checkSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  setUserId,
  PRODUCT_IDS,
  ENTITLEMENT_ID
};
