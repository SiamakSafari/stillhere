import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import styles from './ShareLinkManager.module.css';

// Format relative time for created/expiry dates
const formatRelativeTime = (dateString) => {
  if (!dateString) return null;

  // Handle SQLite datetime format (YYYY-MM-DD HH:MM:SS) by converting to ISO
  const normalizedDate = dateString.includes('T')
    ? dateString
    : dateString.replace(' ', 'T') + 'Z';

  const date = new Date(normalizedDate);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 0) return 'Just now'; // Handle timezone edge cases
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Format expiration date
const formatExpiry = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();

  if (date < now) return 'Expired';

  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Copy to clipboard with fallback
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
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

export const ShareLinkManager = ({ data }) => {
  const [shares, setShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Load shares on mount
  useEffect(() => {
    if (data.userId) {
      loadShares();
    }
  }, [data.userId]);

  const loadShares = async () => {
    if (!data.userId) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await api.getFamilyShares(data.userId);
      setShares(result);
    } catch (err) {
      console.error('Failed to load shares:', err);
      setError('Failed to load share links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!data.userId) return;

    try {
      setIsCreating(true);
      setError(null);

      const expiresAt = newExpiry ? new Date(newExpiry).toISOString() : null;
      const share = await api.createFamilyShare(data.userId, newLabel || null, expiresAt);

      setShares([share, ...shares]);
      setShowCreateForm(false);
      setNewLabel('');
      setNewExpiry('');

      // Auto-copy the new link
      const url = getShareUrl(share.shareToken);
      await copyToClipboard(url);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to create share:', err);
      setError('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (shareId) => {
    if (!data.userId) return;

    try {
      setDeletingId(shareId);
      await api.deleteFamilyShare(data.userId, shareId);
      setShares(shares.filter(s => s.id !== shareId));
    } catch (err) {
      console.error('Failed to delete share:', err);
      setError('Failed to revoke share link');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (token, shareId) => {
    const url = getShareUrl(token);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getShareUrl = (token) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/family/${token}`;
  };

  // Get minimum date for expiry (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (isLoading && shares.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Family Dashboard
        </h3>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading share links...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Family Dashboard
      </h3>
      <p className={styles.sectionDescription}>
        Share a read-only dashboard with family or emergency contacts so they can check on you.
      </p>

      {error && (
        <div className={styles.errorMessage}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {/* Existing shares */}
      {shares.length > 0 && (
        <div className={styles.shareList}>
          {shares.map(share => (
            <div key={share.id} className={styles.shareItem}>
              <div className={styles.shareInfo}>
                <span className={styles.shareLabel}>
                  {share.label || 'Family Dashboard Link'}
                </span>
                <span className={styles.shareMeta}>
                  Created {formatRelativeTime(share.createdAt)}
                  {share.expiresAt && (
                    <> &middot; Expires {formatExpiry(share.expiresAt)}</>
                  )}
                </span>
              </div>
              <div className={styles.shareActions}>
                <button
                  className={`${styles.actionButton} ${copiedId === share.id ? styles.copied : ''}`}
                  onClick={() => handleCopy(share.shareToken, share.id)}
                  title="Copy link"
                >
                  {copiedId === share.id ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDelete(share.id)}
                  disabled={deletingId === share.id}
                  title="Revoke link"
                >
                  {deletingId === share.id ? (
                    <div className={styles.smallSpinner} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreateForm ? (
        <div className={styles.createForm}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Label (optional)</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., Mom's link"
              className={styles.input}
              maxLength={50}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Expires (optional)</label>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              min={minDate}
              className={styles.input}
            />
          </div>
          <div className={styles.formActions}>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateForm(false);
                setNewLabel('');
                setNewExpiry('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={isCreating}
            >
              Create Link
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={() => setShowCreateForm(true)}
          fullWidth
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Create Share Link
        </Button>
      )}

      <div className={styles.privacyNote}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>
          Shared dashboards only show your name, check-in status, streak, and vacation status.
          Mood, notes, and location are never shared.
        </span>
      </div>
    </div>
  );
};

export default ShareLinkManager;
