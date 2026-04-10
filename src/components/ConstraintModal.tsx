import React, { useState } from 'react';
import { useAppContext, Teacher } from '../store';
import { DAYS, HOURS } from '../constants';

export const ConstraintModal: React.FC<{ teacher: Teacher, onClose: () => void }> = ({ teacher, onClose }) => {
  const { addConstraint } = useAppContext();
  const [day, setDay] = useState(DAYS[0]);
  const [hour, setHour] = useState(HOURS[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    addConstraint(teacher.id, day, hour, description);
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
            <label>שעת האילוץ:</label>
            <select value={hour} onChange={e => setHour(Number(e.target.value))} required>
              {HOURS.map(h => <option key={h} value={h}>שעה {h}</option>)}
            </select>
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
