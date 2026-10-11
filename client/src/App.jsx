import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Profile from './pages/student/Profile';

// TODO(M1): wrap student routes in <ProtectedRoute allowedRoles={['STUDENT']}> once auth lands.
export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/student/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/student/profile" replace />} />
    </Routes>
  );
}
