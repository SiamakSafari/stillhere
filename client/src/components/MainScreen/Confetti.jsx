import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export const Confetti = ({ trigger, streak }) => {
  useEffect(() => {
    if (!trigger) return;

    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#4ade80', '#22c55e', '#60a5fa', '#fbbf24', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors
    });

    frame();
  }, [trigger]);

  if (!trigger) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        textAlign: 'center',
        animation: 'popIn 0.5s ease-out',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          background: 'var(--bg-mid)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          border: '2px solid var(--green-primary)',
          boxShadow: '0 0 40px var(--green-glow)'
        }}
      >
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green-primary)" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            color: 'var(--green-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}
        >
          {streak} Day Streak!
        </h2>
        <p style={{ color: 'var(--gray-400)', fontSize: 'var(--font-size-sm)' }}>
          Keep it going!
        </p>
      </div>
    </div>
  );
};
