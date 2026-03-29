import React, { useState } from 'react';
import { useAppContext } from '../store';

export const TeacherPanel: React.FC = () => {
  const { state, addTeacher, removeTeacher, getTeacherTotalHours } = useAppContext();
  const [newTeacherName, setNewTeacherName] = useState('');
  const [maxHours, setMaxHours] = useState(26);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    addTeacher(newTeacherName.trim(), maxHours);
    setNewTeacherName('');
    setMaxHours(26);
  };

  return (
    <aside className="teacher-panel">
      <h2>מאגר מורים</h2>
      
      <form onSubmit={handleAdd} className="add-teacher-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="שם המורה..."
            value={newTeacherName}
            onChange={(e) => setNewTeacherName(e.target.value)}
            required
          />
          <input
            type="number"
            min="1"
            max="40"
            value={maxHours}
            onChange={(e) => setMaxHours(Number(e.target.value))}
            title="מגבלת שעות שבועיות"
            required
            className="hours-input"
          />
          <button type="submit" className="btn-primary">הוסף</button>
        </div>
      </form>

      <div className="teachers-list">
        {state.teachers.length === 0 ? (
          <p className="empty-state">אין מורים במערכת. הוסף מורה חדש כדי להתחיל.</p>
        ) : (
          state.teachers.map(teacher => {
            const currentHours = getTeacherTotalHours(teacher.id);
            const percentage = Math.min(100, Math.round((currentHours / teacher.maxHours) * 100));
            const isOverLimit = currentHours > teacher.maxHours;

            return (
              <div key={teacher.id} className="teacher-card">
                <div className="teacher-header">
                  <strong>{teacher.name}</strong>
                  <div className="teacher-actions">
                    <span className="hours-text">
                      {currentHours} / {teacher.maxHours} שעות
                    </span>
                    <button 
                      onClick={() => removeTeacher(teacher.id)}
                      className="btn-icon btn-danger"
                      title="מחק מורה"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar ${isOverLimit ? 'over-limit' : ''}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
