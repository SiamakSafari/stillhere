import { useState, useCallback } from 'react';
import { Button } from '../common/Button';
import styles from './MemberBadge.module.css';

export const MemberBadge = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Use memberSince or createdAt or fallback to current date
  const memberSince = data.memberSince || data.createdAt || new Date().toISOString();
  const memberDate = new Date(memberSince);
  const formattedDate = memberDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Calculate days as a member
  const daysSince = Math.floor((Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24));

  const generateBadge = useCallback(async () => {
    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Badge dimensions (square for social sharing)
      const size = 600;
      canvas.width = size;
      canvas.height = size;

      // Background gradient
      const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0a0a14');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Decorative ring
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 220, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow ring
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 200, 0, Math.PI * 2);
      ctx.stroke();

      // App name
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STILL HERE', size / 2, 160);

      // Checkmark icon
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 - 20, 50, 0, Math.PI * 2);
      ctx.fill();

      // Draw checkmark
      ctx.strokeStyle = '#0a0a14';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(size / 2 - 20, size / 2 - 20);
      ctx.lineTo(size / 2 - 5, size / 2 - 5);
      ctx.lineTo(size / 2 + 25, size / 2 - 40);
      ctx.stroke();

      // "Member since" text
      ctx.fillStyle = '#9ca3af';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillText('Member since', size / 2, size / 2 + 70);

      // Date
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(formattedDate, size / 2, size / 2 + 110);

      // Streak info if applicable
      if (data.streak > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${data.streak} day streak`, size / 2, size / 2 + 150);
      }

      // User name at bottom
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.fillText(data.name || 'User', size / 2, size - 80);

      // Days count
      if (daysSince > 0) {
        ctx.fillStyle = '#4b5563';
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${daysSince} days protected`, size / 2, size - 55);
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `still-here-badge-${data.name || 'member'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, 'image/png');

    } catch (error) {
      console.error('Failed to generate badge:', error);
      setIsGenerating(false);
    }
  }, [data, formattedDate, daysSince]);

  const handleShare = async () => {
    // For mobile sharing
    if (navigator.share) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 600;
        canvas.width = size;
        canvas.height = size;

        // Same badge generation logic (simplified for share)
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0a0a14');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 220, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('STILL HERE', size / 2, 160);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '18px system-ui';
        ctx.fillText('Member since', size / 2, size / 2 + 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px system-ui';
        ctx.fillText(formattedDate, size / 2, size / 2 + 110);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'still-here-badge.png', { type: 'image/png' });

        await navigator.share({
          title: 'Still Here Badge',
          text: `I've been a Still Here member since ${formattedDate}!`,
          files: [file]
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          // Fallback to download
          generateBadge();
        }
      }
    } else {
      generateBadge();
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" />
        </svg>
        Member Badge
      </h3>
      <p className={styles.sectionDescription}>
        Download a shareable badge showing your Still Here membership.
      </p>

      {/* Badge preview */}
      <div className={styles.badgePreview}>
        <div className={styles.badgeInner}>
          <span className={styles.badgeApp}>STILL HERE</span>
          <div className={styles.badgeCheck}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <span className={styles.badgeLabel}>Member since</span>
          <span className={styles.badgeDate}>{formattedDate}</span>
          {data.streak > 0 && (
            <span className={styles.badgeStreak}>{data.streak} day streak</span>
          )}
        </div>
      </div>

      <div className={styles.buttonRow}>
        <Button
          onClick={generateBadge}
          loading={isGenerating}
          fullWidth
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Badge
        </Button>
        {navigator.share && (
          <Button
            variant="secondary"
            onClick={handleShare}
            fullWidth
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share
          </Button>
        )}
      </div>
    </div>
  );
};
