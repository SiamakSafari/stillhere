import { useMemo } from 'react';
import { getQuoteForDate } from '../../data/quotes';
import styles from './DailyQuote.module.css';

export const DailyQuote = () => {
  const quote = useMemo(() => getQuoteForDate(new Date()), []);

  return (
    <div className={styles.quoteContainer}>
      <div className={styles.quoteIcon}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      </div>
      <blockquote className={styles.quote}>
        <p className={styles.quoteText}>{quote.text}</p>
        {quote.author && (
          <cite className={styles.quoteAuthor}>— {quote.author}</cite>
        )}
      </blockquote>
    </div>
  );
};
