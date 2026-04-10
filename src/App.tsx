
import React, { useRef, useState } from 'react';
import { TeacherPanel } from './components/TeacherPanel';
import { SchedulerGrid } from './components/SchedulerGrid';
import { useAppContext } from './store';
import { LoginModal } from './components/LoginModal';

function App() {
  const { isManager, currentUser, logout, exportData, importFromFile } = useAppContext();
  const [showLogin, setShowLogin] = useState(false);
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
        <div className="header-actions">
          {isManager ? (
            <>
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
        <SchedulerGrid />
        <TeacherPanel />
      </main>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

export default App;
