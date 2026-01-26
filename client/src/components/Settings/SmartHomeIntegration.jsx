import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import styles from './SmartHomeIntegration.module.css';

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

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const SmartHomeIntegration = ({ data }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newApiKey, setNewApiKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (data.userId) {
      loadApiKeys();
    }
  }, [data.userId]);

  const loadApiKeys = async () => {
    if (!data.userId) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await api.getApiKeys(data.userId);
      setApiKeys(result);
    } catch (err) {
      console.error('Failed to load API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!data.userId) return;

    try {
      setIsCreating(true);
      setError(null);

      const key = await api.createApiKey(data.userId, newLabel || null);

      // Store the full API key temporarily for display
      setNewApiKey(key.apiKey);

      // Add to list (with preview only)
      setApiKeys([{
        id: key.id,
        keyPreview: key.apiKey.substring(0, 8) + '...',
        label: key.label,
        isActive: true,
        createdAt: key.createdAt,
        lastUsedAt: null
      }, ...apiKeys]);

      setShowCreateForm(false);
      setNewLabel('');

      // Auto-copy the new key
      await copyToClipboard(key.apiKey);
      setCopiedId('new');
      setTimeout(() => setCopiedId(null), 2000);

    } catch (err) {
      console.error('Failed to create API key:', err);
      setError(err.message || 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (keyId) => {
    if (!data.userId) return;

    try {
      setDeletingId(keyId);
      await api.revokeApiKey(data.userId, keyId);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (err) {
      console.error('Failed to revoke API key:', err);
      setError('Failed to revoke API key');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyKey = async () => {
    if (newApiKey) {
      const success = await copyToClipboard(newApiKey);
      if (success) {
        setCopiedId('new');
        setTimeout(() => setCopiedId(null), 2000);
      }
    }
  };

  const dismissNewKey = () => {
    setNewApiKey(null);
  };

  if (isLoading && apiKeys.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Smart Home Integration
        </h3>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading API keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Smart Home Integration
      </h3>
      <p className={styles.sectionDescription}>
        Generate API keys to check in from IFTTT, Home Assistant, Zapier, or other automation tools.
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

      {/* New API key display */}
      {newApiKey && (
        <div className={styles.newKeyBanner}>
          <div className={styles.newKeyHeader}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <strong>Save this API key now!</strong>
          </div>
          <p className={styles.newKeyWarning}>
            This is the only time you'll see this key. Copy it and store it securely.
          </p>
          <div className={styles.newKeyValue}>
            <code>{newApiKey}</code>
            <button
              className={`${styles.copyButton} ${copiedId === 'new' ? styles.copied : ''}`}
              onClick={handleCopyKey}
            >
              {copiedId === 'new' ? (
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
          </div>
          <Button variant="ghost" onClick={dismissNewKey} fullWidth>
            I've saved my key
          </Button>
        </div>
      )}

      {/* Existing keys */}
      {apiKeys.length > 0 && (
        <div className={styles.keyList}>
          {apiKeys.map(key => (
            <div key={key.id} className={styles.keyItem}>
              <div className={styles.keyInfo}>
                <span className={styles.keyLabel}>
                  {key.label || 'API Key'}
                </span>
                <span className={styles.keyPreview}>
                  <code>{key.keyPreview}</code>
                </span>
                <span className={styles.keyMeta}>
                  Created {formatDate(key.createdAt)}
                  {key.lastUsedAt && (
                    <> &middot; Last used {formatDate(key.lastUsedAt)}</>
                  )}
                </span>
              </div>
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => handleDelete(key.id)}
                disabled={deletingId === key.id}
                title="Revoke key"
              >
                {deletingId === key.id ? (
                  <div className={styles.smallSpinner} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                )}
              </button>
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
              placeholder="e.g., Home Assistant"
              className={styles.input}
              maxLength={50}
            />
          </div>
          <div className={styles.formActions}>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateForm(false);
                setNewLabel('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={isCreating}
            >
              Generate Key
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
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          Generate API Key
        </Button>
      )}

      {/* Usage examples */}
      <div className={styles.usageExamples}>
        <h4 className={styles.examplesTitle}>Usage Examples</h4>

        <div className={styles.example}>
          <span className={styles.exampleLabel}>IFTTT / Zapier (Webhook)</span>
          <code className={styles.exampleCode}>
            POST https://yourapp.com/api/checkin/external
            <br />
            Authorization: Bearer YOUR_API_KEY
            <br />
            {'{"source": "ifttt"}'}
          </code>
        </div>

        <div className={styles.example}>
          <span className={styles.exampleLabel}>cURL</span>
          <code className={styles.exampleCode}>
            curl -X POST https://yourapp.com/api/checkin/external \
            <br />
            &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY"
          </code>
        </div>
      </div>

      <div className={styles.privacyNote}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>
          API keys are rate limited to 1 check-in per hour. Revoked keys are immediately invalidated.
        </span>
      </div>
    </div>
  );
};

export default SmartHomeIntegration;
