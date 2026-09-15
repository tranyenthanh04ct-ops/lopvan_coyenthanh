import React, { useState, useEffect } from 'react';
import { UserRole, AuthUser } from '../types';
import { apiAuth, getLastRole, setLastRole } from '../lib/api';
import { useToast } from './Toast';
import {
  BookOpen,
  KeyRound,
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Default to the last used role, or 'admin' for seamless teacher setup
  const [activeRole, setActiveRole] = useState<UserRole>(() => getLastRole() || 'admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const { error, success } = useToast();

  useEffect(() => {
    setLastRole(activeRole);
    setErrorMessage(null);
  }, [activeRole]);

  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    setPassword('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    const cleanPass = password.trim();
    const cleanUser = username.trim();
    let effectiveRole: UserRole = activeRole;

    // Smart detection: if user typed 198086 in password or username
    if (cleanPass === '198086' || cleanUser === '198086' || cleanUser === 'admin' || cleanUser === 'coyenthanh') {
      effectiveRole = 'admin';
      if (activeRole !== 'admin') {
        setActiveRole('admin');
      }
    }

    if (effectiveRole === 'admin' && !cleanPass && cleanUser !== '198086') {
      const msg = 'Vui lòng nhập mật khẩu Quản trị của Cô Yến Thanh';
      setErrorMessage(msg);
      error(msg);
      return;
    }

    if (effectiveRole === 'student' && (!cleanUser || !cleanPass)) {
      const msg = 'Vui lòng nhập đầy đủ Tên tài khoản và Mật khẩu học sinh';
      setErrorMessage(msg);
      error(msg);
      return;
    }

    try {
      setLoading(true);
      const user = await apiAuth.login({
        role: effectiveRole,
        username: effectiveRole === 'student' ? cleanUser : undefined,
        password: cleanPass || (cleanUser === '198086' ? '198086' : ''),
      });

      success(`Đăng nhập thành công! Chào mừng ${user.name}`);
      onLoginSuccess(user);
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin!';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-rose-50/80 via-purple-50/50 to-sky-50/60">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 shadow-xl shadow-rose-200/60 p-1 mb-3">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-rose-500">
              <BookOpen className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-['Playfair_Display',serif]">
            HỌC GIỎI VĂN CÙNG CÔ YẾN THANH
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium flex items-center justify-center gap-1.5">
            <span>Không gian học văn trực tuyến thân thiện & chất lượng</span>
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300" />
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-rose-100/70 border border-rose-100/80 p-6 sm:p-8">
          {/* Role Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-rose-50/80 rounded-2xl mb-6 border border-rose-100">
            <button
              id="login-role-admin"
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeRole === 'admin'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4 text-rose-500" />
              <span>👩‍🏫 Giáo viên</span>
            </button>

            <button
              id="login-role-student"
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeRole === 'student'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <span>👨‍🎓 Học sinh</span>
            </button>
          </div>

          {/* Inline Error Notice */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                {activeRole === 'student' && errorMessage.includes('chuyển sang tab "Giáo viên"') && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className="mt-1.5 text-rose-700 font-bold underline flex items-center gap-1 hover:text-rose-800"
                  >
                    <span>Chuyển ngay sang tab Giáo viên</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form
            action="#"
            onSubmit={e => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="space-y-4"
          >
            {activeRole === 'admin' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="admin-password-input"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Mật khẩu Giáo viên (Cô Yến Thanh)
                  </label>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    Bảo mật Quản trị
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="w-full pl-10 pr-11 py-3.5 rounded-2xl border border-rose-200 bg-rose-50/30 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Nhập mật khẩu quản trị và nhấn Enter để đăng nhập nhanh tức thì.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="student-username-input"
                    className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                  >
                    Tên tài khoản học sinh
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="student-username-input"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Ví dụ: nam.9a1"
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="student-password-input"
                    className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                  >
                    Mật khẩu học sinh
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="student-password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Nhập mật khẩu do Cô cấp"
                      className="w-full pl-10 pr-11 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              onClick={e => {
                e.preventDefault();
                handleSubmit();
              }}
              className={`w-full mt-3 py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                activeRole === 'admin'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-200 active:scale-[0.99]'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200 active:scale-[0.99]'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{activeRole === 'admin' ? 'Đăng nhập Quản trị (Cô Yến Thanh)' : 'Vào góc học tập'}</span>
              )}
            </button>
          </form>

          {/* Quick Help Accordion */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Hướng dẫn đăng nhập nhanh
              </span>
              <span className="text-[11px] font-semibold text-rose-500">
                {showHelp ? 'Đóng' : 'Xem'}
              </span>
            </button>

            {showHelp && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 text-[12px] text-slate-600 space-y-1.5 border border-slate-200/70">
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-800">Dành cho Cô Yến Thanh:</strong> Chọn tab{' '}
                    <span className="text-rose-600 font-semibold">Giáo viên</span>, nhập mật khẩu quản trị và bấm Đăng nhập.
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-800">Dành cho Học sinh:</strong> Chọn tab{' '}
                    <span className="text-purple-600 font-semibold">Học sinh</span>, nhập Tên tài khoản và Mật khẩu do Cô Yến Thanh đã cấp.
                  </p>
                </div>
              </div>
            )}

            {activeRole === 'student' && !showHelp && (
              <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
                🌸 Học sinh nhận tài khoản và mật khẩu trực tiếp từ Cô Yến Thanh để vào làm bài.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
