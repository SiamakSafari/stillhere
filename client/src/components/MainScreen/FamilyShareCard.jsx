import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import styles from './MainScreen.module.css';

// Copy to clipboard helper
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

export const FamilyShareCard = ({ userId }) => {
  const [shares, setShares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      loadShares();
    }
  }, [userId]);

  const loadShares = async () => {
    try {
      setIsLoading(true);
      const result = await api.getFamilyShares(userId);
      setShares(result);
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!userId || isCreating) return;

    try {
      setIsCreating(true);
      const share = await api.createFamilyShare(userId);
      setShares([share, ...shares]);

      // Auto-copy the new link
      const url = `${window.location.origin}/family/${share.shareToken}`;
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to create share:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (shares.length === 0) return;
    const url = `${window.location.origin}/family/${shares[0].shareToken}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasShare = shares.length > 0;

  return (
    <div className={styles.infoCard}>
      <div className={styles.infoHeader}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Family Dashboard</span>
      </div>

      <div className={styles.familyShareContent}>
        {isLoading ? (
          <span className={styles.familyShareMuted}>Loading...</span>
        ) : hasShare ? (
          <button
            className={`${styles.familyShareButton} ${copied ? styles.familyShareButtonCopied : ''}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Link Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Share Link
              </>
            )}
          </button>
        ) : (
          <button
            className={styles.familyShareButton}
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              'Creating...'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Create Share Link
              </>
            )}
          </button>
        )}
        <span className={styles.familyShareHint}>
          Let family check on your status
        </span>
      </div>
    </div>
  );
};
