import { useState } from 'react';

export default function AddOpportunityModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    destType: 'funding', // 'funding' or 'project'
    title: '',
    provider: '',
    type: 'Grant', // e.g. Grant, RFQ / Commission, Residency, Exhibition Call
    amount: '',
    openDate: '',
    closeDate: '',
    url: '',
    whoShouldApply: '',
    description: '',
    broadcast: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      destType: 'funding',
      title: '',
      provider: '',
      type: 'Grant',
      amount: '',
      openDate: '',
      closeDate: '',
      url: '',
      whoShouldApply: '',
      description: '',
      broadcast: true
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          Add New Opportunity
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Destination Stream</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="destType"
                  value="funding"
                  checked={formData.destType === 'funding'}
                  onChange={() => setFormData({...formData, destType: 'funding'})}
                  style={{ accentColor: 'var(--accent-terracotta)' }}
                />
                Funding Sources / RFQs
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="destType"
                  value="project"
                  checked={formData.destType === 'project'}
                  onChange={() => setFormData({...formData, destType: 'project'})}
                  style={{ accentColor: 'var(--accent-terracotta)' }}
                />
                Project Pipeline Tracks
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">{formData.destType === 'funding' ? 'Opportunity Title' : 'Project Name'}</label>
              <input 
                required
                className="form-input" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={formData.destType === 'funding' ? "e.g. Red Hotel Artist Call" : "e.g. Heritage Mural Phase II"}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{formData.destType === 'funding' ? 'Provider / Sponsor' : 'Lead Agency / Sponsor'}</label>
              <input 
                required
                className="form-input" 
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                placeholder="e.g. Boulder Arts Commission"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Classification / Type</label>
              <select
                className="form-input"
                style={{ background: 'var(--background-secondary)', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem 0.8rem', width: '100%' }}
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Grant">Grant</option>
                <option value="RFQ / Commission">RFQ / Commission</option>
                <option value="Exhibition Call">Exhibition Call</option>
                <option value="Residency">Residency</option>
                <option value="Mural Call">Mural Call</option>
                <option value="Sculpture Commission">Sculpture Commission</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{formData.destType === 'funding' ? 'Compensation / Grant Amount' : 'Project Budget'}</label>
              <input 
                required
                className="form-input" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="e.g. $15,000 or Up to $10,000"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Start / Open Date</label>
              <input 
                required
                type="date"
                className="form-input" 
                value={formData.openDate}
                onChange={(e) => setFormData({...formData, openDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End / Deadline Date</label>
              <input 
                required
                type="date"
                className="form-input" 
                value={formData.closeDate}
                onChange={(e) => setFormData({...formData, closeDate: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Opportunity Website / URL</label>
              <input 
                className="form-input" 
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="e.g. CallForEntry.org"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Who Should Apply? (Recommendations)</label>
              <input 
                className="form-input" 
                value={formData.whoShouldApply}
                onChange={(e) => setFormData({...formData, whoShouldApply: e.target.value})}
                placeholder="e.g. Boulder painters and muralists"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description / What they're looking for</label>
            <textarea 
              required
              rows="4"
              className="form-input" 
              style={{ resize: 'vertical', width: '100%', borderRadius: '8px', minHeight: '80px' }}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Provide a detailed description of the call, media requirements, style directions, and any specific requirements..."
            />
          </div>

          {/* Glowing Glassmorphic Broadcast Option */}
          <div style={{
            background: 'rgba(230, 92, 70, 0.05)',
            border: '1px dashed rgba(230, 92, 70, 0.25)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ textSelf: 'start' }}>
              <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', color: 'var(--accent-terracotta)' }}>campaign</span>
                Broadcast Opportunity via Email
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Instantly email all registered directory artists with words of encouragement, dates, and Grant Assistant pointers.
              </p>
            </div>
            <div>
              <input 
                type="checkbox"
                checked={formData.broadcast}
                onChange={(e) => setFormData({...formData, broadcast: e.target.checked})}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: 'var(--accent-terracotta)'
                }}
              />
            </div>
          </div>

          <div className="modal-actions" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ background: 'var(--accent-terracotta)', border: 'none' }}>
              Save & Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
