import { useState } from 'react';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

export const ExportData = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportDays, setExportDays] = useState(365);

  const handleExportCheckIns = () => {
    if (!data.userId) return;
    setIsExporting(true);

    // Create a hidden link and click it to trigger download
    const url = api.exportCheckInsUrl(data.userId, exportDays);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stillhere-checkins-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset loading state after a brief delay
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleExportSummary = () => {
    if (!data.userId) return;

    const url = api.exportSummaryUrl(data.userId);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stillhere-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Export Check-in History</h3>
      <p className={styles.sectionDescription}>
        Download your check-in history as a CSV file for your records.
      </p>

      <div className={styles.exportOptions}>
        <label className={styles.selectLabel}>
          Time range:
          <select
            className={styles.select}
            value={exportDays}
            onChange={(e) => setExportDays(Number(e.target.value))}
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
            <option value={9999}>All time</option>
          </select>
        </label>
      </div>

      <div className={styles.buttonRow}>
        <Button
          variant="secondary"
          onClick={handleExportCheckIns}
          loading={isExporting}
          disabled={!data.userId}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download CSV
        </Button>
        <Button
          variant="ghost"
          onClick={handleExportSummary}
          disabled={!data.userId}
        >
          Account Summary
        </Button>
      </div>

      {!data.userId && (
        <p className={styles.hint}>
          Complete setup to enable data export.
        </p>
      )}
    </div>
  );
};
