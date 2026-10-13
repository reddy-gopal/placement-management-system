import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredToken, setStoredToken, clearStoredToken } from '../api/apiClient.js';
import { fetchStudentProfile, fetchCurrentUser } from '../api/studentApi.js';
import { fetchMyApplications } from '../api/driveApi.js';

export const STUDENT_PRESETS = [
  {
    id: 'preset-cse-topper',
    name: 'Aditya Sharma',
    rollNumber: '21CS101',
    branch: 'CSE',
    cgpa: 8.8,
    activeBacklogs: 0,
    graduationYear: 2026,
    skills: ['DSA', 'Python', 'React', 'Cloud Services', 'System Design'],
    resumeUrl: 'https://nexstep.edu/resumes/aditya-sharma.pdf',
    tag: 'High CGPA / Zero Backlogs',
    tagColor: 'emerald',
  },
  {
    id: 'preset-ece-borderline',
    name: 'Sneha Patel',
    rollNumber: '21EC204',
    branch: 'ECE',
    cgpa: 7.2,
    activeBacklogs: 1,
    graduationYear: 2026,
    skills: ['Embedded C', 'MATLAB', 'IoT', 'Microcontrollers', 'Python'],
    resumeUrl: 'https://nexstep.edu/resumes/sneha-patel.pdf',
    tag: 'ECE / 1 Active Backlog',
    tagColor: 'amber',
  },
  {
    id: 'preset-mech-core',
    name: 'Rahul Verma',
    rollNumber: '21ME315',
    branch: 'MECH',
    cgpa: 6.8,
    activeBacklogs: 0,
    graduationYear: 2026,
    skills: ['AutoCAD', 'SolidWorks', 'ANSYS', 'Industrial IoT'],
    resumeUrl: 'https://nexstep.edu/resumes/rahul-verma.pdf',
    tag: 'MECH / Non-Circuit Branch',
    tagColor: 'indigo',
  },
  {
    id: 'preset-low-cgpa',
    name: 'Karan Mehra',
    rollNumber: '21IT402',
    branch: 'IT',
    cgpa: 5.8,
    activeBacklogs: 2,
    graduationYear: 2026,
    skills: ['HTML', 'CSS', 'JavaScript', 'Basic SQL'],
    resumeUrl: 'https://nexstep.edu/resumes/karan-mehra.pdf',
    tag: 'CGPA < 6.0 / Multiple Backlogs',
    tagColor: 'rose',
  },
];

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getStoredToken());
  const [activePresetId, setActivePresetId] = useState('preset-cse-topper');
  const [customStudent, setCustomStudent] = useState(STUDENT_PRESETS[0]);
  const [liveProfile, setLiveProfile] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [appliedDriveIds, setAppliedDriveIds] = useState(new Set());

  // Attempt to load live profile if token exists
  useEffect(() => {
    if (!token) {
      setIsLiveMode(false);
      setLiveProfile(null);
      return;
    }

    let isMounted = true;
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setApiError(null);
      try {
        const [profileRes, userRes] = await Promise.all([
          fetchStudentProfile().catch(() => null),
          fetchCurrentUser().catch(() => null),
        ]);

        if (!isMounted) return;

        if (profileRes?.profile) {
          const combined = {
            ...profileRes.profile,
            name: userRes?.user?.name || 'Student',
            email: userRes?.user?.email || '',
          };
          setLiveProfile(combined);
          setIsLiveMode(true);
        } else if (userRes?.user) {
          // Profile not filled yet in backend
          setLiveProfile({
            name: userRes.user.name,
            email: userRes.user.email,
            cgpa: 0,
            activeBacklogs: 0,
            branch: 'CSE',
          });
          setIsLiveMode(true);
        }

        // Fetch applications to mark applied drives
        const appsRes = await fetchMyApplications().catch(() => null);
        if (appsRes?.applications && Array.isArray(appsRes.applications)) {
          const applied = new Set(
            appsRes.applications.map((app) => (typeof app.driveId === 'object' ? app.driveId._id : app.driveId))
          );
          setAppliedDriveIds(applied);
        }
      } catch (err) {
        if (isMounted) {
          setApiError(err.message);
          setIsLiveMode(false);
        }
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Determine current active student:
  const currentStudent = isLiveMode && liveProfile ? liveProfile : customStudent;

  const selectPreset = (presetId) => {
    const found = STUDENT_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setActivePresetId(presetId);
      setCustomStudent({ ...found });
      setIsLiveMode(false);
    }
  };

  const updateCustomStudent = (updates) => {
    setActivePresetId('custom');
    setCustomStudent((prev) => ({
      ...prev,
      ...updates,
    }));
    setIsLiveMode(false);
  };

  const loginWithToken = (newToken) => {
    setStoredToken(newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    clearStoredToken();
    setTokenState(null);
    setLiveProfile(null);
    setIsLiveMode(false);
  };

  const recordApplication = (driveId) => {
    setAppliedDriveIds((prev) => new Set([...prev, driveId]));
  };

  return (
    <StudentContext.Provider
      value={{
        student: currentStudent,
        isLiveMode,
        liveProfile,
        activePresetId,
        presets: STUDENT_PRESETS,
        selectPreset,
        updateCustomStudent,
        token,
        loginWithToken,
        logout,
        isLoadingProfile,
        apiError,
        appliedDriveIds,
        recordApplication,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);
