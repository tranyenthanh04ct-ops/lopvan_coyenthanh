import React, { useState } from 'react';
import { Student } from '../../types';
import { apiAdmin } from '../../lib/api';
import { useToast } from '../Toast';
import { Search, Plus, Edit2, Trash2, Lock, Unlock, Key, UserCheck, ShieldAlert, X } from 'lucide-react';

interface TeacherStudentsProps {
  students: Student[];
  onRefresh: () => void;
}

export const TeacherStudents: React.FC<TeacherStudentsProps> = ({ students, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formClassRoom, setFormClassRoom] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Edit states
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editClassRoom, setEditClassRoom] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');

  const { success, error } = useToast();

  // Unique classes list
  const classesList = Array.from(new Set(students.map(s => s.classRoom).filter(Boolean)));

  // Filtered students
  const filteredStudents = students.filter(s => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.classRoom && s.classRoom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchClass = selectedClass === 'all' || s.classRoom === selectedClass;
    return matchSearch && matchClass;
  });

  const handleOpenAddModal = () => {
    setFormFullName('');
    setFormUsername('');
    setFormPassword('');
    setFormClassRoom('');
    setFormParentPhone('');
    setFormNotes('');
    setShowAddModal(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formUsername.trim() || !formPassword.trim() || !formClassRoom.trim()) {
      error('Vui lòng điền đầy đủ: Họ tên, Tên đăng nhập, Mật khẩu và Lớp học');
      return;
    }

    try {
      setLoading(true);
      await apiAdmin.createStudent({
        fullName: formFullName.trim(),
        username: formUsername.trim(),
        password: formPassword.trim(),
        classRoom: formClassRoom.trim(),
        parentPhone: formParentPhone.trim(),
        notes: formNotes.trim(),
      });
      success(`Đã thêm học sinh ${formFullName.trim()} thành công!`);
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Thêm học sinh thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditFullName(student.fullName);
    setEditUsername(student.username);
    setEditClassRoom(student.classRoom);
    setEditParentPhone(student.parentPhone || '');
    setEditNotes(student.notes || '');
    setEditNewPassword('');
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editFullName.trim() || !editUsername.trim() || !editClassRoom.trim()) {
      error('Vui lòng không để trống Họ tên, Tên đăng nhập và Lớp');
      return;
    }

    try {
      setLoading(true);
      await apiAdmin.updateStudent(editingStudent.id, {
        fullName: editFullName.trim(),
        username: editUsername.trim(),
        classRoom: editClassRoom.trim(),
        parentPhone: editParentPhone.trim(),
        notes: editNotes.trim(),
        newPassword: editNewPassword.trim() || undefined,
      });
      success(`Cập nhật thông tin học sinh ${editFullName.trim()} thành công!`);
      setEditingStudent(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (student: Student) => {
    try {
      const nextLocked = !student.isLocked;
      await apiAdmin.updateStudent(student.id, { isLocked: nextLocked });
      success(nextLocked ? `Đã tạm khóa tài khoản của ${student.fullName}` : `Đã mở khóa tài khoản của ${student.fullName}`);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Thao tác khóa/mở khóa thất bại');
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    try {
      setLoading(true);
      await apiAdmin.deleteStudent(deletingStudent.id);
      success(`Đã xóa học sinh ${deletingStudent.fullName}`);
      setDeletingStudent(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Xóa học sinh thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Quản lý danh sách học sinh</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-bold text-rose-600">{students.length}</span> học sinh
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-200 hover:from-rose-600 hover:to-pink-600 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm học sinh mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh, tên đăng nhập hoặc lớp..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
          />
        </div>

        {classesList.length > 0 && (
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="all">Tất cả các lớp ({students.length})</option>
            {classesList.map(cls => (
              <option key={cls} value={cls}>
                Lớp {cls}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-rose-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <UserCheck className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            {students.length === 0 ? 'Chưa có học sinh nào trong hệ thống' : 'Không tìm thấy học sinh phù hợp'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {students.length === 0
              ? 'Cô hãy nhấn "Thêm học sinh mới" để tạo tài khoản, mật khẩu và thêm các em vào lớp học nhé!'
              : 'Hãy thử tìm kiếm bằng từ khóa hoặc bộ lọc lớp học khác.'}
          </p>
          {students.length === 0 && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học sinh mới ngay</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-rose-50/50 text-slate-700 text-xs font-bold border-b border-rose-100">
                <tr>
                  <th className="px-5 py-3.5">Học sinh</th>
                  <th className="px-5 py-3.5">Tên đăng nhập</th>
                  <th className="px-5 py-3.5">Lớp</th>
                  <th className="px-5 py-3.5">Liên hệ phụ huynh</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{student.fullName}</div>
                          {student.notes && (
                            <div className="text-[11px] text-slate-400 italic line-clamp-1">{student.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-purple-700">
                      @{student.username}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        {student.classRoom}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {student.parentPhone || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                    </td>
                    <td className="px-5 py-4">
                      {student.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                          <Lock className="w-3 h-3" />
                          <span>Tạm khóa</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                          <Unlock className="w-3 h-3" />
                          <span>Đang hoạt động</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleLock(student)}
                          className={`p-2 rounded-xl text-xs transition ${
                            student.isLocked
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={student.isLocked ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                        >
                          {student.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition"
                          title="Sửa thông tin / Đổi mật khẩu"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(student)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" />
                <span>Thêm học sinh mới</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={e => setFormFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Phương Linh"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="Ví dụ: linh.9a1"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder="Mật khẩu cho HS..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp học *</label>
                  <input
                    type="text"
                    required
                    value={formClassRoom}
                    onChange={e => setFormClassRoom(e.target.value)}
                    placeholder="Ví dụ: 9A1 hoặc Lớp 12 Văn"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT phụ huynh (tùy chọn)</label>
                  <input
                    type="tel"
                    value={formParentPhone}
                    onChange={e => setFormParentPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú của Cô (tùy chọn)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ghi chú thêm về năng lực, sở trường môn văn..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
                >
                  {loading ? 'Đang tạo...' : 'Tạo tài khoản học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" />
                <span>Sửa thông tin & Đổi mật khẩu học sinh</span>
              </h4>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp học *</label>
                  <input
                    type="text"
                    required
                    value={editClassRoom}
                    onChange={e => setEditClassRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Đổi mật khẩu mới cho học sinh (Để trống nếu không đổi)</span>
                </label>
                <input
                  type="text"
                  value={editNewPassword}
                  onChange={e => setEditNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới nếu muốn đổi..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-purple-200 bg-purple-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SĐT phụ huynh</label>
                <input
                  type="tel"
                  value={editParentPhone}
                  onChange={e => setEditParentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-sm"
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">Xác nhận xóa học sinh?</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Cô có chắc muốn xóa học sinh <strong>{deletingStudent.fullName}</strong> (@{deletingStudent.username}) không? Thao tác này cũng sẽ xóa các bài nộp liên quan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
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
