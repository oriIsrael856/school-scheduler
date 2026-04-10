
import React, { useRef, useState } from 'react';
import { TeacherPanel } from './components/TeacherPanel';
import { SchedulerGrid } from './components/SchedulerGrid';
import { TimetableGrid } from './components/TimetableGrid';
import { ConstraintsManagerModal } from './components/ConstraintsManagerModal';
import { useAppContext } from './store';
import { LoginModal } from './components/LoginModal';

function App() {
  const { state, isManager, currentUser, logout, exportData, importFromFile } = useAppContext();
  const [showLogin, setShowLogin] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);
  const [activeTab, setActiveTab] = useState<'allocations' | 'timetable'>('timetable');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importFromFile(file);
    e.target.value = '';
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">📅</div>
          <h1>מערכת שיבוצים למנהלת</h1>
        </div>
        <div className="view-tabs" style={{ display: 'flex', gap: '1rem', marginRight: '2rem' }}>
          <button 
            className={`btn-tab ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
            style={{ fontWeight: activeTab === 'timetable' ? 'bold' : 'normal', background: activeTab === 'timetable' ? 'var(--primary-light)' : 'transparent', color: activeTab === 'timetable' ? 'var(--primary)' : 'var(--text-main)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            מערכת שעות שבועית
          </button>
          <button 
            className={`btn-tab ${activeTab === 'allocations' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocations')}
            style={{ fontWeight: activeTab === 'allocations' ? 'bold' : 'normal', background: activeTab === 'allocations' ? 'var(--primary-light)' : 'transparent', color: activeTab === 'allocations' ? 'var(--primary)' : 'var(--text-main)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            תכנון הקצאות צבירה
          </button>
        </div>
        <div className="header-actions">
          {isManager ? (
            <>
              <button 
                className="btn-secondary" 
                onClick={() => setShowConstraints(true)}
                style={{ position: 'relative' }}
              >
                אילוצים
                {((state.constraints?.filter(c => c.status === 'pending').length) || 0) > 0 && (
                   <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                     {state.constraints?.filter(c => c.status === 'pending').length}
                   </span>
                )}
              </button>
              <button className="btn-secondary" onClick={logout} title={currentUser?.email || ''}>
                התנתק (מנהל)
              </button>
              <button className="btn-export" onClick={exportData} title="הורד את כל הנתונים כקובץ JSON">
                ⬇️ ייצא גיבוי
              </button>
              <button className="btn-import-file" onClick={() => fileInputRef.current?.click()} title="טען נתונים מקובץ JSON">
                ⬆️ ייבא מקובץ
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setShowLogin(true)}>
              🔒 כניסת מנהלים
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </header>
      <main className="main-content">
        {activeTab === 'allocations' ? <SchedulerGrid /> : <TimetableGrid />}
        <TeacherPanel />
      </main>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showConstraints && <ConstraintsManagerModal onClose={() => setShowConstraints(false)} />}
    </div>
  );
}

export default App;
