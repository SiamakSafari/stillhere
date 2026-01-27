import { useState } from 'react';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import styles from './EmergencyContacts.module.css';

const ALERT_OPTIONS = [
  { value: 'email', label: 'Email only' },
  { value: 'sms', label: 'SMS only' },
  { value: 'both', label: 'Email & SMS' }
];

export const ContactCard = ({ contact, index, onUpdate, onDelete, userId, onTestResult, onVerificationSent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [editData, setEditData] = useState({
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    alertPreference: contact.alertPreference || 'email'
  });

  const handleSave = async () => {
    if (!editData.name.trim()) return;

    setIsSaving(true);
    await onUpdate(editData);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      alertPreference: contact.alertPreference || 'email'
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
  };

  const handleTestAlert = async () => {
    if (!userId) return;
    
    setIsTesting(true);
    try {
      await api.testAlert(userId, contact.id);
      onTestResult?.({ success: true, contactName: contact.name });
    } catch (error) {
      console.error('Failed to send test alert:', error);
      onTestResult?.({ success: false, error: error.message, contactName: contact.name });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendVerification = async () => {
    if (!userId || !contact.email) return;
    
    setIsSendingVerification(true);
    try {
      await api.sendVerificationEmail(userId, contact.id);
      onVerificationSent?.({ success: true, contactName: contact.name });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      onVerificationSent?.({ success: false, error: error.message, contactName: contact.name });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const alertLabel = ALERT_OPTIONS.find(o => o.value === contact.alertPreference)?.label || 'Email only';
  const needsEmailVerification = contact.email && !contact.emailVerified && 
    (contact.alertPreference === 'email' || contact.alertPreference === 'both');

  if (isEditing) {
    return (
      <div className={styles.contactCard}>
        <div className={styles.contactCardHeader}>
          <span className={styles.contactNumber}>#{index}</span>
          <span className={styles.editLabel}>Editing</span>
        </div>

        <div className={styles.editForm}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Phone</label>
            <input
              type="tel"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Alert Preference</label>
            <select
              value={editData.alertPreference}
              onChange={(e) => setEditData({ ...editData, alertPreference: e.target.value })}
              className={styles.select}
            >
              {ALERT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formActions}>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={isSaving}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contactCard}>
      <div className={styles.contactCardHeader}>
        <span className={styles.contactNumber}>#{index}</span>
        <div className={styles.contactActions}>
          <button
            className={`${styles.iconButton} ${styles.testButton}`}
            onClick={handleTestAlert}
            disabled={isTesting}
            title="Send test alert"
          >
            {isTesting ? (
              <div className={styles.smallSpinner} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
              </svg>
            )}
          </button>
          <button
            className={styles.iconButton}
            onClick={() => setIsEditing(true)}
            title="Edit contact"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete contact"
          >
            {isDeleting ? (
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

      <div className={styles.contactInfo}>
        <div className={styles.contactName}>{contact.name}</div>
        {contact.email && (
          <div className={styles.contactDetail}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span className={styles.emailText}>
              {contact.email}
              {contact.emailVerified && (
                <span className={styles.verifiedBadge} title="Email verified">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </span>
              )}
            </span>
          </div>
        )}
        {needsEmailVerification && (
          <div className={styles.verificationWarning}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Email not verified</span>
            <button
              className={styles.verifyButton}
              onClick={handleSendVerification}
              disabled={isSendingVerification}
            >
              {isSendingVerification ? 'Sending...' : 'Send Verification'}
            </button>
          </div>
        )}
        {contact.phone && (
          <div className={styles.contactDetail}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
            {contact.phone}
          </div>
        )}
        <div className={styles.alertPref}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
          </svg>
          {alertLabel}
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
