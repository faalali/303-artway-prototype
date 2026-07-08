import { useState } from 'react';

export default function AddArtistModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    neighborhood: '',
    email: '',
    mediums: '',
    source: 'Added Manually',
    experience: 'Medium'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      mediums: formData.mediums.split(',').map(s => s.trim())
    };
    onSave(formattedData);
    setFormData({ name: '', neighborhood: '', email: '', mediums: '', source: 'Added Manually', experience: 'Medium' });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Artist</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Artist Name</label>
            <input 
              required
              className="form-input" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Jane Doe"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Neighborhood</label>
            <input 
              required
              className="form-input" 
              value={formData.neighborhood}
              onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
              placeholder="e.g. Park Hill"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              required
              type="email"
              className="form-input" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="e.g. artist@domain.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Artistic Mediums (comma separated)</label>
            <input 
              required
              className="form-input" 
              value={formData.mediums}
              onChange={(e) => setFormData({...formData, mediums: e.target.value})}
              placeholder="e.g. Mural, Acting, Film Director, Modeling"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Artist</button>
          </div>
        </form>
      </div>
    </div>
  );
}
