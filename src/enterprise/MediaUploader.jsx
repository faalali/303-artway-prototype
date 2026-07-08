import React from 'react';

/**
 * MediaUploader.jsx
 *
 * Premium drag-and-drop media file selector incorporating brand styling,
 * checking file selections before forwarding transactions.
 */
export default function MediaUploader({ onUpload = () => {} }) {
  async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check size limit: max 3.5MB for Cloud Storage compatibility rules
    if (file.size > 3.5 * 1024 * 1024) {
      alert('File size exceeds the 3.5MB limit. Please compress your media and try again.');
      event.target.value = ''; // Reset file input
      return;
    }

    onUpload(file);
  }

  return (
    <div style={{
      border: '2px dashed rgba(255, 255, 255, 0.12)',
      borderRadius: '20px',
      padding: '2.5rem 1.5rem',
      textAlign: 'center',
      background: 'rgba(255, 255, 255, 0.01)',
      fontFamily: "'Outfit', sans-serif",
      transition: 'border-color 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-electric)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
    >
      <input
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={handleFile}
        style={{
          display: 'block',
          margin: '0 auto',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer'
        }}
      />

      <p style={{
        marginTop: '1rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
        margin: '1rem 0 0'
      }}>
        Upload photos, videos, audio, or creative materials. <br/>
        <strong style={{ color: 'var(--accent-ochre)' }}>Max limit: 3.5MB</strong>
      </p>
    </div>
  );
}
