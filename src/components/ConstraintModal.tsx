import React, { useState } from 'react';
import { useAppContext, Teacher } from '../store';
import { DAYS, HOURS } from '../constants';

export const ConstraintModal: React.FC<{ teacher: Teacher, onClose: () => void }> = ({ teacher, onClose }) => {
  const { addConstraint } = useAppContext();
  const [day, setDay] = useState(DAYS[0]);
  const [hours, setHours] = useState<number[]>([]);
  const [description, setDescription] = useState('');

  const handleHourToggle = (h: number) => {
    setHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (hours.length === 0) {
      alert('יש לבחור לפחות שעה אחת לאילוץ.');
      return;
    }
    addConstraint(teacher.id, day, hours, description);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>הגשת אילוץ חדש</h3>
          <p className="modal-subtitle">עבור: {teacher.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>יום האילוץ:</label>
            <select value={day} onChange={e => setDay(e.target.value)} required>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label>בחירת שעות (ניתן לסמן כמה):</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {HOURS.map(h => (
                <label key={h} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'normal' }}>
                  <input 
                    type="checkbox" 
                    checked={hours.includes(h)} 
                    onChange={() => handleHourToggle(h)} 
                  /> 
                  שעה {h}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>סיבת האילוץ:</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="למשל: לימודים, תור לרופא..." 
              required 
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary">שלח בקשה</button>
            <button type="button" className="btn-secondary" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};
