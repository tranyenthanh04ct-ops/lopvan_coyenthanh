import React, { useState, useEffect } from 'react';
import { Assignment, Material, Submission, AnswerItem } from '../../types';
import { apiStudent, apiUpload } from '../../lib/api';
import { useToast } from '../Toast';
import { DocumentViewerModal } from '../DocumentViewerModal';
import {
  ArrowLeft,
  Clock,
  Paperclip,
  CheckCircle2,
  Save,
  Send,
  Upload,
  FileText,
  HelpCircle,
  Sparkles,
  Award,
  AlertTriangle,
} from 'lucide-react';

interface AssignmentSolverProps {
  assignmentId: string;
  onBack: () => void;
  onSubmitted: () => void;
}

export const AssignmentSolver: React.FC<AssignmentSolverProps> = ({
  assignmentId,
  onBack,
  onSubmitted,
}) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attachedMaterials, setAttachedMaterials] = useState<Material[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [uploadingQId, setUploadingQId] = useState<string | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const data = await apiStudent.getAssignmentDetail(assignmentId);
        setAssignment(data.assignment);
        setAttachedMaterials(data.attachedMaterials);
        setSubmission(data.submission);
        if (data.submission?.answers) {
          setAnswers(data.submission.answers);
        }
      } catch (err: any) {
        error(err.message || 'Không thể tải chi tiết bài tập');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  const isGraded = submission?.status === 'graded';
  const isSubmitted = submission?.status === 'submitted' && !isGraded;
  const isReadOnly = isGraded || isSubmitted;

  const handleSelectChoice = (questionId: string, choiceIndex: number) => {
    if (isReadOnly) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        choiceIndex,
      },
    }));
  };

  const handleTextChange = (questionId: string, textAnswer: string) => {
    if (isReadOnly) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        textAnswer,
      },
    }));
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    try {
      setUploadingQId(questionId);
      const res = await apiUpload.uploadFile(file);
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          attachedFileUrl: res.url,
          attachedFileName: res.fileName,
        },
      }));
      success('Đã tải tệp bài làm lên!');
    } catch (err: any) {
      error(err.message || 'Tải tệp đính kèm thất bại');
    } finally {
      setUploadingQId(null);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const res = await apiStudent.saveAssignment(assignmentId, answers, false);
      setSubmission(res.submission);
      success('Đã lưu bản nháp! Em có thể quay lại làm tiếp bất cứ lúc nào.');
    } catch (err: any) {
      error(err.message || 'Lưu bản nháp thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await apiStudent.saveAssignment(assignmentId, answers, true);
      setSubmission(res.submission);
      setShowConfirmModal(false);
      success('Nộp bài thành công! Cô Yến Thanh sẽ chấm bài cho em sớm nhé 🌸');
      onSubmitted();
    } catch (err: any) {
      error(err.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang mở bài làm của em...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-sm text-slate-600 mb-4">Không tìm thấy thông tin bài tập.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isExpired = new Date(assignment.dueDate).getTime() < Date.now();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Back Button & Assignment Title Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold border border-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại bài tập của em</span>
        </button>

        {isGraded && (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Đã được Cô chấm điểm</span>
          </span>
        )}
        {isSubmitted && (
          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <span>Đã nộp bài (Chờ Cô chấm)</span>
          </span>
        )}
      </div>

      {/* Graded Result Banner if Graded */}
      {isGraded && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Kết quả chấm bài của Cô Yến Thanh</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Em đã hoàn thành bài tập xuất sắc!
              </h3>
              {submission?.gradedAt && (
                <p className="text-xs text-emerald-100 font-medium">
                  Chấm lúc:{' '}
                  {new Date(submission.gradedAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3.5 text-center border border-white/30 shrink-0">
              <span className="text-xs uppercase font-extrabold tracking-wider block text-emerald-100">
                Điểm số
              </span>
              <span className="text-4xl font-black tracking-tight">
                {submission?.score ?? '—'}
                <span className="text-base font-normal text-emerald-100">/10</span>
              </span>
            </div>
          </div>

          {submission?.feedback && (
            <div className="mt-4 pt-4 border-t border-white/20 bg-white/10 rounded-2xl p-4 backdrop-blur-xs">
              <p className="text-xs font-bold text-amber-200 mb-1 flex items-center gap-1.5">
                <span>🌸 Lời nhận xét của Cô Yến Thanh:</span>
              </p>
              <p className="text-sm text-white/95 leading-relaxed whitespace-pre-wrap">
                "{submission.feedback}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Assignment Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold">
            Môn Ngữ văn • Cô Yến Thanh
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Hạn nộp:{' '}
              {new Date(assignment.dueDate).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight font-['Playfair_Display',serif]">
          {assignment.title}
        </h2>

        {assignment.instructions && (
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/70 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-rose-700 block mb-1">Hướng dẫn làm bài từ Cô:</span>
            <p className="whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}

        {/* Attached Reference Materials */}
        {attachedMaterials.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-500 block mb-2">
              Tài liệu tham khảo đính kèm (Em có thể mở xem trực tiếp):
            </span>
            <div className="flex flex-wrap gap-2">
              {attachedMaterials.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPreviewMaterial(m)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-800 text-xs font-bold hover:bg-purple-100 transition"
                >
                  <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                  <span className="truncate max-w-[220px]">{m.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Questions Section */}
      <div className="space-y-6">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Nội dung các câu hỏi ({assignment.questions.length})</span>
          <span className="text-xs font-normal text-slate-400">
            {isReadOnly ? 'Chế độ xem lại bài làm' : 'Trả lời đầy đủ các câu hỏi bên dưới'}
          </span>
        </h3>

        {assignment.questions.map((q, idx) => {
          const ans = answers[q.id] || {};
          const isChoice = q.type === 'choice';
          const wordCount = ans.textAnswer ? ans.textAnswer.trim().split(/\s+/).filter(Boolean).length : 0;

          return (
            <div
              key={q.id || idx}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-black">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    ({isChoice ? 'Trắc nghiệm' : 'Tự luận'}) • Thang điểm: {q.points}đ
                  </span>
                </div>

                {isGraded && isChoice && (
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      ans.choiceIndex === q.correctAnswerIndex
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ans.choiceIndex === q.correctAnswerIndex ? '✓ Đúng' : '✗ Chưa chính xác'}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                {q.questionText}
              </p>

              {/* Choice Question */}
              {isChoice && q.options && (
                <div className="space-y-2.5 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = ans.choiceIndex === optIdx;
                    const isCorrect = isGraded && q.correctAnswerIndex === optIdx;
                    const isWrongChoice = isGraded && isSelected && !isCorrect;
                    const label = ['A', 'B', 'C', 'D'][optIdx];

                    let containerStyle = 'border-slate-200 hover:border-purple-300 bg-white text-slate-700';
                    if (isSelected && !isGraded) {
                      containerStyle = 'border-purple-500 bg-purple-50/70 text-purple-900 shadow-xs';
                    }
                    if (isCorrect) {
                      containerStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    } else if (isWrongChoice) {
                      containerStyle = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectChoice(q.id, optIdx)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                          isReadOnly ? 'cursor-default' : 'cursor-pointer'
                        } ${containerStyle}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {label}
                        </div>
                        <span className="text-sm flex-1 leading-snug">{opt}</span>
                        {isSelected && !isGraded && (
                          <span className="text-xs font-bold text-purple-600">Đã chọn</span>
                        )}
                        {isCorrect && (
                          <span className="text-xs font-bold text-emerald-700">Đáp án đúng</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Essay Question */}
              {!isChoice && (
                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <textarea
                      rows={7}
                      disabled={isReadOnly}
                      value={ans.textAnswer || ''}
                      onChange={e => handleTextChange(q.id, e.target.value)}
                      placeholder={
                        isReadOnly
                          ? 'Chưa có câu trả lời'
                          : 'Em hãy viết bài làm hoặc đoạn văn tự luận vào đây... (Hỗ trợ xuống dòng, chia đoạn)'
                      }
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/40 text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white disabled:bg-slate-100/70 transition resize-y font-['Nunito',sans-serif]"
                    />
                    {!isReadOnly && (
                      <div className="text-[11px] text-slate-400 text-right mt-1 px-1">
                        Số từ đã viết: <strong>{wordCount}</strong> từ
                      </div>
                    )}
                  </div>

                  {/* Attachment if student took a picture of handwritten paper */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        Tệp bài làm chụp tay / Word đính kèm:
                      </span>
                      {ans.attachedFileUrl ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
                          <FileText className="w-3.5 h-3.5" />
                          <a
                            href={ans.attachedFileUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline truncate max-w-[200px]"
                          >
                            {ans.attachedFileName || 'Tệp đính kèm'}
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa có tệp</span>
                      )}
                    </div>

                    {!isReadOnly && (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingQId === q.id ? 'Đang tải lên...' : 'Tải tệp đính kèm'}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(q.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Bar at the bottom if NOT read only */}
      {!isReadOnly && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-lg py-3.5 px-4 z-30">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 hidden sm:block">
              {submission?.lastSavedAt ? (
                <span>
                  Đã lưu nháp lúc:{' '}
                  {new Date(submission.lastSavedAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              ) : (
                <span>Em nhớ lưu nháp thường xuyên trong lúc làm bài nhé</span>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
              >
                <Save className="w-4 h-4 text-purple-600" />
                <span>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-200 hover:from-purple-700 hover:to-indigo-700 transition"
              >
                <Send className="w-4 h-4" />
                <span>Nộp bài cho Cô</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-purple-100">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center mb-3">
              <Send className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">Xác nhận nộp bài?</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Sau khi nộp bài chính thức, bài làm sẽ được gửi đến Cô Yến Thanh để chấm điểm. Em đã kiểm tra kỹ toàn bộ câu trả lời chưa?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Xem lại bài
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
              >
                {submitting ? 'Đang nộp...' : 'Đồng ý nộp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal material={previewMaterial} onClose={() => setPreviewMaterial(null)} />
    </div>
  );
};
