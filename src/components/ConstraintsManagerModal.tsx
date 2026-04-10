import React from 'react';
import { useAppContext } from '../store';

export const ConstraintsManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, updateConstraintStatus } = useAppContext();
  const constraints = state.constraints || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h3>ניהול אילוצי מורים</h3>
        </div>
        
        <div className="constraints-list" style={{ marginTop: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {constraints.length === 0 ? (
            <p className="empty-state">אין אילוצים במערכת.</p>
          ) : (
            constraints.map(c => {
              const teacher = state.teachers.find(t => t.id === c.teacherId);
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <strong>{teacher?.name}</strong>: יום {c.day} <br/>
                    <em style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>שעות: {(c.hours || (c.hour ? [c.hour] : [])).sort((a,b)=>a-b).join(', ')}</em>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.description}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {c.status === 'pending' && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>ממתין</span>}
                    {c.status === 'approved' && <span style={{ background: 'var(--success-light)', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>מאושר</span>}
                    {c.status === 'rejected' && <span style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>נדחה</span>}
                    
                    <button 
                      onClick={() => updateConstraintStatus(c.id, 'approved')} 
                      style={{ background: 'transparent', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}
                      title="אשר אילוץ"
                    >
                      ✓ אישור
                    </button>
                    <button 
                      onClick={() => updateConstraintStatus(c.id, 'rejected')} 
                      style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}
                      title="דחה אילוץ"
                    >
                      ✗ דחייה
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>סגור</button>
        </div>
      </div>
    </div>
  );
};
