import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

export type Teacher = {
  id: string;
  name: string;
  maxHours: number;
  dayOff?: string; // Legacy
  daysOff?: string[];
  tutoringHours?: number;
};

export type Assignment = {
  classId: string;
  subjectId: string;
  teacherId: string;
  hours: number;
};

export type TimetableAssignment = {
  classId: string;
  day: string;
  hour: number;
  teacherId: string;
  subjectId: string;
};

type AppState = {
  teachers: Teacher[];
  assignments: Assignment[];
  timetableAssignments: TimetableAssignment[];
  homeroomTeachers: Record<string, string>;
};

type AppContextType = {
  state: AppState;
  currentUser: User | null;
  isManager: boolean;
  addTeacher: (name: string, maxHours: number) => void;
  removeTeacher: (id: string) => void;
  setAssignment: (classId: string, subjectId: string, teacherId: string, hours: number) => void;
  removeAssignment: (classId: string, subjectId: string) => void;
  setTimetableAssignment: (classId: string, day: string, hour: number, teacherId: string, subjectId: string) => void;
  removeTimetableAssignment: (classId: string, day: string, hour: number) => void;
  updateTeacher: (teacherId: string, updates: Partial<Teacher>) => void;
  getTeacherTotalHours: (teacherId: string) => number;
  setHomeroomTeacher: (classId: string, teacherId: string) => void;
  exportData: () => void;
  importFromFile: (file: File) => Promise<void>;
  logout: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const MAIN_DOC_ID = 'main_schedule';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({ teachers: [], assignments: [], timetableAssignments: [], homeroomTeachers: {} });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => setCurrentUser(user));
    return () => unsubAuth();
  }, []);

  const isManager = currentUser !== null;
  const logout = () => signOut(auth);

  useEffect(() => {
    const autoBackup = (data: AppState) => {
      const today = new Date().toISOString().slice(0, 10);
      const lastBackup = localStorage.getItem('school_scheduler_last_auto_backup');
      if (lastBackup !== today && ((data.teachers && data.teachers.length > 0) || (data.assignments && data.assignments.length > 0))) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school-scheduler-auto-backup-${today}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        localStorage.setItem('school_scheduler_last_auto_backup', today);
      }
    };

    const docRef = doc(db, 'scheduler_data', MAIN_DOC_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppState;
        setState({
          teachers: data.teachers || [],
          assignments: data.assignments || [],
          timetableAssignments: data.timetableAssignments || [],
          homeroomTeachers: data.homeroomTeachers || {}
        });
        autoBackup(data);
      } else {
        // Document missing, define initial structure
        setDoc(docRef, { teachers: [], assignments: [], timetableAssignments: [], homeroomTeachers: {} }).catch((e: any) => console.error("Init error:", e));
      }
    });
    return () => unsubscribe();
  }, []);

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
      teachers: [...prev.teachers, { id: Date.now().toString(), name, maxHours, tutoringHours: 3 }]
    }));
  };

  const removeTeacher = (id: string) => {
    updateRemote(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => t.id !== id),
      assignments: prev.assignments.filter(a => a.teacherId !== id),
      timetableAssignments: (prev.timetableAssignments || []).filter(a => a.teacherId !== id)
    }));
  };

  const updateTeacher = (teacherId: string, updates: Partial<Teacher>) => {
    updateRemote(prev => ({
      ...prev,
      teachers: prev.teachers.map(t => t.id === teacherId ? { ...t, ...updates } : t)
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

  const setTimetableAssignment = (classId: string, day: string, hour: number, teacherId: string, subjectId: string) => {
    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const teacherDaysOff = teacher.daysOff || (teacher.dayOff ? [teacher.dayOff] : []);

    if (teacherDaysOff.includes(day)) {
      const availableTeachers = state.teachers
        .filter(t => {
           const dOffs = t.daysOff || (t.dayOff ? [t.dayOff] : []);
           return !dOffs.includes(day) && t.id !== teacherId;
        })
        .map(t => t.name)
        .join(', ');
      alert(`שגיאה: יום ${day} הוא יום חופשי של ${teacher.name}!\n\nמורים מומלצים ליום זה:\n${availableTeachers || 'אין מורים אחרים'}`);
      return;
    }

    const overlap = state.timetableAssignments?.find(
      a => a.day === day && a.hour === hour && a.teacherId === teacherId && a.classId !== classId
    );
    if (overlap) {
      alert(`שגיאה: שיבוץ כפול! המורה ${teacher.name} כבר משובץ/ת ביום ${day} שעה ${hour} בכיתה ${overlap.classId} (${overlap.subjectId})`);
      return;
    }

    updateRemote(prev => {
      const newTimetable = (prev.timetableAssignments || []).filter(
        a => !(a.classId === classId && a.day === day && a.hour === hour)
      );
      return { ...prev, timetableAssignments: [...newTimetable, { classId, day, hour, teacherId, subjectId }] };
    });
  };

  const removeTimetableAssignment = (classId: string, day: string, hour: number) => {
    updateRemote(prev => ({
      ...prev,
      timetableAssignments: (prev.timetableAssignments || []).filter(
        a => !(a.classId === classId && a.day === day && a.hour === hour)
      )
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
    <AppContext.Provider value={{ state, currentUser, isManager, addTeacher, removeTeacher, setAssignment, removeAssignment, setTimetableAssignment, removeTimetableAssignment, updateTeacher, getTeacherTotalHours, setHomeroomTeacher, exportData, importFromFile, logout }}>
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
