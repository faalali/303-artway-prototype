import { useState } from 'react';

export default function MobileShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const mobileLink = typeof window !== 'undefined' ? (window.location.origin + '/?tab=register') : 'https://ila-gallery-database.web.app/?tab=register';
  
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR Code URL using QuickChart API. Color e05a47 corresponds to --accent-terracotta
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(mobileLink)}&dark=e05a47&light=fafafa&margin=2&size=200`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content mobile-share-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '600px', padding: '2.5rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.8rem' }}>Test & Share Form</h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>close</span>
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
          To test or share the <strong>ILA Gallery Artist Questionnaire</strong> directly on your mobile device, 
          use the scannable QR code below or copy the secure public HTTPS link.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'center' }}>
          {/* QR Code Container */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ 
              background: '#fafafa', 
              padding: '8px', 
              borderRadius: '12px', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img 
                src={qrCodeUrl} 
                alt="Intake Form QR Code" 
                style={{ width: '180px', height: '180px', borderRadius: '4px' }}
                onError={(e) => {
                  e.target.onerror = null;
                  // Fallback if QuickChart is down
                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=e05a47&bgcolor=fafafa&qzone=2&data=${encodeURIComponent(mobileLink)}`;
                }}
              />
            </div>
            <span style={{ 
              fontFamily: 'Space Grotesk', 
              fontSize: '0.75rem', 
              color: 'var(--accent-terracotta)', 
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center'
            }}>
              Scan with Camera
            </span>
          </div>

          {/* Quick Share Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Copyable Link Container */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Live Public Web Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={mobileLink}
                  style={{ 
                    background: 'rgba(0,0,0,0.4)', 
                    border: '1px solid var(--border-subtle)', 
                    color: 'var(--text-primary)', 
                    borderRadius: '8px', 
                    padding: '0.6rem 0.8rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    flexGrow: 1,
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={handleCopy}
                  style={{ 
                    background: copied ? 'var(--accent-electric)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    padding: '0 0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Instruction Accordion */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)', fontSize: '1.2rem' }}>bolt</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>AirDrop in 2 Seconds</strong>
              </div>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <li>Click the copy button above.</li>
                <li>Paste & open the link in your Mac's browser (Safari or Chrome).</li>
                <li>Use your browser's <strong>Share</strong> button and choose <strong>AirDrop</strong> to beam it to your iPhone!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Network & Hosting Status Notice */}
        <div style={{ 
          marginTop: '2rem', 
          background: 'rgba(224, 90, 71, 0.08)', 
          border: '1px solid rgba(224, 90, 71, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--accent-terracotta)', fontSize: '1.5rem', marginTop: '0.1rem' }}>cloud_done</span>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Fully Live 24/7 on the Public Internet!
            </h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
              This database is permanently deployed. You can copy this link and paste it into your <strong>Instagram Bio</strong> or share it with artists in other cities. 
              <br /><br />
              <strong>Note:</strong> Anyone, anywhere can fill out this form on cellular data or Wi-Fi, and the results will automatically sync to your CRM and Google Sheets in real-time!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
