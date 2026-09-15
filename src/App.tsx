import React, { useState, useEffect } from 'react';
import { AuthUser } from './types';
import { apiAuth } from './lib/api';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';

function MainApp() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const localUser = apiAuth.getCurrentUser();
        if (localUser) {
          // Verify with server
          const me = await apiAuth.getMe();
          setCurrentUser(me);
          if (me.role === 'student') {
            setActiveTab('home');
          } else {
            setActiveTab('stats');
          }
        }
      } catch (err) {
        apiAuth.logout();
        setCurrentUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'student') {
      setActiveTab('home');
    } else {
      setActiveTab('stats');
    }
  };

  const handleLogout = () => {
    apiAuth.logout();
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Đang khởi động lớp học...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8fc]">
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {currentUser.role === 'admin' ? (
          <TeacherDashboard
            user={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ) : (
          <StudentDashboard
            user={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-700 font-['Playfair_Display',serif]">
            Học Giỏi Văn Cùng Cô Yến Thanh
          </p>
          <p className="text-[11px] text-slate-400">
            Nền tảng học tập, giao bài và bồi dưỡng tình yêu văn chương dành cho học sinh
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
