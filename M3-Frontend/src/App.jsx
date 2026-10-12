import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './adapters/authAdapter.js';
import AppShell from './components/AppShell.jsx';
import TokenSetup from './components/TokenSetup.jsx';
import CompanyProfile from './pages/CompanyProfile.jsx';
import DriveFormPage from './pages/DriveFormPage.jsx';
import DrivesPage from './pages/DrivesPage.jsx';
import RecruiterDashboard from './pages/RecruiterDashboard.jsx';

export default function App() {
  if (!getToken()) return <TokenSetup />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
        <Route path="/recruiter" element={<Navigate to="/recruiter/dashboard" replace />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter/company" element={<CompanyProfile />} />
        <Route path="/recruiter/drives" element={<DrivesPage />} />
        <Route path="/recruiter/drives/new" element={<DriveFormPage />} />
        <Route path="/recruiter/drives/:driveId/edit" element={<DriveFormPage />} />
        <Route path="*" element={<Navigate to="/recruiter/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
