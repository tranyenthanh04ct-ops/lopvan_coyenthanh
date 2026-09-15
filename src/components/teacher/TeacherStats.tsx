import React from 'react';
import { AdminStats } from '../../types';
import { Users, FileText, ClipboardList, CheckCircle2, Clock, Plus, Upload, PenTool, Sparkles } from 'lucide-react';

interface TeacherStatsProps {
  stats: AdminStats | null;
  onNavigateTab: (tab: string) => void;
}

export const TeacherStats: React.FC<TeacherStatsProps> = ({ stats, onNavigateTab }) => {
  const statCards = [
    {
      title: 'Tổng số học sinh',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      text: 'text-purple-700',
      sub: 'Đang theo học môn Văn',
      actionTab: 'students',
    },
    {
      title: 'Kho tài liệu học tập',
      value: stats?.totalMaterials ?? 0,
      icon: FileText,
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-700',
      sub: 'Bài giảng, đề thi & chuyên đề',
      actionTab: 'materials',
    },
    {
      title: 'Bài tập đã giao',
      value: stats?.totalAssignments ?? 0,
      icon: ClipboardList,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      sub: 'Trắc nghiệm & Tự luận',
      actionTab: 'assignments',
    },
    {
      title: 'Bài nộp chờ chấm',
      value: stats?.pendingGradingCount ?? 0,
      icon: Clock,
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      text: 'text-sky-700',
      sub: 'Học sinh đã nộp bài',
      actionTab: 'grading',
    },
    {
      title: 'Bài đã chấm xong',
      value: stats?.completedGradingCount ?? 0,
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      sub: 'Đã trả điểm & nhận xét',
      actionTab: 'grading',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-rose-100/80 via-pink-100/60 to-purple-100/70 rounded-3xl p-6 sm:p-8 border border-rose-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-rose-800 text-xs font-bold mb-3 border border-rose-200/70">
            <span>🌸 Bảng quản trị Giáo viên</span>
            <span>•</span>
            <span>Cô Yến Thanh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-['Playfair_Display',serif]">
            Chào mừng Cô Yến Thanh trở lại!
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Hệ thống quản trị học tập môn Ngữ văn đã sẵn sàng. Cô có thể quản lý danh sách học sinh, tải tài liệu bài giảng, tạo bài tập và chấm bài cho các em một cách thuận tiện.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => onNavigateTab('students')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-rose-700 text-xs font-bold shadow-sm hover:bg-rose-50 border border-rose-200 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học sinh mới</span>
            </button>
            <button
              onClick={() => onNavigateTab('materials')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-sm hover:bg-rose-700 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Tải tài liệu lên</span>
            </button>
            <button
              onClick={() => onNavigateTab('assignments')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 text-white text-xs font-bold shadow-sm hover:bg-purple-700 transition"
            >
              <PenTool className="w-4 h-4" />
              <span>Tạo bài tập mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Số liệu thống kê thực tế</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h3>
          <span className="text-xs text-slate-500">Cập nhật tự động</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigateTab(card.actionTab)}
                className={`p-5 rounded-3xl ${card.bg} border ${card.border} shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-600">{card.title}</span>
                  <div className={`w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center ${card.text} shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className={`text-3xl font-black ${card.text} tracking-tight`}>
                    {card.value}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State / Getting Started Guidance */}
      {(!stats || stats.totalStudents === 0) && (
        <div className="p-8 rounded-3xl bg-white border border-dashed border-rose-200 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1.5">Lớp học hiện tại chưa có học sinh</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Để bắt đầu sử dụng, Cô hãy chuyển sang mục <strong>Quản lý học sinh</strong> và thêm các em vào hệ thống cùng tên đăng nhập và mật khẩu riêng.
          </p>
          <button
            onClick={() => onNavigateTab('students')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học sinh đầu tiên</span>
          </button>
        </div>
      )}
    </div>
  );
};
