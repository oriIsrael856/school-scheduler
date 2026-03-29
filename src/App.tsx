
import React, { useRef } from 'react';
import { TeacherPanel } from './components/TeacherPanel';
import { SchedulerGrid } from './components/SchedulerGrid';
import { useAppContext } from './store';

function App() {
  const { hasLocalData, importLocalData, exportData, importFromFile } = useAppContext();
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
          {hasLocalData && (
            <button className="btn-import-local" onClick={importLocalData} title="ייבא נתונים שמורים מהמחשב הזה לענן">
              ☁️ ייבא נתונים מקומיים לענן
            </button>
          )}
          <button className="btn-export" onClick={exportData} title="הורד את כל הנתונים כקובץ JSON">
            ⬇️ ייצא גיבוי
          </button>
          <button className="btn-import-file" onClick={() => fileInputRef.current?.click()} title="טען נתונים מקובץ JSON">
            ⬆️ ייבא מקובץ
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </header>
      <main className="main-content">
        <SchedulerGrid />
        <TeacherPanel />
      </main>
    </div>
  );
}

export default App;
