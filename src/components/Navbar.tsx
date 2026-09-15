import React from 'react';
import { AuthUser } from '../types';
import { BookOpen, LogOut, Sparkles } from 'lucide-react';

interface NavbarProps {
  user: AuthUser | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab(user?.role === 'admin' ? 'stats' : 'home')}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-400 to-purple-400 p-0.5 shadow-md shadow-rose-200">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-rose-500">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-700 via-pink-700 to-purple-800 bg-clip-text text-transparent font-['Playfair_Display',serif]">
                  HỌC GIỎI VĂN CÙNG CÔ YẾN THANH
                </span>
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300 hidden sm:inline" />
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Khơi nguồn cảm hứng • Vững vàng tri thức Ngữ văn
              </p>
            </div>
          </div>

          {/* User Info & Actions */}
          {user && (
            <div className="flex items-center gap-3">
              {user.role === 'admin' ? (
                <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 shadow-xs">
                  <span className="text-lg">👩‍🏫</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-rose-900 leading-none">Cô Yến Thanh</p>
                    <p className="text-[10px] text-rose-600 font-medium leading-tight">Giáo viên quản trị</p>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-800 shadow-xs">
                  <span className="text-lg">👨‍🎓</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-purple-900 leading-none">{user.name}</p>
                    <p className="text-[10px] text-purple-600 font-medium leading-tight">
                      Lớp {user.classRoom || 'Học sinh'}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                title="Đăng xuất tài khoản"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
