import React, { useState } from 'react';
import { useAppContext, Teacher } from '../store';
import { TeacherScheduleModal } from './TeacherScheduleModal';
import { ConstraintModal } from './ConstraintModal';
import { DAYS } from '../constants';

export const TeacherPanel: React.FC = () => {
  const { state, addTeacher, removeTeacher, updateTeacher, getTeacherTotalHours, isManager } = useAppContext();
  const [newTeacherName, setNewTeacherName] = useState('');
  const [maxHours, setMaxHours] = useState(26);
  const [search, setSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [constraintTeacher, setConstraintTeacher] = useState<Teacher | null>(null);

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
      {constraintTeacher && (
        <ConstraintModal teacher={constraintTeacher} onClose={() => setConstraintTeacher(null)} />
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
                    <button
                      onClick={() => setConstraintTeacher(teacher)}
                      className="btn-secondary"
                      title="הגש בקשת אילוץ למנהלת"
                      style={{ fontSize: '0.75rem', padding: '2px 6px', height: '24px' }}
                    >
                      + אילוץ
                    </button>
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
                
                <div className="tutoring-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '5px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    פרטני: {state.timetableAssignments?.filter(a => a.teacherId === teacher.id && a.subjectId === 'פרטני').length || 0} / {teacher.tutoringHours || 3}
                  </span>
                  
                  {isManager ? (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <select 
                        value={(teacher.daysOff && teacher.daysOff[0]) || teacher.dayOff || ''} 
                        onChange={e => {
                           const secondDay = (teacher.daysOff && teacher.daysOff[1]) || '';
                           const newDays = [e.target.value, secondDay].filter(Boolean);
                           updateTeacher(teacher.id, { daysOff: newDays, dayOff: newDays[0] || '' });
                        }}
                        title="יום חופשי 1"
                        className="day-off-select"
                        style={{ fontSize: '0.75rem', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      >
                        <option value="">יום חופש: ללא</option>
                        {DAYS.map(d => <option key={d} value={d}>חופש ב-{d}</option>)}
                      </select>

                      <select 
                        value={(teacher.daysOff && teacher.daysOff[1]) || ''} 
                        onChange={e => {
                           const firstDay = (teacher.daysOff && teacher.daysOff[0]) || teacher.dayOff || '';
                           const newDays = Array.from(new Set([firstDay, e.target.value].filter(Boolean)));
                           updateTeacher(teacher.id, { daysOff: newDays, dayOff: newDays[0] || '' });
                        }}
                        title="יום חופשי 2"
                        className="day-off-select"
                        style={{ fontSize: '0.75rem', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      >
                        <option value="">יום חופש 2: ללא</option>
                        {DAYS.map(d => <option key={d} value={d}>חופש 2 ב-{d}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '3px' }}>
                    {((teacher.daysOff && teacher.daysOff.length > 0) ? teacher.daysOff : (teacher.dayOff ? [teacher.dayOff] : [])).map(d => (
                       <div key={d} className="day-off-badge" style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>חופש ב-{d}</div>
                    ))}
                    </div>
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
