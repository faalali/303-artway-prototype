import React from 'react';

/**
 * OpportunityFilters.jsx
 *
 * Renders categorized select dropdown filters to refine available art opportunities.
 */
export default function OpportunityFilters({ filters = { category: 'All Categories', paid: 'All Opportunities' }, setFilters }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'center',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Category Dropdown */}
      <select
        value={filters.category}
        onChange={(e) =>
          setFilters({
            ...filters,
            category: e.target.value
          })
        }
        style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          color: '#fff',
          fontSize: '0.9rem',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
          transition: 'border 0.2s'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-electric)'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        <option value="All Categories" style={{ background: '#1c1c1f' }}>All Categories</option>
        <option value="Music" style={{ background: '#1c1c1f' }}>Music & Audio Arts</option>
        <option value="Film" style={{ background: '#1c1c1f' }}>Film & Video Production</option>
        <option value="Photography" style={{ background: '#1c1c1f' }}>Photography</option>
        <option value="Mural" style={{ background: '#1c1c1f' }}>Murals & Painting</option>
        <option value="Sculpture" style={{ background: '#1c1c1f' }}>Sculptures & Installation</option>
      </select>

      {/* Paid scale Dropdown */}
      <select
        value={filters.paid}
        onChange={(e) =>
          setFilters({
            ...filters,
            paid: e.target.value
          })
        }
        style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          color: '#fff',
          fontSize: '0.9rem',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
          transition: 'border 0.2s'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-electric)'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        <option value="All Opportunities" style={{ background: '#1c1c1f' }}>All Budgets</option>
        <option value="Paid" style={{ background: '#1c1c1f' }}>Commissioned / Paid</option>
        <option value="Volunteer" style={{ background: '#1c1c1f' }}>Community / Volunteer</option>
      </select>
    </div>
  );
}
