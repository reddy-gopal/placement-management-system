import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ROLE_HOME, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

import StudentDashboard from './pages/student/Dashboard';
import StudentDrives from './pages/student/Drives';
import StudentDriveDetail from './pages/student/DriveDetail';
import StudentApplications from './pages/student/Applications';
import Profile from './pages/student/Profile';

import RecruiterDashboard from './pages/recruiter/Dashboard';
import RecruiterDrives from './pages/recruiter/Drives';
import RecruiterDriveForm from './pages/recruiter/DriveForm';
import RecruiterApplications from './pages/recruiter/Applications';
import CompanyProfile from './pages/recruiter/CompanyProfile';

import AdminOverview from './pages/admin/Overview';
import AdminStudents from './pages/admin/Students';
import AdminCompaniesDrives from './pages/admin/CompaniesDrives';
import AdminReports from './pages/admin/Reports';

/** "/" and unknown URLs: send signed-in users to their portal, everyone else to sign in. */
function HomeRedirect() {
  const { user, status } = useAuth();
  if (status === 'loading') return null;
  return <Navigate to={user ? (ROLE_HOME[user.role] ?? '/login') : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/verify" element={<AuthPage mode="verify" />} />

      <Route element={<ProtectedRoute roles={['STUDENT']} />}>
        <Route path="/student" element={<DashboardLayout role="STUDENT" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="drives" element={<StudentDrives />} />
          <Route path="drives/:driveId" element={<StudentDriveDetail />} />
          <Route path="applications" element={<StudentApplications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['RECRUITER']} />}>
        <Route path="/recruiter" element={<DashboardLayout role="RECRUITER" />}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="drives" element={<RecruiterDrives />} />
          <Route path="drives/new" element={<RecruiterDriveForm />} />
          <Route path="drives/:driveId/edit" element={<RecruiterDriveForm />} />
          <Route path="applications" element={<RecruiterApplications />} />
          <Route path="company" element={<CompanyProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<DashboardLayout role="ADMIN" />}>
          <Route index element={<AdminOverview />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="companies" element={<AdminCompaniesDrives />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
