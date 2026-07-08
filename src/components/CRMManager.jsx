import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function CRMManager() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: ''
  });

  // New Contact / Edit Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'lead',
    status: 'new',
    priority: 'medium',
    source: '',
    tags: '',
    nextFollowUpDate: ''
  });

  // Listen to Firestore crmContacts collection in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'crmContacts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort contacts by name or createdAt descending
      list.sort((a, b) => a.name.localeCompare(b.name));
      setContacts(list);
      setLoading(false);
    }, (err) => {
      console.error('[CRM Firestore Listener Failed]:', err);
      setError(err.message);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Update selected contact detail drawer when contacts change
  useEffect(() => {
    if (selectedContact) {
      const updated = contacts.find(c => c.id === selectedContact.id);
      if (updated) setSelectedContact(updated);
    }
  }, [contacts, selectedContact]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ type: '', status: '', priority: '' });
    setSearch('');
  };

  // Filter contacts locally based on search query and dropdown selections
  const filteredContacts = contacts.filter(contact => {
    const nameMatch = !search || contact.name.toLowerCase().includes(search.toLowerCase()) || 
                      (contact.email && contact.email.toLowerCase().includes(search.toLowerCase())) ||
                      (contact.company && contact.company.toLowerCase().includes(search.toLowerCase())) ||
                      (contact.tags && Array.isArray(contact.tags) && contact.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));
    
    const typeMatch = !filters.type || contact.type === filters.type;
    const statusMatch = !filters.status || contact.status === filters.status;
    const priorityMatch = !filters.priority || contact.priority === filters.priority;

    return nameMatch && typeMatch && statusMatch && priorityMatch;
  });

  const handleAddClick = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      type: 'lead',
      status: 'new',
      priority: 'medium',
      source: '',
      tags: '',
      nextFollowUpDate: ''
    });
    setIsAddModalOpen(true);
  };

  const handleEditClick = (contact) => {
    setFormData({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      type: contact.type || 'lead',
      status: contact.status || 'new',
      priority: contact.priority || 'medium',
      source: contact.source || '',
      tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : (contact.tags || ''),
      nextFollowUpDate: contact.nextFollowUpDate || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveNew = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const ownerId = auth.currentUser ? auth.currentUser.uid : 'system';
      const cleanTags = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        source: formData.source.trim(),
        tags: cleanTags,
        nextFollowUpDate: formData.nextFollowUpDate,
        ownerId,
        notes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'crmContacts'), payload);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('[CRM addDoc failed]:', err);
      alert('Error creating contact: ' + err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !selectedContact) return;

    try {
      const cleanTags = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      const docRef = doc(db, 'crmContacts', selectedContact.id);
      
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        source: formData.source.trim(),
        tags: cleanTags,
        nextFollowUpDate: formData.nextFollowUpDate,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, payload);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('[CRM updateDoc failed]:', err);
      alert('Error updating contact: ' + err.message);
    }
  };

  const handleDelete = async (contactId) => {
    if (window.confirm('⚠️ Are you sure you want to permanently delete this contact?\n\nThis action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'crmContacts', contactId));
        if (selectedContact?.id === contactId) setSelectedContact(null);
      } catch (err) {
        console.error('[CRM deleteDoc failed]:', err);
        alert('Error deleting contact: ' + err.message);
      }
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedContact) return;

    try {
      const docRef = doc(db, 'crmContacts', selectedContact.id);
      const newNote = {
        id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        content: newNoteContent.trim(),
        createdAt: new Date().toISOString()
      };
      
      const updatedNotes = [newNote, ...(selectedContact.notes || [])];
      await updateDoc(docRef, {
        notes: updatedNotes,
        updatedAt: serverTimestamp()
      });

      setNewNoteContent('');
    } catch (err) {
      console.error('[CRM addNote failed]:', err);
      alert('Error adding note: ' + err.message);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'badge-in-review';
      case 'medium': return 'badge-new';
      default: return 'badge-archived';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
      case 'interested':
        return 'badge-vetted';
      case 'new':
      case 'contacted':
        return 'badge-new';
      case 'inactive':
        return 'badge-in-review';
      default:
        return 'badge-archived';
    }
  };

  return (
    <div className="crm-directory-container">
      {/* Top Search and Action Bar */}
      <div className="crm-toolbar">
        <div className="search-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search contacts by name, email, company, tags..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        
        <button 
          className={`btn-secondary filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="material-symbols-outlined">filter_list</span> 
          {showFilters ? 'Hide Advanced Filters' : 'Advanced Filters'}
          {(filters.type || filters.status || filters.priority) && (
            <span className="filter-indicator-dot"></span>
          )}
        </button>

        <button className="btn-primary" onClick={handleAddClick}>
          + Add Contact
        </button>
      </div>

      {/* Advanced Filters Expandable Panel */}
      {showFilters && (
        <div className="advanced-filters-panel">
          <div className="filters-grid">
            {/* Contact Type Filter */}
            <div className="filter-item">
              <label className="filter-label">Contact Type</label>
              <select 
                className="filter-input"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="collector">Collector</option>
                <option value="artist">Artist</option>
                <option value="lead">Lead</option>
                <option value="vendor">Vendor</option>
                <option value="curator">Curator</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-item">
              <label className="filter-label">Status</label>
              <select 
                className="filter-input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="filter-item">
              <label className="filter-label">Priority</label>
              <select 
                className="filter-input"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="panel-actions">
            <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleResetFilters}>
              Reset Filters & Search
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      {filteredContacts.length < contacts.length && (
        <div className="crm-results-count">
          Showing <strong>{filteredContacts.length}</strong> of {contacts.length} contacts based on filters.
        </div>
      )}

      {/* Main CRM Grid / List View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="loading-spinner" style={{ width: '32px', height: '32px' }}></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading contacts...</p>
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          color: '#f87171'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>error</span>
          <h3 style={{ margin: '1rem 0 0.5rem' }}>Failed to Load Contacts</h3>
          <p>{error}</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="map-placeholder" style={{ padding: '6rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-secondary)' }}>search_off</span>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', marginTop: '1rem' }}>No contacts found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Try broadening your search keywords or resetting filters.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.15)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Company</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Follow Up</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  onClick={() => setSelectedContact(contact)}
                  style={{ 
                    borderBottom: '1px solid var(--border-subtle)', 
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'white' }}>{contact.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{contact.email || 'No email'}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'white' }}>{contact.company || '—'}</td>
                  <td style={{ padding: '1.25rem 1.5rem', textTransform: 'capitalize', color: 'var(--text-secondary)', fontWeight: 500 }}>{contact.type}</td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`vetting-badge ${getStatusBadgeClass(contact.status)}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span className={`vetting-badge ${getPriorityBadgeClass(contact.priority)}`}>
                      {contact.priority}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {contact.nextFollowUpDate || '—'}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.6rem', minHeight: 'unset', display: 'flex', alignItems: 'center' }}
                        onClick={() => handleEditClick(contact)}
                        title="Edit Contact"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>edit</span>
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.6rem', minHeight: 'unset', display: 'flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
                        onClick={() => handleDelete(contact.id)}
                        title="Delete Contact"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out Detailed Contact Drawer */}
      {selectedContact && (
        <div className="drawer-overlay" onClick={() => setSelectedContact(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '650px' }}>
            <header className="drawer-header">
              <div>
                <span className="drawer-id">CRM Contact</span>
                <h2 className="drawer-title" style={{ margin: '4px 0 0 0' }}>{selectedContact.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <span className={`vetting-badge ${getStatusBadgeClass(selectedContact.status)}`}>
                    {selectedContact.status}
                  </span>
                  <span className={`vetting-badge ${getPriorityBadgeClass(selectedContact.priority)}`}>
                    {selectedContact.priority}
                  </span>
                  <span className="vetting-badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', textTransform: 'capitalize' }}>
                    {selectedContact.type}
                  </span>
                </div>
              </div>
              <button className="close-drawer-btn" onClick={() => setSelectedContact(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="drawer-body">
              {/* Vetting Status Admin CRM Controls */}
              <div className="drawer-admin-panel">
                <h3 className="admin-title">
                  <span className="material-symbols-outlined">verified_user</span> Follow-Up & Actions
                </h3>
                <div className="admin-controls-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Next Follow-Up</label>
                    <input 
                      type="date"
                      className="form-input"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
                      value={selectedContact.nextFollowUpDate || ''}
                      onChange={(e) => updateDoc(doc(db, 'crmContacts', selectedContact.id), { nextFollowUpDate: e.target.value, updatedAt: serverTimestamp() })}
                    />
                  </div>
                  <div className="contact-log-group">
                    <label className="form-label" style={{ display: 'block' }}>Update Status</label>
                    <select
                      className="form-input"
                      style={{ padding: '0.5rem 1.0rem', fontSize: '0.9rem', appearance: 'auto', width: '100%' }}
                      value={selectedContact.status}
                      onChange={(e) => updateDoc(doc(db, 'crmContacts', selectedContact.id), { status: e.target.value, updatedAt: serverTimestamp() })}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Personal Details */}
              <section className="drawer-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="detail-grid-2">
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    {selectedContact.email ? (
                      <a href={`mailto:${selectedContact.email}`} className="detail-val text-link">{selectedContact.email}</a>
                    ) : (
                      <span className="detail-val" style={{ opacity: 0.35 }}>—</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone</span>
                    {selectedContact.phone ? (
                      <a href={`tel:${selectedContact.phone}`} className="detail-val text-link">{selectedContact.phone}</a>
                    ) : (
                      <span className="detail-val" style={{ opacity: 0.35 }}>—</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Company</span>
                    <span className="detail-val">{selectedContact.company || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Source</span>
                    <span className="detail-val">{selectedContact.source || '—'}</span>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Tags */}
              <section className="drawer-section">
                <h3 className="section-title">Tags</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedContact.tags && selectedContact.tags.length > 0 ? (
                    selectedContact.tags.map((tag, idx) => (
                      <span key={idx} className="metric-pill style-tag" style={{ border: '1px solid', fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No tags defined</span>
                  )}
                </div>
              </section>

              {/* SECTION 3: Notes & History Timeline */}
              <section className="drawer-section">
                <h3 className="section-title">Notes & Interaction History</h3>
                
                {/* Note creation form */}
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Add a progress note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>send</span>
                    Add
                  </button>
                </form>

                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedContact.notes && selectedContact.notes.length > 0 ? (
                    selectedContact.notes.map((note) => (
                      <div 
                        key={note.id} 
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          padding: '1rem',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>person</span>
                            Logged Note
                          </span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'white', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      background: 'rgba(0,0,0,0.1)',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>
                      No history items logged. Use the field above to add notes.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2>Add CRM Contact</h2>
            <form onSubmit={handleSaveNew}>
              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    required
                    className="form-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input 
                    className="form-input" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g. Denver Art Museum"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email"
                    className="form-input" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. john@dam.org"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    className="form-input" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. 303-555-0144"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select 
                    className="form-input"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="collector">Collector</option>
                    <option value="artist">Artist</option>
                    <option value="lead">Lead</option>
                    <option value="vendor">Vendor</option>
                    <option value="curator">Curator</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    className="form-input"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Next Follow-Up</label>
                  <input 
                    type="date"
                    className="form-input" 
                    value={formData.nextFollowUpDate}
                    onChange={(e) => setFormData({...formData, nextFollowUpDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Lead Source</label>
                <input 
                  className="form-input" 
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  placeholder="e.g. Gallery Walk-in, Referral, Website form"
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Tags (comma separated)</label>
                <input 
                  className="form-input" 
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="e.g. VIP, Sculpture Collector, Muralist"
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2>Edit Contact Details</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    required
                    className="form-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input 
                    className="form-input" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email"
                    className="form-input" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    className="form-input" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select 
                    className="form-input"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="collector">Collector</option>
                    <option value="artist">Artist</option>
                    <option value="lead">Lead</option>
                    <option value="vendor">Vendor</option>
                    <option value="curator">Curator</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    className="form-input"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Next Follow-Up</label>
                  <input 
                    type="date"
                    className="form-input" 
                    value={formData.nextFollowUpDate}
                    onChange={(e) => setFormData({...formData, nextFollowUpDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Lead Source</label>
                <input 
                  className="form-input" 
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Tags (comma separated)</label>
                <input 
                  className="form-input" 
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
