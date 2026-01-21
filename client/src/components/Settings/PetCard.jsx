import { useState, useRef, useCallback } from 'react';
import { Button } from '../common/Button';
import styles from './PetCard.module.css';

export const PetCard = ({ data, updateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [vetName, setVetName] = useState(data.vetName || '');
  const [vetPhone, setVetPhone] = useState(data.vetPhone || '');
  const [petNotes, setPetNotes] = useState(data.petNotes || '');
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const hasPet = data.petName && data.petName.trim();

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      // Resize image to reduce storage size
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        updateData({ petPhoto: resizedDataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    updateData({ petPhoto: null });
  };

  const handleSaveInfo = () => {
    updateData({
      vetName: vetName.trim(),
      vetPhone: vetPhone.trim(),
      petNotes: petNotes.trim()
    });
    setIsEditing(false);
  };

  const generateCard = useCallback(async () => {
    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Card dimensions (optimized for sharing)
      const cardWidth = 600;
      const cardHeight = 800;
      canvas.width = cardWidth;
      canvas.height = cardHeight;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, cardHeight);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // Border
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, cardWidth - 2, cardHeight - 2);

      // Header
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pet Emergency Card', cardWidth / 2, 50);

      let yOffset = 100;

      // Pet photo or emoji
      if (data.petPhoto) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            // Draw circular photo
            const photoSize = 180;
            const photoX = (cardWidth - photoSize) / 2;
            const photoY = yOffset;

            ctx.save();
            ctx.beginPath();
            ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
            ctx.restore();

            // Photo border
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
            ctx.stroke();

            resolve();
          };
          img.onerror = resolve;
          img.src = data.petPhoto;
        });
        yOffset += 200;
      }

      // Pet name
      yOffset += 30;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.petName || 'Pet Name', cardWidth / 2, yOffset);

      // Section helper
      const drawSection = (title, content, y) => {
        if (!content) return y;

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, 40, y);

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '16px system-ui, -apple-system, sans-serif';

        // Word wrap
        const words = content.split(' ');
        let line = '';
        let lineY = y + 24;
        const maxWidth = cardWidth - 80;

        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), 40, lineY);
            line = word + ' ';
            lineY += 24;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), 40, lineY);

        return lineY + 30;
      };

      yOffset += 50;

      // Care notes
      if (data.petNotes) {
        yOffset = drawSection('Care Instructions', data.petNotes, yOffset);
      }

      // Vet info
      if (data.vetName || data.vetPhone) {
        yOffset += 10;
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Veterinarian', 40, yOffset);

        yOffset += 24;
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        if (data.vetName) {
          ctx.fillText(data.vetName, 40, yOffset);
          yOffset += 24;
        }
        if (data.vetPhone) {
          ctx.fillText(data.vetPhone, 40, yOffset);
        }
      }

      // Owner info at bottom
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Owner: ${data.name}`, cardWidth / 2, cardHeight - 60);
      ctx.fillText('Generated by Still Here', cardWidth / 2, cardHeight - 35);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.petName || 'pet'}-emergency-card.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, 'image/png');

    } catch (error) {
      console.error('Failed to generate card:', error);
      setIsGenerating(false);
    }
  }, [data]);

  if (!hasPet) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <svg className={styles.titleIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="3" />
            <circle cx="6" cy="5" r="2" />
            <circle cx="18" cy="5" r="2" />
            <circle cx="7" cy="12" r="2" />
            <circle cx="17" cy="12" r="2" />
          </svg>
          Pet Emergency Card
        </h3>
        <p className={styles.sectionDescription}>
          Add a pet during onboarding to create an emergency card you can share with neighbors or post on your fridge.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg className={styles.titleIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="3" />
          <circle cx="6" cy="5" r="2" />
          <circle cx="18" cy="5" r="2" />
          <circle cx="7" cy="12" r="2" />
          <circle cx="17" cy="12" r="2" />
        </svg>
        Pet Emergency Card
      </h3>
      <p className={styles.sectionDescription}>
        Create a shareable emergency card with {data.petName}'s info. Save it to your photos or print it.
      </p>

      {/* Photo section */}
      <div className={styles.photoSection}>
        {data.petPhoto ? (
          <div className={styles.photoPreview}>
            <img src={data.petPhoto} alt={data.petName} className={styles.petPhoto} />
            <button
              className={styles.removePhoto}
              onClick={handleRemovePhoto}
              aria-label="Remove photo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            <span>Add Photo</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Vet info section */}
      {isEditing ? (
        <div className={styles.editForm}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Vet Name</label>
            <input
              type="text"
              value={vetName}
              onChange={(e) => setVetName(e.target.value)}
              placeholder="Dr. Smith Animal Clinic"
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Vet Phone</label>
            <input
              type="tel"
              value={vetPhone}
              onChange={(e) => setVetPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Care Notes</label>
            <textarea
              value={petNotes}
              onChange={(e) => setPetNotes(e.target.value)}
              placeholder="Feeding schedule, medications, allergies..."
              className={styles.textarea}
              rows={3}
            />
          </div>
          <div className={styles.buttonRow}>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInfo}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.infoDisplay}>
          {(data.vetName || data.vetPhone || data.petNotes) ? (
            <>
              {data.vetName && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Vet:</span>
                  <span className={styles.infoValue}>{data.vetName}</span>
                </div>
              )}
              {data.vetPhone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Phone:</span>
                  <span className={styles.infoValue}>{data.vetPhone}</span>
                </div>
              )}
              {data.petNotes && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Notes:</span>
                  <span className={styles.infoValue}>{data.petNotes}</span>
                </div>
              )}
            </>
          ) : (
            <p className={styles.emptyInfo}>No vet info added yet</p>
          )}
          <Button
            variant="ghost"
            size="small"
            onClick={() => {
              setVetName(data.vetName || '');
              setVetPhone(data.vetPhone || '');
              setPetNotes(data.petNotes || '');
              setIsEditing(true);
            }}
          >
            {(data.vetName || data.vetPhone) ? 'Edit Info' : 'Add Vet Info'}
          </Button>
        </div>
      )}

      {/* Generate button */}
      <div className={styles.generateSection}>
        <Button
          onClick={generateCard}
          loading={isGenerating}
          fullWidth
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Pet Card
        </Button>
      </div>
    </div>
  );
};
