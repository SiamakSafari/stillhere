import { useState, useMemo } from 'react';
import Lottie from 'lottie-react';
import { Shield, Clock, ChevronDown } from 'lucide-react';
import { getNextMilestone, MILESTONES } from '../../utils/time';
import { AnimatedNumber } from './AnimatedNumber';
import fireAnimation from '../../assets/animations/fire.json';
import styles from './MainScreen.module.css';

// Milestone badges with gradient styling
const MILESTONE_BADGES = {
  7: { label: '1W', fullLabel: 'Week One', gradient: 'linear-gradient(135deg, #22c55e, #4ade80)', color: '#22c55e' },
  14: { label: '2W', fullLabel: 'Two Weeks', gradient: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#16a34a' },
  30: { label: '1M', fullLabel: 'One Month', gradient: 'linear-gradient(135deg, #c0c0c0, #e8e8e8)', color: '#c0c0c0' },
  60: { label: '2M', fullLabel: 'Two Months', gradient: 'linear-gradient(135deg, #fbbf24, #fcd34d)', color: '#fbbf24' },
  100: { label: '100', fullLabel: 'Century', gradient: 'linear-gradient(135deg, #60a5fa, #93c5fd)', color: '#60a5fa' },
  365: { label: '1Y', fullLabel: 'One Year', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#f59e0b' }
};

// Map mood strings to numeric values
const MOOD_VALUES = {
  great: 5,
  good: 4,
  okay: 3,
  low: 2,
  rough: 1
};

const VALUE_TO_LABEL = {
  5: 'Great',
  4: 'Good',
  3: 'Okay',
  2: 'Low',
  1: 'Rough'
};

const MOOD_LABELS = {
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  low: 'Low',
  rough: 'Rough'
};

// Format last check-in time in a friendly way
const formatLastCheckIn = (lastCheckIn) => {
  if (!lastCheckIn) return null;

  const date = new Date(lastCheckIn);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  // Show time if today
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  // Show "Yesterday at X"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  // Show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const Stats = ({ streak, hasCheckedIn, lastCheckIn, checkInHistory = [] }) => {
  const [expanded, setExpanded] = useState(false);

  const nextMilestone = getNextMilestone(streak);
  const progress = streak > 0 ? (streak / nextMilestone) * 100 : 0;
  const lastCheckInFormatted = formatLastCheckIn(lastCheckIn);

  // Get earned milestones
  const earnedMilestones = MILESTONES.filter(m => streak >= m);

  // Determine Lottie animation speed based on streak
  const getFireSpeed = () => {
    if (streak === 0) return 0;
    if (streak >= 30) return 1.5;
    return 1;
  };

  // Calculate weekly summary stats
  const summary = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const weekCheckIns = checkInHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo;
    });

    const daysCheckedIn = new Set(
      weekCheckIns.map(entry => {
        const date = new Date(entry.date);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    ).size;

    const moodsWithValues = weekCheckIns.filter(e => e.mood && MOOD_VALUES[e.mood]);
    let avgMoodLabel = '—';

    if (moodsWithValues.length > 0) {
      const totalMood = moodsWithValues.reduce((sum, e) => sum + MOOD_VALUES[e.mood], 0);
      const avgMood = Math.round(totalMood / moodsWithValues.length);
      avgMoodLabel = VALUE_TO_LABEL[avgMood] || '—';
    }

    const formatShortDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekRange = `${formatShortDate(weekAgo)} - ${formatShortDate(now)}`;

    return { daysCheckedIn, avgMoodLabel, weekRange };
  }, [checkInHistory]);

  // Get last 7 days of mood data for chart
  const moodData = useMemo(() => {
    const now = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yday' : date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);

      const checkIn = checkInHistory.find(entry => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getFullYear() === date.getFullYear() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getDate() === date.getDate()
        );
      });

      days.push({
        label: dayLabel,
        mood: checkIn?.mood || null,
        value: checkIn?.mood ? MOOD_VALUES[checkIn.mood] : null
      });
    }

    return days;
  }, [checkInHistory]);

  const hasMoodData = moodData.some(d => d.value !== null);

  // Calculate SVG path for chart
  const chartPath = useMemo(() => {
    if (!hasMoodData) return { line: '', area: '', points: [] };

    const width = 260;
    const height = 60;
    const padding = 10;
    const dataWidth = width - padding * 2;
    const dataHeight = height - padding;

    const validPoints = [];

    moodData.forEach((d, i) => {
      if (d.value !== null) {
        const x = padding + (i / 6) * dataWidth;
        const y = height - padding - ((d.value - 1) / 4) * dataHeight;
        validPoints.push({ x, y, mood: d.mood, label: d.label });
      }
    });

    if (validPoints.length < 2) {
      return { line: '', area: '', points: validPoints };
    }

    let line = `M ${validPoints[0].x} ${validPoints[0].y}`;
    for (let i = 1; i < validPoints.length; i++) {
      const prev = validPoints[i - 1];
      const curr = validPoints[i];
      const midX = (prev.x + curr.x) / 2;
      line += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const area = `${line} L ${validPoints[validPoints.length - 1].x} ${height} L ${validPoints[0].x} ${height} Z`;

    return { line, area, points: validPoints };
  }, [moodData, hasMoodData]);

  return (
    <div className={styles.statsContainer}>
      <div
        className={`${styles.statCard} ${styles.statCardClickable}`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className={styles.statHeader}>
          <div className={styles.lottieFireWrapper}>
            <Lottie
              animationData={fireAnimation}
              loop={streak > 0}
              autoplay={streak > 0}
              style={{ width: 24, height: 24, opacity: streak > 0 ? 1 : 0.3 }}
            />
          </div>
          <span className={styles.statLabel}>Streak</span>
          <ChevronDown
            size={16}
            className={`${styles.expandIcon} ${expanded ? styles.expandIconRotated : ''}`}
          />
        </div>
        <div className={styles.statValue}>
          <AnimatedNumber
            value={streak}
            className={`${styles.streakNumber} ${hasCheckedIn ? styles.active : ''}`}
          />
          <span className={styles.statUnit}>days</span>
        </div>
        {streak > 0 && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {nextMilestone - streak} to next milestone
            </span>
          </div>
        )}

        {earnedMilestones.length > 0 && (
          <div className={styles.milestoneBadges}>
            {earnedMilestones.map(m => (
              <span
                key={m}
                className={styles.milestoneBadge}
                title={MILESTONE_BADGES[m].fullLabel}
                style={{
                  '--badge-color': MILESTONE_BADGES[m].color,
                  '--badge-gradient': MILESTONE_BADGES[m].gradient
                }}
              >
                {MILESTONE_BADGES[m].label}
              </span>
            ))}
          </div>
        )}

        {/* Expandable Weekly Section */}
        <div className={`${styles.weeklySection} ${expanded ? styles.weeklySectionExpanded : ''}`}>
          <div className={styles.weeklyDivider} />

          <div className={styles.weeklyHeader}>
            <span className={styles.weeklyTitle}>This Week</span>
            <span className={styles.weeklyRange}>{summary.weekRange}</span>
          </div>

          <div className={styles.weeklyStats}>
            <div className={styles.weeklyStat}>
              <span className={styles.weeklyStatValue}>{summary.daysCheckedIn}</span>
              <span className={styles.weeklyStatLabel}>Days</span>
            </div>
            <div className={styles.weeklyStat}>
              <span className={styles.weeklyStatValue}>{summary.avgMoodLabel}</span>
              <span className={styles.weeklyStatLabel}>Mood</span>
            </div>
          </div>

          <div className={styles.moodChartSection}>
            <span className={styles.moodChartTitle}>Mood Trend</span>

            {!hasMoodData ? (
              <p className={styles.noMoodData}>Check in with a mood to see trends</p>
            ) : (
              <>
                <svg className={styles.moodChartSvg} viewBox="0 0 260 70">
                  <defs>
                    <linearGradient id="statsMoodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent-primary, var(--green-primary))" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--accent-primary, var(--green-primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {chartPath.area && (
                    <path className={styles.moodChartArea} d={chartPath.area} />
                  )}

                  {chartPath.line && (
                    <path className={styles.moodChartLine} d={chartPath.line} />
                  )}

                  {chartPath.points.map((point, i) => (
                    <circle
                      key={i}
                      className={styles.moodChartDot}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                    >
                      <title>{point.label}: {MOOD_LABELS[point.mood]}</title>
                    </circle>
                  ))}
                </svg>

                <div className={styles.moodChartLabels}>
                  {moodData.map((d, i) => (
                    <span key={i}>{d.label}</span>
                  ))}
                </div>
              </>
            )}

            <div className={styles.moodScale}>
              <span>Low</span>
              <span>Mid</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {hasCheckedIn && (
        <div className={`${styles.protectedBadge} animate-popIn`}>
          <Shield size={16} fill="currentColor" />
          Protected
        </div>
      )}

      {lastCheckInFormatted && (
        <div className={styles.lastCheckIn}>
          <Clock size={14} />
          <span>Last check-in: {lastCheckInFormatted}</span>
        </div>
      )}
    </div>
  );
};
