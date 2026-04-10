import React, { useState } from 'react';
import { useAppContext, Teacher } from '../store';
import { TeacherScheduleModal } from './TeacherScheduleModal';
import { DAYS } from '../constants';

export const TeacherPanel: React.FC = () => {
  const { state, addTeacher, removeTeacher, updateTeacher, getTeacherTotalHours, isManager } = useAppContext();
  const [newTeacherName, setNewTeacherName] = useState('');
  const [maxHours, setMaxHours] = useState(26);
  const [search, setSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    addTeacher(newTeacherName.trim(), maxHours);
    setNewTeacherName('');
    setMaxHours(26);
  };

  const filteredTeachers = state.teachers.filter(t =>
    t.name.includes(search.trim())
  );

  return (
    <aside className="teacher-panel">
      {selectedTeacher && (
        <TeacherScheduleModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />
      )}

      <h2>מאגר מורים</h2>

      {isManager && (
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
      )}

      <div className="teacher-search-wrapper">
        <input
          type="text"
          placeholder="חפש מורה..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="teacher-search-input"
        />
      </div>

      <div className="teachers-list">
        {state.teachers.length === 0 ? (
          <p className="empty-state">אין מורים במערכת. הוסף מורה חדש כדי להתחיל.</p>
        ) : filteredTeachers.length === 0 ? (
          <p className="empty-state">לא נמצאו מורים תואמים.</p>
        ) : (
          filteredTeachers.map(teacher => {
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
                      onClick={() => setSelectedTeacher(teacher)}
                      className="btn-icon btn-schedule"
                      title="הצג מערכת שעות"
                    >
                      📋
                    </button>
                    {isManager && (
                      <button 
                        onClick={() => removeTeacher(teacher.id)}
                        className="btn-icon btn-danger"
                        title="מחק מורה"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar ${isOverLimit ? 'over-limit' : ''}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="tutoring-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    פרטני: {state.timetableAssignments?.filter(a => a.teacherId === teacher.id && a.subjectId === 'פרטני').length || 0} / {teacher.tutoringHours || 3}
                  </span>
                  
                  {isManager ? (
                    <select 
                      value={teacher.dayOff || ''} 
                      onChange={e => updateTeacher(teacher.id, { dayOff: e.target.value })}
                      title="יום חופשי"
                      className="day-off-select"
                      style={{ fontSize: '0.75rem', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="">יום חופש: ללא</option>
                      {DAYS.map(d => <option key={d} value={d}>חופש ב-{d}</option>)}
                    </select>
                  ) : (
                    teacher.dayOff && <div className="day-off-badge" style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>חופש ב-{teacher.dayOff}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
