import React from 'react';
import { Teacher, useAppContext } from '../store';

type Props = {
  teacher: Teacher;
  onClose: () => void;
};

export const TeacherScheduleModal: React.FC<Props> = ({ teacher, onClose }) => {
  const { state } = useAppContext();

  const assignments = state.assignments.filter(a => a.teacherId === teacher.id);

  const homeroomClasses = Object.entries(state.homeroomTeachers)
    .filter(([, tid]) => tid === teacher.id)
    .map(([classId]) => classId);

  const totalHours = assignments.reduce((sum, a) => sum + a.hours, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content schedule-modal" onClick={e => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <div>
            <h2 className="schedule-modal-title">מערכת שעות</h2>
            <p className="modal-subtitle">{teacher.name}</p>
          </div>
          <button className="btn-icon schedule-close-btn" onClick={onClose} title="סגור">✕</button>
        </div>

        {homeroomClasses.length > 0 && (
          <div className="homeroom-banner">
            <span className="homeroom-banner-label">מחנכת של:</span>
            {homeroomClasses.map(c => (
              <span key={c} className="homeroom-badge">{c}</span>
            ))}
          </div>
        )}

        {assignments.length === 0 ? (
          <p className="empty-state" style={{ marginTop: '1.5rem' }}>אין שיבוצים למורה זו.</p>
        ) : (
          <table className="schedule-table">
            <thead>
              <tr>
                <th>כיתה</th>
                <th>מקצוע</th>
                <th>שעות שבועיות</th>
              </tr>
            </thead>
            <tbody>
              {assignments
                .sort((a, b) => a.classId.localeCompare(b.classId, 'he'))
                .map((a, i) => (
                  <tr key={i}>
                    <td className="schedule-class-cell">{a.classId}</td>
                    <td>{a.subjectId}</td>
                    <td className="schedule-hours-cell">{a.hours}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="schedule-total-row">
                <td colSpan={2}>סה"כ שעות</td>
                <td className="schedule-hours-cell">
                  <span className={`totals-badge ${totalHours > teacher.maxHours ? 'over-limit-badge' : ''}`}>
                    {totalHours} / {teacher.maxHours}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};
