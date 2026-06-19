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
            placeholder="מגבלת שעות (ברירת מחדל למורה חדש)"
            title="מגבלת שעות (ברירת מחדל למורה חדש)"
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
            const maxHoursLimit = teacher.maxHours ?? 26;
            const currentHours = getTeacherTotalHours(teacher.id);
            const percentage = Math.min(100, Math.round((currentHours / maxHoursLimit) * 100));
            const isOverLimit = currentHours > maxHoursLimit;

            return (
              <div key={teacher.id} className="teacher-card">
                <div className="teacher-card-top">
                  <strong className="teacher-name">{teacher.name}</strong>
                  <div className="teacher-card-icons">
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

                <div className="teacher-hours-block">
                  <div className="teacher-hours-header">
                    <span className="teacher-meta-label">שעות שבועיות</span>
                    <span className="teacher-hours-value">
                      {currentHours} /
                      {isManager ? (
                        <input
                          type="number"
                          min={1}
                          max={40}
                          value={teacher.maxHours ?? 26}
                          onChange={e => updateTeacher(teacher.id, { maxHours: Number(e.target.value) })}
                          title="מגבלת שעות שבועיות"
                          className="teacher-limit-input"
                        />
                      ) : (
                        <span className="teacher-hours-max">{teacher.maxHours ?? 26}</span>
                      )}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar ${isOverLimit ? 'over-limit' : ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="teacher-card-meta">
                  <div className="teacher-meta-item">
                    <span className="teacher-meta-label">פרטני</span>
                    <span className="teacher-meta-value">
                      {state.timetableAssignments?.filter(a => a.teacherId === teacher.id && a.subjectId === 'פרטני').length || 0} /
                      {isManager ? (
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={teacher.tutoringHours ?? 3}
                          onChange={e => updateTeacher(teacher.id, { tutoringHours: Number(e.target.value) })}
                          title="מגבלת שעות פרטני"
                          className="teacher-limit-input"
                        />
                      ) : (
                        <span>{teacher.tutoringHours ?? 3}</span>
                      )}
                    </span>
                  </div>

                  <div className="teacher-meta-item teacher-meta-item-days">
                    <span className="teacher-meta-label">ימי חופש</span>
                    {isManager ? (
                      <div className="teacher-days-off-controls">
                        <select
                          value={(teacher.daysOff && teacher.daysOff[0]) || teacher.dayOff || ''}
                          onChange={e => {
                            const secondDay = (teacher.daysOff && teacher.daysOff[1]) || '';
                            const newDays = [e.target.value, secondDay].filter(Boolean);
                            updateTeacher(teacher.id, { daysOff: newDays, dayOff: newDays[0] || '' });
                          }}
                          title="יום חופשי 1"
                          className="day-off-select"
                        >
                          <option value="">ללא</option>
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
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
                        >
                          <option value="">ללא</option>
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="teacher-days-off-badges">
                        {((teacher.daysOff && teacher.daysOff.length > 0) ? teacher.daysOff : (teacher.dayOff ? [teacher.dayOff] : [])).length > 0 ? (
                          ((teacher.daysOff && teacher.daysOff.length > 0) ? teacher.daysOff : (teacher.dayOff ? [teacher.dayOff] : [])).map(d => (
                            <span key={d} className="day-off-badge">{d}</span>
                          ))
                        ) : (
                          <span className="teacher-meta-empty">ללא</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setConstraintTeacher(teacher)}
                  className="btn-constraint"
                  title="הגש בקשת אילוץ למנהלת"
                >
                  + אילוץ
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
