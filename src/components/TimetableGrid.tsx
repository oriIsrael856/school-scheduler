import React, { useState } from 'react';
import { useAppContext } from '../store';
import { CLASSES, DAYS, HOURS, SUBJECTS, HOUR_TIMES, BREAKS } from '../constants';

export const TimetableGrid: React.FC = () => {
  const { state, setTimetableAssignment, removeTimetableAssignment, isManager } = useAppContext();
  const [selectedClass, setSelectedClass] = useState<string>(CLASSES[0]);
  const [editingSlot, setEditingSlot] = useState<{ day: string, hour: number } | null>(null);

  const handleSave = (teacherId: string, subjectId: string) => {
    if (editingSlot) {
      if (teacherId && subjectId) {
        setTimetableAssignment(selectedClass, editingSlot.day, editingSlot.hour, teacherId, subjectId);
      } else {
        removeTimetableAssignment(selectedClass, editingSlot.day, editingSlot.hour);
      }
    }
    setEditingSlot(null);
  };

  return (
    <div className="scheduler-container">
      <div className="scheduler-toolbar">
        <label className="filter-label">מערכת שעות לכיתה:</label>
        <select 
          className="grade-select"
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
        >
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {state.homeroomTeachers?.[selectedClass] && (
            <span style={{ marginRight: '1rem', background: 'var(--primary-light)', padding: '5px 10px', borderRadius: '8px' }}>
                מחנכת: {state.teachers.find(t => t.id === state.homeroomTeachers[selectedClass])?.name}
            </span>
        )}
      </div>

      <div className="table-wrapper glass-panel">
        <table className="scheduler-table timetable-grid">
          <thead>
            <tr>
              <th className="sticky-corner glass-header">שעות / ימים</th>
              {DAYS.map(day => (
                <th key={day} className="class-header sticky-top glass-header">
                  {day}'
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => {
              const breaksAfter = BREAKS.filter(b => b.afterHour === hour);
              
              return (
              <React.Fragment key={hour}>
                <tr>
                  <th className="subject-header sticky-right" style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>שעה {hour}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{HOUR_TIMES[hour]}</div>
                  </th>
                  {DAYS.map(day => {
                    const assignment = state.timetableAssignments?.find(
                      a => a.classId === selectedClass && a.day === day && a.hour === hour
                    );
                    const teacher = assignment ? state.teachers.find(t => t.id === assignment.teacherId) : null;
                    
                    return (
                      <td 
                        key={day} 
                        className={`grid-cell ${!isManager ? 'read-only' : ''}`}
                        onClick={() => isManager && setEditingSlot({ day, hour })}
                      >
                        {assignment ? (
                          <div className="assignment-badge" style={{ flexDirection: 'column' }}>
                            <span className="subject-title" style={{ fontWeight: 'bold' }}>{assignment.subjectId}</span>
                            <span className="teacher-name" style={{ fontSize: '0.8rem' }}>{teacher?.name || 'M'}</span>
                          </div>
                        ) : (
                          <div className="empty-cell-indicator" style={{ display: isManager ? 'block' : 'none' }}>+</div>
                        )}
                      </td>
                    )
                  })}
                </tr>

                {breaksAfter.map((b, idx) => (
                  <tr key={`break-${hour}-${idx}`} className="break-row">
                    <th className="subject-header sticky-right" style={{ background: '#fef3c7', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#b45309' }}>{b.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#d97706' }}>{b.time}</div>
                    </th>
                    <td colSpan={DAYS.length} style={{ background: '#fef3c7', textAlign: 'center', color: '#b45309', fontWeight: 'bold', letterSpacing: '2px' }}>
                      ~ {b.name} ~
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            )})}
          </tbody>
        </table>
      </div>

      {editingSlot && (
        <SlotEditorModal 
          slot={editingSlot} 
          classId={selectedClass}
          onClose={() => setEditingSlot(null)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
};

const SlotEditorModal: React.FC<{
  slot: { day: string, hour: number },
  classId: string,
  onClose: () => void,
  onSave: (teacherId: string, subjectId: string) => void
}> = ({ slot, classId, onClose, onSave }) => {
  const { state, removeTimetableAssignment } = useAppContext();
  
  const existing = state.timetableAssignments?.find(
    a => a.classId === classId && a.day === slot.day && a.hour === slot.hour
  );
  
  const [teacherId, setTeacherId] = useState(existing?.teacherId || '');
  const [subjectId, setSubjectId] = useState(existing?.subjectId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(teacherId, subjectId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>שיבוץ למערכת היומית</h3>
          <p className="modal-subtitle">כיתה {classId} • יום {slot.day} שעה {slot.hour}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>מקצוע:</label>
            <select 
              value={subjectId} 
              onChange={e => setSubjectId(e.target.value)} 
              required
            >
              <option value="" disabled>-- רשימת מקצועות --</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>מורה:</label>
            <select 
              value={teacherId} 
              onChange={e => setTeacherId(e.target.value)} 
              required
            >
              <option value="" disabled>-- רשימת מורים --</option>
              {state.teachers.map(t => {
                  const isDayOff = t.dayOff === slot.day;
                  return (
                    <option key={t.id} value={t.id} className={isDayOff ? 'error-text' : ''}>
                        {t.name} {isDayOff ? '(יום חופשי!)' : ''}
                    </option>
                  );
              })}
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={!teacherId || !subjectId}>שמור משבצת</button>
            {existing && (
              <button 
                type="button" 
                className="btn-danger-outline" 
                onClick={() => { removeTimetableAssignment(classId, slot.day, slot.hour); onClose(); }}
              >
                ניקוי משבצת
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};
