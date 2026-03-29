
import { TeacherPanel } from './components/TeacherPanel';
import { SchedulerGrid } from './components/SchedulerGrid';
import { useAppContext } from './store';

function App() {
  const { hasLocalData, importLocalData } = useAppContext();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">📅</div>
          <h1>מערכת שיבוצים למנהלת</h1>
        </div>
        {hasLocalData && (
          <button className="btn-import-local" onClick={importLocalData} title="יובא נתונים שמורים מהמחשב הזה לענן">
            ☁️ ייבא נתונים מקומיים לענן
          </button>
        )}
      </header>
      <main className="main-content">
        <SchedulerGrid />
        <TeacherPanel />
      </main>
    </div>
  );
}

export default App;
