import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export type Teacher = {
  id: string;
  name: string;
  maxHours: number;
};

export type Assignment = {
  classId: string;
  subjectId: string;
  teacherId: string;
  hours: number;
};

type AppState = {
  teachers: Teacher[];
  assignments: Assignment[];
  homeroomTeachers: Record<string, string>;
};

type AppContextType = {
  state: AppState;
  hasLocalData: boolean;
  addTeacher: (name: string, maxHours: number) => void;
  removeTeacher: (id: string) => void;
  setAssignment: (classId: string, subjectId: string, teacherId: string, hours: number) => void;
  removeAssignment: (classId: string, subjectId: string) => void;
  getTeacherTotalHours: (teacherId: string) => number;
  setHomeroomTeacher: (classId: string, teacherId: string) => void;
  importLocalData: () => Promise<void>;
  exportData: () => void;
  importFromFile: (file: File) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const MAIN_DOC_ID = 'main_schedule';
const LOCAL_STORAGE_KEY = 'school_scheduler_data';

const getLocalData = (): AppState | null => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as AppState;
    if (parsed.teachers?.length > 0 || parsed.assignments?.length > 0) return parsed;
  } catch (e) {}
  return null;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const local = getLocalData();
    return local ?? { teachers: [], assignments: [], homeroomTeachers: {} };
  });
  const [hasLocalData, setHasLocalData] = useState<boolean>(() => getLocalData() !== null);

  useEffect(() => {
    const docRef = doc(db, 'scheduler_data', MAIN_DOC_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppState;
        setState({
          teachers: data.teachers || [],
          assignments: data.assignments || [],
          homeroomTeachers: data.homeroomTeachers || {}
        });
      } else {
        // 🔥 MIGRATION: If Firestore is totally empty, push the local storage data to the cloud!
        setDoc(docRef, state).catch((e: any) => console.error("Migration error:", e));
      }
    });
    return () => unsubscribe();
  }, []); // Only runs once on mount. 'state' here is the initial LocalStorage state

  const updateRemote = async (updateFn: (prev: AppState) => AppState) => {
    setState(prev => {
      const newState = updateFn(prev);
      const docRef = doc(db, 'scheduler_data', MAIN_DOC_ID);
      setDoc(docRef, newState).catch((e: any) => console.error("Firebase save error:", e));
      return newState;
    });
  };

  const addTeacher = (name: string, maxHours: number) => {
    updateRemote(prev => ({
      ...prev,
      teachers: [...prev.teachers, { id: Date.now().toString(), name, maxHours }]
    }));
  };

  const removeTeacher = (id: string) => {
    updateRemote(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => t.id !== id),
      assignments: prev.assignments.filter(a => a.teacherId !== id)
    }));
  };

  const getTeacherTotalHours = (teacherId: string, currentState: AppState = state) => {
    return currentState.assignments
      .filter(a => a.teacherId === teacherId)
      .reduce((sum, a) => sum + a.hours, 0);
  };

  const setAssignment = (classId: string, subjectId: string, teacherId: string, hours: number) => {
    updateRemote(prev => {
      let newAssignments = prev.assignments.filter(a => !(a.classId === classId && a.subjectId === subjectId));
      
      const simulatedState = { ...prev, assignments: [...newAssignments, { classId, subjectId, teacherId, hours }] };
      const totalHours = getTeacherTotalHours(teacherId, simulatedState);
      
      const teacher = prev.teachers.find(t => t.id === teacherId);
      if (teacher && totalHours > teacher.maxHours) {
        alert(`שגיאה: חריגה משעות. למורה ${teacher.name} יש אישור ל-${teacher.maxHours} שעות, אך שיבוץ זה ידרוש ${totalHours} שעות.`);
        return prev;
      }
      return simulatedState;
    });
  };

  const removeAssignment = (classId: string, subjectId: string) => {
    updateRemote(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => !(a.classId === classId && a.subjectId === subjectId))
    }));
  };

  const setHomeroomTeacher = (classId: string, teacherId: string) => {
    updateRemote(prev => ({
      ...prev,
      homeroomTeachers: {
        ...(prev.homeroomTeachers || {}),
        [classId]: teacherId
      }
    }));
  };

  const importLocalData = async () => {
    const local = getLocalData();
    if (!local) {
      alert('לא נמצאו נתונים מקומיים לייבוא.');
      return;
    }
    const teacherCount = local.teachers?.length ?? 0;
    const assignmentCount = local.assignments?.length ?? 0;
    const confirmed = window.confirm(
      `נמצאו נתונים מקומיים:\n• ${teacherCount} מורות\n• ${assignmentCount} שיבוצים\n\nהייבוא יחליף את כל הנתונים הנוכחיים בענן.\nלהמשיך?`
    );
    if (!confirmed) return;
    const docRef = doc(db, 'scheduler_data', MAIN_DOC_ID);
    await setDoc(docRef, local);
    setHasLocalData(false);
    alert('הנתונים יובאו לענן בהצלחה!');
  };

  const exportData = () => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-scheduler-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppState;
      if (!Array.isArray(parsed.teachers) || !Array.isArray(parsed.assignments)) {
        alert('הקובץ אינו תקין.');
        return;
      }
      const teacherCount = parsed.teachers.length;
      const assignmentCount = parsed.assignments.length;
      const confirmed = window.confirm(
        `הקובץ מכיל:\n• ${teacherCount} מורות\n• ${assignmentCount} שיבוצים\n\nהייבוא יחליף את כל הנתונים הנוכחיים בענן.\nלהמשיך?`
      );
      if (!confirmed) return;
      const docRef = doc(db, 'scheduler_data', MAIN_DOC_ID);
      await setDoc(docRef, parsed);
      alert('הנתונים יובאו בהצלחה!');
    } catch {
      alert('שגיאה בקריאת הקובץ. ודא שמדובר בקובץ JSON תקין.');
    }
  };

  return (
    <AppContext.Provider value={{ state, hasLocalData, addTeacher, removeTeacher, setAssignment, removeAssignment, getTeacherTotalHours, setHomeroomTeacher, importLocalData, exportData, importFromFile }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
