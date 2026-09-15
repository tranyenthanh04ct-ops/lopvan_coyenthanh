import React, { useState } from 'react';
import { UserRole, AuthUser } from '../types';
import { apiAuth } from '../lib/api';
import { useToast } from './Toast';
import { BookOpen, KeyRound, User, Lock, Eye, EyeOff, Sparkles, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { error, success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole === 'admin' && !password.trim()) {
      error('Vui lòng nhập mật khẩu Quản trị');
      return;
    }
    if (activeRole === 'student' && (!username.trim() || !password.trim())) {
      error('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const user = await apiAuth.login({
        role: activeRole,
        username: activeRole === 'student' ? username.trim() : undefined,
        password: password.trim(),
      });
      success(`Đăng nhập thành công! Chào mừng ${user.name}`);
      onLoginSuccess(user);
    } catch (err: any) {
      error(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-rose-50/70 via-purple-50/50 to-sky-50/60">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-400 via-pink-400 to-purple-400 shadow-xl shadow-rose-200/60 p-1 mb-4">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-rose-500">
              <BookOpen className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-['Playfair_Display',serif]">
            HỌC GIỎI VĂN CÙNG CÔ YẾN THANH
          </h1>
          <p className="text-sm text-slate-600 mt-2 font-medium flex items-center justify-center gap-1.5">
            <span>Không gian học văn trực tuyến thân thiện & chất lượng</span>
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300" />
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-rose-100/70 border border-rose-100/80 p-6 sm:p-8">
          {/* Role Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-rose-50/80 rounded-2xl mb-6 border border-rose-100">
            <button
              type="button"
              onClick={() => {
                setActiveRole('student');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeRole === 'student'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>👨‍🎓 Học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('admin');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeRole === 'admin'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>👩‍🏫 Giáo viên</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeRole === 'student' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Tên tài khoản học sinh
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Ví dụ: nam.9a1"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Mật khẩu học sinh
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu do Cô cấp"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Mật khẩu Giáo viên (Admin)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                activeRole === 'student'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-200'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{activeRole === 'student' ? 'Vào góc học tập' : 'Đăng nhập Quản trị'}</span>
              )}
            </button>
          </form>

          {/* Student Help Note */}
          {activeRole === 'student' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                🌸 Học sinh được Cô Yến Thanh cấp tài khoản và mật khẩu trực tiếp. Nếu quên mật khẩu, em vui lòng báo Cô để được cấp lại nhé!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
