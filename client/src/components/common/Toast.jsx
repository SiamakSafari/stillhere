import { useToast } from '../../context/ToastContext';
import { useEffect } from 'react';
import sounds from '../../utils/sounds';
import styles from './Toast.module.css';

// Icons for each toast type
const icons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
};

const ToastItem = ({ toast, onDismiss }) => {
  const { id, message, type, action } = toast;

  // Play sound on mount based on type
  useEffect(() => {
    if (type === 'error') {
      sounds.playError();
    } else if (type === 'success') {
      sounds.playSuccess();
    }
  }, [type]);

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.icon}>
        {icons[type]}
      </span>
      <span className={styles.message}>{message}</span>
      {action && (
        <button
          className={styles.action}
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
        >
          {action.label}
        </button>
      )}
      <button
        className={styles.dismiss}
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-label="Notifications">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
