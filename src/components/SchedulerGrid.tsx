import React, { useState } from 'react';
import { useAppContext } from '../store';
import { CLASSES, SUBJECTS } from '../constants';

type EditingCell = {
  classId: string;
  subjectId: string;
} | null;

export const SchedulerGrid: React.FC = () => {
  const { state, setAssignment, removeAssignment, setHomeroomTeacher, isManager } = useAppContext();
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Extract unique grades (א, ב, ג, etc.)
  const grades = Array.from(new Set(CLASSES.map(c => c.charAt(0))));
  
  const filteredClasses = selectedGrade === 'all' 
    ? CLASSES 
    : CLASSES.filter(c => c.startsWith(selectedGrade));

  const handleSaveAssignment = (teacherId: string, hours: number) => {
    if (editingCell) {
      if (teacherId) {
        setAssignment(editingCell.classId, editingCell.subjectId, teacherId, hours);
      } else {
        removeAssignment(editingCell.classId, editingCell.subjectId);
      }
    }
    setEditingCell(null);
  };

  return (
    <div className="scheduler-container">
      <div className="scheduler-toolbar">
        <label htmlFor="grade-filter" className="filter-label">סנן לפי שכבה:</label>
        <select 
          id="grade-filter"
          className="grade-select"
          value={selectedGrade} 
          onChange={e => setSelectedGrade(e.target.value)}
        >
          <option value="all">כל השכבות</option>
          {grades.map(g => <option key={g} value={g}>שכבה {g}'</option>)}
        </select>
      </div>

      <div className="table-wrapper glass-panel">
        <table className="scheduler-table">
          <thead>
            <tr>
              <th className="sticky-corner glass-header">מקצוע / כיתה</th>
              {filteredClasses.map(cls => (
                <th key={cls} className="class-header sticky-top glass-header">
                  <div className="class-title">כיתה {cls}</div>
                  <div className="homeroom-wrapper">
                    <select 
                      className="homeroom-select"
                      disabled={!isManager}
                      value={state.homeroomTeachers?.[cls] || ''}
                      onChange={e => setHomeroomTeacher(cls, e.target.value)}
                    >
                      <option value="">מחנכת...</option>
                      {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map(subject => (
              <tr key={subject}>
                <th className="subject-header sticky-right">{subject}</th>
                {filteredClasses.map(cls => {
                  const assignment = state.assignments.find(a => a.classId === cls && a.subjectId === subject);
                  const teacher = assignment ? state.teachers.find(t => t.id === assignment.teacherId) : null;
                  
                  return (
                    <td 
                      key={cls} 
                      className={`grid-cell ${!isManager ? 'read-only' : ''}`}
                      onClick={() => isManager && setEditingCell({classId: cls, subjectId: subject})}
                    >
                      {teacher ? (
                        <div className="assignment-badge">
                          <span className="teacher-name">{teacher.name}</span>
                          <span className="hours-badge">{assignment!.hours} ש׳</span>
                        </div>
                      ) : (
                        <div className="empty-cell-indicator">+</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="totals-row">
              <th className="sticky-right totals-header">סה״כ שעות לכיתה</th>
              {filteredClasses.map(cls => {
                const totalClassHours = state.assignments
                  .filter(a => a.classId === cls)
                  .reduce((sum, a) => sum + a.hours, 0);
                return (
                  <td key={cls} className="totals-cell">
                    <span className="totals-badge">{totalClassHours} ש׳</span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {editingCell && (
        <CellEditorModal 
          cell={editingCell} 
          onClose={() => setEditingCell(null)} 
          onSave={handleSaveAssignment} 
        />
      )}
    </div>
  );
};

const CellEditorModal: React.FC<{
  cell: {classId: string, subjectId: string},
  onClose: () => void,
  onSave: (teacherId: string, hours: number) => void
}> = ({ cell, onClose, onSave }) => {
  const { state, removeAssignment } = useAppContext();
  
  const existing = state.assignments.find(a => a.classId === cell.classId && a.subjectId === cell.subjectId);
  
  const [teacherId, setTeacherId] = useState(existing?.teacherId || '');
  const [hours, setHours] = useState(existing?.hours || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(teacherId, hours);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>שיבוץ מורה</h3>
          <p className="modal-subtitle">כיתה {cell.classId} • {cell.subjectId}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>בחר מורה (מתוך המאגר):</label>
            <select 
              value={teacherId} 
              onChange={e => setTeacherId(e.target.value)} 
              required
              className="teacher-select"
            >
              <option value="" disabled>-- רשימת מורים --</option>
              {state.teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {state.teachers.length === 0 && (
              <span className="form-hint error-text">יש להוסיף מורים למאגר תחילה.</span>
            )}
          </div>

          <div className="form-group">
            <label>שעות שבועיות בכיתה זו:</label>
            <input 
              type="number" 
              min="1" 
              max="26" 
              value={hours} 
              onChange={e => setHours(Number(e.target.value))}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={!teacherId}>
              שמור שיבוץ
            </button>
            {existing && (
              <button 
                type="button" 
                className="btn-danger-outline" 
                onClick={() => { removeAssignment(cell.classId, cell.subjectId); onClose(); }}
              >
                מחק שיבוץ קודם
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
