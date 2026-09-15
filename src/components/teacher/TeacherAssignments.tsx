import React, { useState } from 'react';
import { Assignment, Material, Student, Question } from '../../types';
import { apiAdmin } from '../../lib/api';
import { useToast } from '../Toast';
import {
  PenTool,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  HelpCircle,
  Clock,
  Users,
  Paperclip,
  Check,
  X,
  FileCheck2,
} from 'lucide-react';

interface TeacherAssignmentsProps {
  assignments: Assignment[];
  materials: Material[];
  students: Student[];
  onRefresh: () => void;
  onGradeAssignment: (assignmentId: string) => void;
}

export const TeacherAssignments: React.FC<TeacherAssignmentsProps> = ({
  assignments,
  materials,
  students,
  onRefresh,
  onGradeAssignment,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [attachedMaterialIds, setAttachedMaterialIds] = useState<string[]>([]);

  // Questions editor
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      type: 'choice',
      questionText: 'Biện pháp tu từ nào được sử dụng trong câu thơ sau?',
      points: 2,
      options: ['Ẩn dụ', 'Hoán dụ', 'So sánh', 'Nhân hóa'],
      correctAnswerIndex: 0,
    },
    {
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      type: 'essay',
      questionText: 'Em hãy viết một đoạn văn (khoảng 200 chữ) nêu cảm nghĩ về tình đồng chí, đồng đội được thể hiện qua tác phẩm.',
      points: 8,
    },
  ]);

  const { success, error } = useToast();

  const handleOpenCreate = () => {
    setTitle('');
    setInstructions('Các em đọc kỹ đề bài và hoàn thành bài làm trước hạn nộp nhé!');
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    setDueDate(d.toISOString().slice(0, 16));
    setTargetType('all');
    setTargetStudentIds([]);
    setAttachedMaterialIds([]);
    setQuestions([
      {
        id: 'q_' + Math.random().toString(36).substring(2, 8),
        type: 'choice',
        questionText: '',
        points: 2,
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
      },
    ]);
    setShowCreateModal(true);
  };

  const handleAddQuestion = (type: 'choice' | 'essay') => {
    const newQ: Question = {
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      type,
      questionText: '',
      points: type === 'choice' ? 2 : 5,
      options: type === 'choice' ? ['', '', '', ''] : undefined,
      correctAnswerIndex: type === 'choice' ? 0 : undefined,
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions(prev => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], ...patch };
      return clone;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions(prev => {
      const clone = [...prev];
      const q = { ...clone[qIdx] };
      if (q.options) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        q.options = newOpts;
      }
      clone[qIdx] = q;
      return clone;
    });
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Vui lòng nhập tên bài tập');
      return;
    }
    if (questions.length === 0) {
      error('Bài tập cần có ít nhất 1 câu hỏi');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        error(`Vui lòng nhập nội dung cho câu hỏi số ${i + 1}`);
        return;
      }
    }

    try {
      setLoading(true);
      const isoDueDate = new Date(dueDate).toISOString();

      if (editingAssignment) {
        await apiAdmin.updateAssignment(editingAssignment.id, {
          title: title.trim(),
          instructions: instructions.trim(),
          dueDate: isoDueDate,
          targetType,
          targetStudentIds: targetType === 'specific' ? targetStudentIds : [],
          attachedMaterialIds,
          questions,
        });
        success('Cập nhật bài tập thành công!');
        setEditingAssignment(null);
      } else {
        await apiAdmin.createAssignment({
          title: title.trim(),
          instructions: instructions.trim(),
          dueDate: isoDueDate,
          targetType,
          targetStudentIds: targetType === 'specific' ? targetStudentIds : [],
          attachedMaterialIds,
          questions,
        });
        success('Tạo và giao bài tập mới thành công!');
        setShowCreateModal(false);
      }
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Lưu bài tập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (asg: Assignment) => {
    setEditingAssignment(asg);
    setTitle(asg.title);
    setInstructions(asg.instructions || '');
    try {
      setDueDate(new Date(asg.dueDate).toISOString().slice(0, 16));
    } catch {
      setDueDate('');
    }
    setTargetType(asg.targetType);
    setTargetStudentIds(asg.targetStudentIds || []);
    setAttachedMaterialIds(asg.attachedMaterialIds || []);
    setQuestions(asg.questions || []);
  };

  const handleDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    try {
      setLoading(true);
      await apiAdmin.deleteAssignment(deletingAssignment.id);
      success('Đã xóa bài tập thành công!');
      setDeletingAssignment(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Xóa bài tập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatDueDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Quản lý & Giao bài tập Ngữ văn</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-bold text-purple-600">{assignments.length}</span> bài tập đã giao
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-200 hover:from-purple-700 hover:to-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo & Giao bài tập mới</span>
        </button>
      </div>

      {/* Assignment List */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-rose-200">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center mb-3">
            <PenTool className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">Chưa có bài tập nào được tạo</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Cô hãy tạo bài tập trắc nghiệm hoặc bài làm văn tự luận để giao cho học sinh rèn luyện kỹ năng nhé!
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bài tập đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(asg => {
            const choiceCount = asg.questions?.filter(q => q.type === 'choice').length || 0;
            const essayCount = asg.questions?.filter(q => q.type === 'essay').length || 0;
            const isExpired = new Date(asg.dueDate).getTime() < Date.now();

            return (
              <div
                key={asg.id}
                className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isExpired
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 border border-amber-200/80 text-amber-800'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Hạn nộp: {formatDueDate(asg.dueDate)}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold">
                      {asg.targetType === 'all'
                        ? 'Toàn bộ học sinh'
                        : `Giao cho ${asg.targetStudentIds?.length || 0} HS`}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-base mb-2">{asg.title}</h4>
                  {asg.instructions && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">{asg.instructions}</p>
                  )}

                  {/* Summary Badges */}
                  <div className="flex flex-wrap gap-2 mb-4 text-xs font-medium">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/60">
                      Tổng: <strong>{asg.questions?.length || 0}</strong> câu hỏi
                    </span>
                    {choiceCount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60">
                        {choiceCount} Trắc nghiệm
                      </span>
                    )}
                    {essayCount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-pink-50 text-pink-700 border border-pink-200/60">
                        {essayCount} Tự luận
                      </span>
                    )}
                    {asg.attachedMaterialIds?.length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{asg.attachedMaterialIds.length} tài liệu kèm</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onGradeAssignment(asg.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-xs hover:from-rose-600 hover:to-pink-600 transition"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Xem & Chấm bài</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(asg)}
                      className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                      title="Sửa bài tập"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingAssignment(asg)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingAssignment) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-purple-600" />
                <span>{editingAssignment ? 'Chỉnh sửa bài tập' : 'Tạo và giao bài tập mới'}</span>
              </h4>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAssignment(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-5 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài tập *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bài kiểm tra 15 phút: Phân tích bài thơ Ánh trăng"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hạn nộp bài *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giao bài cho ai *</label>
                  <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="all">Toàn bộ học sinh ({students.length})</option>
                    <option value="specific">Chỉ học sinh được chọn</option>
                  </select>
                </div>
              </div>

              {/* Specific Students Selector if chosen */}
              {targetType === 'specific' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chọn học sinh làm bài:</label>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                    {students.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Chưa có học sinh nào</p>
                    ) : (
                      students.map(s => {
                        const isChecked = targetStudentIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1.5 hover:bg-white rounded-xl"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setTargetStudentIds(prev => prev.filter(id => id !== s.id));
                                } else {
                                  setTargetStudentIds(prev => [...prev, s.id]);
                                }
                              }}
                              className="rounded text-purple-600 focus:ring-purple-400"
                            />
                            <span className="font-semibold">{s.fullName}</span>
                            <span className="text-slate-400">({s.classRoom})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hướng dẫn làm bài</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Dặn dò học sinh về cách làm bài, chú ý cấu trúc đoạn văn, chính tả..."
                  className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Attach Materials */}
              {materials.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-rose-500" />
                    <span>Đính kèm tài liệu tham khảo (tùy chọn):</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {materials.map(m => {
                      const isAttached = attachedMaterialIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (isAttached) {
                              setAttachedMaterialIds(prev => prev.filter(id => id !== m.id));
                            } else {
                              setAttachedMaterialIds(prev => [...prev, m.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                            isAttached
                              ? 'bg-rose-100 border-rose-300 text-rose-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isAttached && <Check className="w-3.5 h-3.5 text-rose-600" />}
                          <span className="truncate max-w-[200px]">{m.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Questions Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span>Nội dung câu hỏi</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                      {questions.length} câu
                    </span>
                  </h5>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('choice')}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 border border-sky-200 transition"
                    >
                      + Trắc nghiệm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('essay')}
                      className="px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 text-xs font-bold hover:bg-pink-100 border border-pink-200 transition"
                    >
                      + Tự luận
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg">
                          Câu {qIdx + 1} ({q.type === 'choice' ? 'Trắc nghiệm' : 'Tự luận'})
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 font-medium">Điểm:</label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            max="10"
                            value={q.points}
                            onChange={e => handleUpdateQuestion(qIdx, { points: parseFloat(e.target.value) || 1 })}
                            className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          required
                          value={q.questionText}
                          onChange={e => handleUpdateQuestion(qIdx, { questionText: e.target.value })}
                          placeholder="Nhập nội dung đề bài hoặc câu hỏi..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      {/* Options if Multiple Choice */}
                      {q.type === 'choice' && q.options && (
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] font-bold text-slate-500">
                            Các lựa chọn đáp án (Chọn vào nút tròn để đánh dấu đáp án đúng):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = q.correctAnswerIndex === optIdx;
                              const label = ['A', 'B', 'C', 'D'][optIdx] || `${optIdx + 1}`;
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                    isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuestion(qIdx, { correctAnswerIndex: optIdx })}
                                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                  <input
                                    type="text"
                                    required
                                    value={opt}
                                    onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                    placeholder={`Đáp án ${label}...`}
                                    className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAssignment(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:from-purple-700 hover:to-indigo-700 shadow-sm"
                >
                  {loading ? 'Đang lưu...' : editingAssignment ? 'Lưu cập nhật' : 'Giao bài tập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100">
            <h4 className="text-base font-bold text-slate-800 mb-1">Xác nhận xóa bài tập?</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Cô có chắc muốn xóa bài tập <strong>{deletingAssignment.title}</strong> không? Các bài nộp của học sinh đối với bài tập này cũng sẽ bị xóa.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingAssignment(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteAssignment}
                disabled={loading}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                {loading ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
