import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { ContactCard } from './ContactCard';
import { api } from '../../utils/api';
import styles from './EmergencyContacts.module.css';

const MAX_CONTACTS = 5;

export const EmergencyContacts = ({ data }) => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    alertPreference: 'email'
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (data.userId) {
      loadContacts();
    }
  }, [data.userId]);

  const loadContacts = async () => {
    if (!data.userId) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await api.getContacts(data.userId);
      setContacts(result);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim()) {
      setError('Contact name is required');
      return;
    }

    if (!newContact.email.trim() && !newContact.phone.trim()) {
      setError('Either email or phone is required');
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      const contact = await api.createContact(data.userId, newContact);

      setContacts([...contacts, contact]);
      setShowAddForm(false);
      setNewContact({ name: '', email: '', phone: '', alertPreference: 'email' });
    } catch (err) {
      console.error('Failed to add contact:', err);
      setError(err.message || 'Failed to add contact');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateContact = async (contactId, updates) => {
    try {
      const updated = await api.updateContact(data.userId, contactId, updates);
      setContacts(contacts.map(c => c.id === contactId ? updated : c));
    } catch (err) {
      console.error('Failed to update contact:', err);
      setError('Failed to update contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.deleteContact(data.userId, contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (err) {
      console.error('Failed to delete contact:', err);
      setError('Failed to delete contact');
    }
  };

  if (isLoading && contacts.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Emergency Contacts
        </h3>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading contacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Emergency Contacts
      </h3>
      <p className={styles.sectionDescription}>
        Add up to {MAX_CONTACTS} emergency contacts. Each contact can have their own notification preferences.
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

      {/* Contact list */}
      <div className={styles.contactList}>
        {contacts.map((contact, index) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            index={index + 1}
            onUpdate={(updates) => handleUpdateContact(contact.id, updates)}
            onDelete={() => handleDeleteContact(contact.id)}
          />
        ))}
      </div>

      {/* Add contact form */}
      {showAddForm ? (
        <div className={styles.addForm}>
          <h4 className={styles.addFormTitle}>Add New Contact</h4>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Name *</label>
            <input
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Contact name"
              className={styles.input}
              maxLength={100}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              placeholder="contact@example.com"
              className={styles.input}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Phone</label>
            <input
              type="tel"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className={styles.input}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Alert Preference</label>
            <select
              value={newContact.alertPreference}
              onChange={(e) => setNewContact({ ...newContact, alertPreference: e.target.value })}
              className={styles.select}
            >
              <option value="email">Email only</option>
              <option value="sms">SMS only</option>
              <option value="both">Email & SMS</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setNewContact({ name: '', email: '', phone: '', alertPreference: 'email' });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              loading={isAdding}
            >
              Add Contact
            </Button>
          </div>
        </div>
      ) : contacts.length < MAX_CONTACTS ? (
        <Button
          variant="secondary"
          onClick={() => setShowAddForm(true)}
          fullWidth
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Add Emergency Contact
        </Button>
      ) : (
        <div className={styles.maxReached}>
          Maximum of {MAX_CONTACTS} contacts reached
        </div>
      )}

      <div className={styles.privacyNote}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>
          Contacts are only notified when you miss check-ins. They receive alerts based on their individual preferences.
        </span>
      </div>
    </div>
  );
};

export default EmergencyContacts;
