import styles from './AccordionSection.module.css';

export const AccordionSection = ({ title, subtitle, icon, iconBg, isOpen, onToggle, children }) => {
  return (
    <div className={`${styles.accordion} ${isOpen ? styles.open : ''}`}>
      <button
        className={styles.header}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className={styles.iconCircle} style={{ background: iconBg }}>
          {icon}
        </div>
        <div className={styles.headerText}>
          <h3 className={styles.title}>{title}</h3>
          {!isOpen && subtitle && (
            <p className={styles.subtitle}>{subtitle}</p>
          )}
        </div>
        <svg
          className={styles.chevron}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className={`${styles.body} ${isOpen ? styles.expanded : ''}`}>
        <div className={styles.bodyInner}>
          {children}
        </div>
      </div>
    </div>
  );
};
