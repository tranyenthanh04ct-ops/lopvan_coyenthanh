import React, { useState } from 'react';
import { Announcement } from '../../types';
import { apiAdmin } from '../../lib/api';
import { useToast } from '../Toast';
import { Bell, Plus, Trash2, Megaphone, Calendar, X } from 'lucide-react';

interface TeacherAnnouncementsProps {
  announcements: Announcement[];
  onRefresh: () => void;
}

export const TeacherAnnouncements: React.FC<TeacherAnnouncementsProps> = ({
  announcements,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo');
      return;
    }

    try {
      setLoading(true);
      await apiAdmin.createAnnouncement(title.trim(), content.trim());
      success('Đã đăng thông báo mới cho học sinh!');
      setShowAddModal(false);
      setTitle('');
      setContent('');
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Đăng thông báo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiAdmin.deleteAnnouncement(id);
      success('Đã xóa thông báo');
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Xóa thông báo thất bại');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Thông báo từ Cô Yến Thanh</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Đăng lời nhắn, lịch học, dặn dò ôn thi để học sinh nhìn thấy ngay khi đăng nhập
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-200 hover:from-rose-600 hover:to-pink-600 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo thông báo mới</span>
        </button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-rose-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <Megaphone className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">Chưa có thông báo nào</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Cô có thể đăng lời nhắn nhủ, dặn dò bài vở hoặc lịch học trực tuyến tại đây.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo thông báo đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs hover:shadow-md transition flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(item.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                title="Xóa thông báo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-500" />
                <span>Đăng thông báo mới cho học sinh</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Nhắc nhở nộp bài phân tích văn học trước 22h tối nay"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung thông báo *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Nhập nội dung dặn dò chi tiết của Cô..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
                >
                  {loading ? 'Đang đăng...' : 'Đăng thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
