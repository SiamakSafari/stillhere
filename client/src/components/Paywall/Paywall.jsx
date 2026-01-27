import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { getOfferings, purchasePackage, restorePurchases } from '../../services/purchases';
import styles from './Paywall.module.css';

const FEATURES = [
  { icon: '🔔', text: 'Unlimited emergency contacts' },
  { icon: '💬', text: 'SMS & email alerts' },
  { icon: '👨‍👩‍👧', text: 'Family dashboard access' },
  { icon: '📊', text: 'Mood trends & insights' },
  { icon: '📸', text: 'Photo proof-of-life' },
  { icon: '⚡', text: 'Priority support' }
];

export const Paywall = ({ onSubscribed, onClose }) => {
  const [offerings, setOfferings] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);
    try {
      const result = await getOfferings();
      setOfferings(result?.current || null);
    } catch (err) {
      console.error('Failed to load offerings:', err);
      setError('Failed to load subscription options');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!offerings) return;

    setIsPurchasing(true);
    setError(null);

    try {
      const pkg = selectedPlan === 'annual' ? offerings.annual : offerings.monthly;
      const result = await purchasePackage(pkg);

      if (result.success) {
        onSubscribed?.();
      } else if (result.cancelled) {
        // User cancelled, do nothing
      } else {
        setError(result.error || 'Purchase failed. Please try again.');
      }
    } catch (err) {
      setError('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);

    try {
      const result = await restorePurchases();
      
      if (result.success && result.isSubscribed) {
        onSubscribed?.();
      } else {
        setError('No previous subscription found.');
      }
    } catch (err) {
      setError('Failed to restore purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  const monthlyPrice = offerings?.monthly?.product?.priceString || '$4.99';
  const annualPrice = offerings?.annual?.product?.priceString || '$39.99';
  const annualMonthly = offerings?.annual?.product?.price 
    ? `$${(offerings.annual.product.price / 12).toFixed(2)}`
    : '$3.33';

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.appIcon}>✓</div>
          <h1 className={styles.title}>Still Here</h1>
          <p className={styles.subtitle}>Peace of mind for people living alone</p>
        </div>

        {/* Features */}
        <div className={styles.features}>
          {FEATURES.map((feature, index) => (
            <div key={index} className={styles.feature}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <span className={styles.featureText}>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Plan Selection */}
        {!isLoading && offerings && (
          <div className={styles.plans}>
            <button
              className={`${styles.planCard} ${selectedPlan === 'annual' ? styles.selected : ''}`}
              onClick={() => setSelectedPlan('annual')}
            >
              <div className={styles.planBadge}>BEST VALUE</div>
              <div className={styles.planName}>Annual</div>
              <div className={styles.planPrice}>{annualPrice}<span>/year</span></div>
              <div className={styles.planSavings}>{annualMonthly}/mo · Save 33%</div>
            </button>

            <button
              className={`${styles.planCard} ${selectedPlan === 'monthly' ? styles.selected : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className={styles.planName}>Monthly</div>
              <div className={styles.planPrice}>{monthlyPrice}<span>/month</span></div>
              <div className={styles.planSavings}>Cancel anytime</div>
            </button>
          </div>
        )}

        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Loading plans...</span>
          </div>
        )}

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {/* CTA */}
        <div className={styles.cta}>
          <Button
            onClick={handlePurchase}
            loading={isPurchasing}
            disabled={isLoading || !offerings}
            fullWidth
            size="large"
          >
            {isPurchasing ? 'Processing...' : `Subscribe ${selectedPlan === 'annual' ? 'Yearly' : 'Monthly'}`}
          </Button>

          <button
            className={styles.restoreButton}
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Restore Purchase'}
          </button>
        </div>

        {/* Legal */}
        <div className={styles.legal}>
          <p>
            Payment will be charged to your App Store account. Subscription automatically 
            renews unless canceled at least 24 hours before the end of the current period.
          </p>
          <div className={styles.legalLinks}>
            <a href="/privacy.html" target="_blank">Privacy Policy</a>
            <span>·</span>
            <a href="/terms.html" target="_blank">Terms of Use</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
