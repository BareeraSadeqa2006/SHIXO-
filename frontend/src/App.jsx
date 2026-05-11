import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import MEODashboard from './pages/MEODashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('shixo_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('shixo_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('shixo_user');
    }
  }, [user]);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('shixo_user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/teacher/*"
          element={
            user && user.role === 'teacher'
              ? <TeacherDashboard user={user} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/meo/*"
          element={
            user && user.role === 'meo'
              ? <MEODashboard user={user} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
