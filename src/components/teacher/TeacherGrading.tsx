import React, { useState, useEffect } from 'react';
import { Assignment, Submission } from '../../types';
import { apiAdmin } from '../../lib/api';
import { useToast } from '../Toast';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Send,
  Sparkles,
  Download,
  FileText,
  User,
  X,
} from 'lucide-react';

interface TeacherGradingProps {
  assignments: Assignment[];
  selectedAssignmentId?: string;
  onRefresh: () => void;
}

interface StudentSubmissionItem {
  studentId: string;
  studentName: string;
  studentClass: string;
  submissionId: string | null;
  status: 'not_started' | 'draft' | 'submitted' | 'graded';
  answers: Record<string, any>;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
}

export const TeacherGrading: React.FC<TeacherGradingProps> = ({
  assignments,
  selectedAssignmentId: initialAsgId,
  onRefresh,
}) => {
  const [activeAsgId, setActiveAsgId] = useState<string>(
    initialAsgId || (assignments.length > 0 ? assignments[0].id : '')
  );
  const [submissionsData, setSubmissionsData] = useState<{
    assignment: Assignment;
    studentsSubmissions: StudentSubmissionItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<StudentSubmissionItem | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (initialAsgId) {
      setActiveAsgId(initialAsgId);
    } else if (!activeAsgId && assignments.length > 0) {
      setActiveAsgId(assignments[0].id);
    }
  }, [initialAsgId, assignments]);

  const loadSubmissions = async (asgId: string) => {
    if (!asgId) return;
    try {
      setLoading(true);
      const data = await apiAdmin.getAssignmentSubmissions(asgId);
      setSubmissionsData(data);
    } catch (err: any) {
      error(err.message || 'Không thể tải danh sách bài làm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAsgId) {
      loadSubmissions(activeAsgId);
    }
  }, [activeAsgId]);

  const handleOpenGradingModal = (item: StudentSubmissionItem) => {
    setGradingStudent(item);
    setScoreInput(item.score !== null ? String(item.score) : '');
    setFeedbackInput(item.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingStudent || !gradingStudent.submissionId) return;

    const numericScore = parseFloat(scoreInput);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      error('Vui lòng nhập điểm hợp lệ từ 0 đến 10');
      return;
    }

    try {
      setSavingGrade(true);
      await apiAdmin.gradeSubmission(
        gradingStudent.submissionId,
        numericScore,
        feedbackInput.trim()
      );
      success(`Đã chấm điểm & trả bài cho học sinh ${gradingStudent.studentName}!`);
      setGradingStudent(null);
      if (activeAsgId) {
        await loadSubmissions(activeAsgId);
      }
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Chấm điểm thất bại');
    } finally {
      setSavingGrade(false);
    }
  };

  const currentAsg = assignments.find(a => a.id === activeAsgId);

  const stats = {
    total: submissionsData?.studentsSubmissions.length || 0,
    submitted: submissionsData?.studentsSubmissions.filter(s => s.status === 'submitted' || s.status === 'graded').length || 0,
    notSubmitted: submissionsData?.studentsSubmissions.filter(s => s.status === 'not_started' || s.status === 'draft').length || 0,
    graded: submissionsData?.studentsSubmissions.filter(s => s.status === 'graded').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Selector */}
      <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Quản lý nộp bài & Chấm điểm</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ làm bài, chấm điểm và gửi lời nhận xét cho từng học sinh
          </p>
        </div>

        {assignments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Chọn bài tập:</span>
            <select
              value={activeAsgId}
              onChange={e => setActiveAsgId(e.target.value)}
              className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 max-w-xs truncate"
            >
              {assignments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-rose-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">Chưa có bài tập nào để chấm</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cô hãy chuyển sang mục <strong>Giao bài tập</strong> để tạo bài tập cho học sinh trước nhé!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Assignment Progress Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-rose-100">
              <span className="text-xs text-slate-500 font-medium">HS được giao</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
              <span className="text-xs text-sky-700 font-medium">Đã nộp bài</span>
              <p className="text-2xl font-black text-sky-700 mt-1">{stats.submitted}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-xs text-amber-700 font-medium">Chưa nộp</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{stats.notSubmitted}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs text-emerald-700 font-medium">Đã chấm xong</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{stats.graded}</p>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">
                Danh sách bài làm của học sinh: {currentAsg?.title}
              </h4>
              <button
                onClick={() => activeAsgId && loadSubmissions(activeAsgId)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                Làm mới
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách bài làm...</div>
            ) : !submissionsData || submissionsData.studentsSubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Chưa có học sinh nào được giao bài tập này
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-rose-50/50 text-slate-700 text-xs font-bold border-b border-rose-100">
                    <tr>
                      <th className="px-5 py-3.5">Học sinh</th>
                      <th className="px-5 py-3.5">Lớp</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5">Thời gian nộp</th>
                      <th className="px-5 py-3.5">Điểm số</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100/60">
                    {submissionsData.studentsSubmissions.map(item => (
                      <tr key={item.studentId} className="hover:bg-rose-50/20 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-800">{item.studentName}</td>
                        <td className="px-5 py-4 text-xs">{item.studentClass}</td>
                        <td className="px-5 py-4">
                          {item.status === 'not_started' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>Chưa làm</span>
                            </span>
                          )}
                          {item.status === 'draft' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>Đang làm (nháp)</span>
                            </span>
                          )}
                          {item.status === 'submitted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                              <AlertCircle className="w-3 h-3 text-sky-600" />
                              <span>Đã nộp (Chờ chấm)</span>
                            </span>
                          )}
                          {item.status === 'graded' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã chấm điểm</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {item.submittedAt
                            ? new Date(item.submittedAt).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-5 py-4">
                          {item.score !== null ? (
                            <span className="text-base font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                              {item.score} / 10
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Chưa có điểm</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {item.status === 'submitted' || item.status === 'graded' ? (
                            <button
                              onClick={() => handleOpenGradingModal(item)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition ${
                                item.status === 'graded'
                                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
                              }`}
                            >
                              <FileCheck2 className="w-4 h-4" />
                              <span>{item.status === 'graded' ? 'Xem & Chấm lại' : 'Chấm bài ngay'}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa nộp bài</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingStudent && currentAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div>
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-rose-500" />
                  <span>Chấm bài làm của học sinh: {gradingStudent.studentName}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lớp: {gradingStudent.studentClass} • Nộp lúc:{' '}
                  {gradingStudent.submittedAt ? new Date(gradingStudent.submittedAt).toLocaleString('vi-VN') : ''}
                </p>
              </div>
              <button onClick={() => setGradingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions & Student Answers */}
            <div className="space-y-5 my-6">
              <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Nội dung bài làm của học sinh
              </h5>

              {currentAsg.questions.map((q, idx) => {
                const answer = gradingStudent.answers ? gradingStudent.answers[q.id] : null;
                const isChoice = q.type === 'choice';

                return (
                  <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Câu {idx + 1} ({isChoice ? 'Trắc nghiệm' : 'Tự luận'}) - Thang điểm: {q.points}đ
                      </span>
                      {isChoice && answer && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            answer.choiceIndex === q.correctAnswerIndex
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {answer.choiceIndex === q.correctAnswerIndex ? 'Đúng' : 'Sai'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800">{q.questionText}</p>

                    {isChoice && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        {q.options.map((opt, optIdx) => {
                          const isStudentPick = answer?.choiceIndex === optIdx;
                          const isCorrect = q.correctAnswerIndex === optIdx;
                          const label = ['A', 'B', 'C', 'D'][optIdx];

                          let itemStyle = 'bg-white border-slate-200 text-slate-700';
                          if (isCorrect) {
                            itemStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                          } else if (isStudentPick && !isCorrect) {
                            itemStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                          }

                          return (
                            <div key={optIdx} className={`p-2 rounded-xl border flex items-center gap-2 ${itemStyle}`}>
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {label}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isStudentPick && (
                                <span className="text-[10px] uppercase font-extrabold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                  HS chọn
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isChoice && (
                      <div className="mt-2 space-y-2">
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {answer?.textAnswer || <span className="italic text-slate-400">Học sinh không để lại câu trả lời</span>}
                        </div>

                        {/* Attached file if any */}
                        {answer?.attachedFileUrl && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
                            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="font-semibold truncate flex-1">
                              {answer.attachedFileName || 'File bài làm đính kèm của học sinh'}
                            </span>
                            <a
                              href={answer.attachedFileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 text-[11px] flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải bài làm</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSaveGrade} className="pt-4 border-t border-rose-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số (Thang 10) *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="10"
                    required
                    value={scoreInput}
                    onChange={e => setScoreInput(e.target.value)}
                    placeholder="VD: 8.5"
                    className="w-full px-4 py-2.5 rounded-2xl border border-rose-200 text-lg font-black text-rose-600 bg-rose-50/40 focus:outline-none focus:ring-2 focus:ring-rose-400 text-center"
                    autoFocus
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lời nhận xét của Cô Yến Thanh dành cho em *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={feedbackInput}
                    onChange={e => setFeedbackInput(e.target.value)}
                    placeholder="Nhận xét chi tiết về bài làm, khen ngợi những ý văn hay và chỉ ra những điểm cần khắc phục..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingStudent(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-200 hover:from-rose-700 hover:to-pink-700 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{savingGrade ? 'Đang lưu...' : 'Lưu điểm & Trả bài cho học sinh'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
