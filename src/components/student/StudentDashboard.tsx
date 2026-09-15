import React, { useState, useEffect } from 'react';
import { AuthUser, Material, Assignment, Announcement } from '../../types';
import { apiStudent } from '../../lib/api';
import { DocumentViewerModal } from '../DocumentViewerModal';
import { AssignmentSolver } from './AssignmentSolver';
import {
  Home,
  BookOpen,
  PenTool,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Eye,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
  Megaphone,
  CheckCircle,
} from 'lucide-react';

interface StudentDashboardProps {
  user: AuthUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  activeTab,
  setActiveTab,
}) => {
  const [dashboardData, setDashboardData] = useState<{
    student: { id: string; fullName: string; username: string; classRoom: string };
    materialsCount: number;
    assignmentsCount: number;
    completedCount: number;
    upcomingDue: Array<Assignment & { status: string; score?: number }>;
    recentAssigned: Array<Assignment & { status: string; score?: number }>;
    announcements: Announcement[];
  } | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<
    Array<
      Assignment & {
        submissionId: string | null;
        status: 'not_started' | 'draft' | 'submitted' | 'graded';
        score: number | null;
        feedback: string | null;
        submittedAt: string | null;
        gradedAt: string | null;
      }
    >
  >([]);

  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');
  const [materialSearch, setMaterialSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'not_started' | 'draft' | 'submitted' | 'graded'
  >('all');
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [activeSolvingAsgId, setActiveSolvingAsgId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, mats, asgs] = await Promise.all([
        apiStudent.getDashboard().catch(() => null),
        apiStudent.getMaterials().catch(() => []),
        apiStudent.getAssignments().catch(() => []),
      ]);
      setDashboardData(dash);
      setMaterials(mats);
      setAssignments(asgs);
    } catch (err) {
      console.error('Error loading student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // If student is actively solving an assignment
  if (activeSolvingAsgId) {
    return (
      <AssignmentSolver
        assignmentId={activeSolvingAsgId}
        onBack={() => {
          setActiveSolvingAsgId(null);
          loadData();
        }}
        onSubmitted={() => {
          setActiveSolvingAsgId(null);
          loadData();
        }}
      />
    );
  }

  const navTabs = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'materials', label: 'Tài liệu học tập', icon: BookOpen, badge: materials.length },
    {
      id: 'assignments',
      label: 'Bài tập của em',
      icon: PenTool,
      badge: assignments.filter(a => a.status === 'not_started' || a.status === 'draft').length,
    },
    {
      id: 'results',
      label: 'Kết quả & Lời phê',
      icon: Award,
      badge: assignments.filter(a => a.status === 'graded').length,
    },
  ];

  const materialTopics = ['Tất cả', ...Array.from(new Set(materials.map(m => m.topic).filter(Boolean)))];

  const filteredMaterials = materials.filter(m => {
    const matchTopic = selectedTopic === 'Tất cả' || m.topic === selectedTopic;
    const matchSearch =
      m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.description?.toLowerCase().includes(materialSearch.toLowerCase());
    return matchTopic && matchSearch;
  });

  const filteredAssignments = assignments.filter(a => {
    if (assignmentFilter === 'all') return true;
    return a.status === assignmentFilter;
  });

  const gradedAssignments = assignments.filter(a => a.status === 'graded');

  const formatDueDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-rose-100">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-purple-50 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: HOME */}
      {activeTab === 'home' && (
        <div className="space-y-8">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-purple-100/90 via-pink-100/70 to-rose-100/80 rounded-3xl p-6 sm:p-8 border border-purple-200/70 shadow-sm relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-purple-900 text-xs font-bold mb-3 border border-purple-200/60">
                <span>🌸 Góc học tập môn Văn</span>
                <span>•</span>
                <span>Lớp {user.classRoom || 'Văn'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-['Playfair_Display',serif]">
                Chào em, {user.name}! 🌸
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Chào mừng em đến với không gian học Văn của Cô Yến Thanh. Hãy cùng Cô khám phá vẻ đẹp ngôn từ, rèn luyện tư duy cảm xúc và bồi dưỡng tình yêu văn chương mỗi ngày nhé!
              </p>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-200 hover:bg-purple-700 transition"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Xem bài tập cần làm</span>
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-purple-800 text-xs font-bold shadow-xs hover:bg-purple-50 border border-purple-200 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Đọc tài liệu của Cô</span>
                </button>
              </div>
            </div>
          </div>

          {/* Teacher Announcements Banner */}
          {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <Megaphone className="w-5 h-5 text-rose-500" />
                <span>Lời dặn dò & Thông báo từ Cô Yến Thanh</span>
              </div>
              <div className="space-y-3 pt-1">
                {dashboardData.announcements.map(anno => (
                  <div
                    key={anno.id}
                    className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 text-xs text-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-800 text-sm">{anno.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(anno.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{anno.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('assignments')}
              className="p-5 rounded-3xl bg-white border border-purple-100 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-500">Bài tập chưa nộp</span>
                <div className="text-3xl font-black text-purple-700 mt-1">
                  {assignments.filter(a => a.status === 'not_started' || a.status === 'draft').length}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Nhấp vào để làm bài ngay</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <PenTool className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('results')}
              className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-500">Bài đã chấm điểm</span>
                <div className="text-3xl font-black text-emerald-700 mt-1">
                  {gradedAssignments.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Xem điểm & nhận xét của Cô</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('materials')}
              className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-500">Tài liệu học tập</span>
                <div className="text-3xl font-black text-rose-600 mt-1">{materials.length}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Bài giảng & đề cương</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Upcoming Due Exercises */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Bài tập cần nộp sắp tới</span>
              </h3>
              <button
                onClick={() => setActiveTab('assignments')}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {assignments.filter(a => a.status === 'not_started' || a.status === 'draft').length ===
            0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-purple-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Tuyệt vời! Em đã hoàn thành hết các bài tập được giao.
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Khi Cô Yến Thanh giao bài mới, bài tập sẽ xuất hiện tại đây nhé!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments
                  .filter(a => a.status === 'not_started' || a.status === 'draft')
                  .slice(0, 4)
                  .map(asg => (
                    <div
                      key={asg.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Hạn: {formatDueDate(asg.dueDate)}</span>
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              asg.status === 'draft'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {asg.status === 'draft' ? 'Đang làm nháp' : 'Chưa làm'}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm mb-1">{asg.title}</h4>
                        {asg.instructions && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {asg.instructions}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">
                          {asg.questions?.length || 0} câu hỏi
                        </span>
                        <button
                          onClick={() => setActiveSolvingAsgId(asg.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition shadow-xs"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>{asg.status === 'draft' ? 'Làm tiếp' : 'Bắt đầu làm'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tài liệu học tập Cô giao</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các bài giảng, đề thi và chuyên đề Cô Yến Thanh chia sẻ để em ôn tập
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full w-fit">
              {materials.length} tài liệu
            </span>
          </div>

          {/* Search & Topic Filters */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={materialSearch}
                onChange={e => setMaterialSearch(e.target.value)}
                placeholder="Tìm tài liệu theo tên, chuyên đề..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {materialTopics.map(tp => (
                <button
                  key={tp}
                  onClick={() => setSelectedTopic(tp)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedTopic === tp
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-rose-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Chưa có tài liệu nào trong mục này</h4>
              <p className="text-xs text-slate-400 mt-1">
                Khi Cô Yến Thanh tải bài giảng mới lên, tài liệu sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map(m => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                        {m.topic}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm mb-1.5">{m.title}</h4>
                    {m.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {m.fileName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewMaterial(m)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Đọc trực tiếp</span>
                      </button>
                      <a
                        href={m.fileUrl}
                        download={m.fileName}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Tải về máy"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Header & Filter Pills */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Danh sách bài tập của em</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Làm bài và nộp bài để được Cô Yến Thanh nhận xét và chấm điểm
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
              {[
                { id: 'all', label: 'Tất cả bài' },
                { id: 'not_started', label: 'Chưa làm' },
                { id: 'draft', label: 'Đang làm (nháp)' },
                { id: 'submitted', label: 'Đã nộp' },
                { id: 'graded', label: 'Đã chấm' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAssignmentFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    assignmentFilter === tab.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-purple-200">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center mb-2">
                <PenTool className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Không có bài tập nào</h4>
              <p className="text-xs text-slate-400 mt-1">
                Hiện tại không có bài tập nào thuộc trạng thái này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map(asg => {
                const isOverdue = new Date(asg.dueDate).getTime() < Date.now();

                return (
                  <div
                    key={asg.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            isOverdue
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 border border-amber-200 text-amber-800'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Hạn: {formatDueDate(asg.dueDate)}</span>
                        </span>

                        {asg.status === 'not_started' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                            Chưa làm
                          </span>
                        )}
                        {asg.status === 'draft' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                            Đang làm nháp
                          </span>
                        )}
                        {asg.status === 'submitted' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã nộp bài</span>
                          </span>
                        )}
                        {asg.status === 'graded' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{asg.score}/10 điểm</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-base mb-1.5">{asg.title}</h4>
                      {asg.instructions && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                          {asg.instructions}
                        </p>
                      )}

                      {/* If Graded, Show Teacher Feedback preview */}
                      {asg.status === 'graded' && asg.feedback && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl mb-4 text-xs text-emerald-900">
                          <span className="font-bold block text-[11px] text-emerald-700">
                            Lời phê của Cô Yến Thanh:
                          </span>
                          <p className="italic line-clamp-2 mt-0.5">"{asg.feedback}"</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        {asg.questions?.length || 0} câu hỏi
                      </span>

                      <button
                        onClick={() => setActiveSolvingAsgId(asg.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                          asg.status === 'graded'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : asg.status === 'submitted'
                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>
                          {asg.status === 'graded'
                            ? 'Xem bài đã chấm'
                            : asg.status === 'submitted'
                            ? 'Xem bài đã nộp'
                            : asg.status === 'draft'
                            ? 'Tiếp tục làm bài'
                            : 'Làm bài ngay'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RESULTS */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800">Kết quả học tập & Lời nhận xét</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Những bài làm đã được Cô Yến Thanh chấm điểm chi tiết
            </p>
          </div>

          {gradedAssignments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-emerald-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Chưa có bài nào được chấm điểm</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Khi em nộp bài và Cô Yến Thanh hoàn tất chấm điểm, kết quả cùng lời nhận xét sẽ được hiển thị đầy đủ tại đây!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gradedAssignments.map(asg => (
                <div
                  key={asg.id}
                  className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs hover:shadow-md transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{asg.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Đã nộp:{' '}
                        {asg.submittedAt
                          ? new Date(asg.submittedAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                          Điểm số
                        </span>
                        <span className="text-2xl font-black text-emerald-700">
                          {asg.score}
                          <span className="text-xs font-normal text-emerald-600">/10</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveSolvingAsgId(asg.id)}
                        className="px-4 py-2.5 rounded-2xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>

                  {asg.feedback && (
                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-rose-700 block mb-1 flex items-center gap-1.5">
                        <span>🌸 Lời nhận xét của Cô Yến Thanh:</span>
                      </span>
                      <p className="whitespace-pre-wrap italic">"{asg.feedback}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal material={previewMaterial} onClose={() => setPreviewMaterial(null)} />
    </div>
  );
};
