import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { DrivesBrowserPage } from './pages/DrivesBrowserPage.jsx';
import { DriveDetailPage } from './pages/DriveDetailPage.jsx';
import { useStudent } from './context/StudentContext.jsx';

// Placeholders for related slices (M2, M5)
const ProfilePagePlaceholder = () => {
  const { student } = useStudent();
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto text-xl font-bold">
        {student?.name ? student.name[0] : 'S'}
      </div>
      <h2 className="text-xl font-bold text-white">Student Academic Profile</h2>
      <p className="text-xs text-slate-400">
        Member 2 (M2) owns the full profile editor and resume PDF upload.
      </p>
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2 text-slate-300">
        <div><strong>Name:</strong> {student?.name}</div>
        <div><strong>Roll Number:</strong> {student?.rollNumber}</div>
        <div><strong>Branch:</strong> {student?.branch}</div>
        <div><strong>CGPA:</strong> {student?.cgpa} / 10.0</div>
        <div><strong>Active Backlogs:</strong> {student?.activeBacklogs}</div>
        <div><strong>Resume URL:</strong> {student?.resumeUrl || 'Not provided'}</div>
      </div>
    </div>
  );
};

const ApplicationsPagePlaceholder = () => {
  const { appliedDriveIds } = useStudent();
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
      <h2 className="text-xl font-bold text-white">My Submitted Applications</h2>
      <p className="text-xs text-slate-400">
        Member 5 (M5) owns the application pipeline, recruiter review, and Jitsi interview integration.
      </p>
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
        You have currently submitted applications for <strong className="text-indigo-400 font-bold">{appliedDriveIds.size}</strong> campus placement drives.
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Routes>
          <Route index element={<Navigate to="/student/drives" replace />} />
          <Route path="/student" element={<Navigate to="/student/drives" replace />} />
          <Route path="/student/drives" element={<DrivesBrowserPage />} />
          <Route path="/student/drives/:driveId" element={<DriveDetailPage />} />
          <Route path="/student/profile" element={<ProfilePagePlaceholder />} />
          <Route path="/student/applications" element={<ApplicationsPagePlaceholder />} />
          <Route path="*" element={<Navigate to="/student/drives" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
