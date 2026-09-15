import React, { useState } from 'react';
import { Material, Student } from '../../types';
import { apiAdmin, apiUpload } from '../../lib/api';
import { useToast } from '../Toast';
import { DocumentViewerModal } from '../DocumentViewerModal';
import {
  Upload,
  FileText,
  Search,
  Eye,
  Download,
  Trash2,
  Edit,
  Plus,
  Image as ImageIcon,
  Presentation,
  CheckCircle,
  Users,
  X,
  FileUp,
} from 'lucide-react';

interface TeacherMaterialsProps {
  materials: Material[];
  students: Student[];
  onRefresh: () => void;
}

const TOPICS = [
  'Tất cả',
  'Văn bản - Thơ',
  'Văn bản - Truyện',
  'Tiếng Việt',
  'Tập làm văn',
  'Nghị luận xã hội',
  'Nghị luận văn học',
  'Đọc hiểu & Ôn thi',
  'Tài liệu bồi dưỡng HSG',
];

export const TeacherMaterials: React.FC<TeacherMaterialsProps> = ({ materials, students, onRefresh }) => {
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('Văn bản - Truyện');
  const [assignedType, setAssignedType] = useState<'all' | 'specific'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const { success, error } = useToast();

  const filteredMaterials = materials.filter(m => {
    const matchTopic = selectedTopic === 'Tất cả' || m.topic === selectedTopic;
    const matchSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTopic && matchSearch;
  });

  const handleOpenUpload = () => {
    setUploadFile(null);
    setTitle('');
    setDescription('');
    setTopic('Văn bản - Truyện');
    setAssignedType('all');
    setSelectedStudentIds([]);
    setShowUploadModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      if (!title) {
        // Auto fill title from file name without extension
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanTitle);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      error('Vui lòng chọn tệp tài liệu để tải lên');
      return;
    }
    if (!title.trim()) {
      error('Vui lòng nhập tiêu đề tài liệu');
      return;
    }

    try {
      setLoading(true);
      // 1. Upload real file to server
      const uploadRes = await apiUpload.uploadFile(uploadFile);

      // 2. Save material metadata to database
      await apiAdmin.createMaterial({
        title: title.trim(),
        description: description.trim(),
        topic,
        fileUrl: uploadRes.url,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        assignedType,
        assignedStudentIds: assignedType === 'specific' ? selectedStudentIds : [],
      });

      success('Tải lên tài liệu thành công!');
      setShowUploadModal(false);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Tải tài liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    try {
      setLoading(true);
      await apiAdmin.updateMaterial(editingMaterial.id, {
        title: editingMaterial.title.trim(),
        description: editingMaterial.description?.trim(),
        topic: editingMaterial.topic,
        assignedType: editingMaterial.assignedType,
        assignedStudentIds: editingMaterial.assignedType === 'specific' ? editingMaterial.assignedStudentIds : [],
      });
      success('Cập nhật tài liệu thành công!');
      setEditingMaterial(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Cập nhật tài liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deletingMaterial) return;
    try {
      setLoading(true);
      await apiAdmin.deleteMaterial(deletingMaterial.id);
      success('Đã xóa tài liệu');
      setDeletingMaterial(null);
      onRefresh();
    } catch (err: any) {
      error(err.message || 'Xóa tài liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (fileType.startsWith('image/') || /\.(jpg|png|webp|gif)$/i.test(fileName)) {
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    }
    if (/\.(ppt|pptx)$/i.test(fileName)) {
      return <Presentation className="w-5 h-5 text-amber-500" />;
    }
    return <FileText className="w-5 h-5 text-sky-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Kho tài liệu học tập môn Ngữ văn</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-bold text-rose-600">{materials.length}</span> tài liệu đã tải lên
          </p>
        </div>

        <button
          onClick={handleOpenUpload}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-200 hover:from-rose-600 hover:to-pink-600 transition"
        >
          <Upload className="w-4 h-4" />
          <span>Tải tài liệu mới lên</span>
        </button>
      </div>

      {/* Search & Topic Filters */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề tài liệu, tên tệp tin, mô tả..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>

        {/* Topic Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TOPICS.map(tp => (
            <button
              key={tp}
              onClick={() => setSelectedTopic(tp)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedTopic === tp
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-rose-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            {materials.length === 0 ? 'Kho tài liệu hiện đang trống' : 'Không có tài liệu nào trong chuyên đề này'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {materials.length === 0
              ? 'Cô có thể tải lên tệp PDF bài giảng, đề thi Word, slide PowerPoint hoặc hình ảnh sơ đồ tư duy cho học sinh nhé!'
              : 'Hãy thử chọn chuyên đề khác hoặc xóa từ khóa tìm kiếm.'}
          </p>
          {materials.length === 0 && (
            <button
              onClick={handleOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Tải tài liệu đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                    {getFileIcon(m.fileName, m.fileType)}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                    {m.topic}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1.5">{m.title}</h4>
                {m.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{m.description}</p>
                )}

                <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[180px]">{m.fileName}</span>
                    <span>{formatFileSize(m.fileSize)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {m.assignedType === 'all'
                        ? 'Giao cho toàn bộ học sinh'
                        : `Giao cho ${m.assignedStudentIds?.length || 0} học sinh`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewMaterial(m)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem</span>
                  </button>
                  <a
                    href={m.fileUrl}
                    download={m.fileName}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Tải tệp tin về máy"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingMaterial(m)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                    title="Sửa thông tin tài liệu"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingMaterial(m)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-rose-500" />
                <span>Tải lên tài liệu học tập mới</span>
              </h4>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 mt-5">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn tệp tin (PDF, Word, PowerPoint, Hình ảnh...) *
                </label>
                <div className="border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-3xl p-6 text-center bg-rose-50/30 transition cursor-pointer relative">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
                      <FileUp className="w-6 h-6" />
                    </div>
                    {uploadFile ? (
                      <div>
                        <p className="text-sm font-bold text-rose-700">{uploadFile.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(uploadFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700">Kéo thả tệp vào đây hoặc nhấn để duyệt tệp</p>
                        <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ PDF, Word, PowerPoint, Ảnh (Tối đa 50MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề tài liệu *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Dàn ý chi tiết bài thơ Đồng chí"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề môn Văn *</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  {TOPICS.filter(t => t !== 'Tất cả').map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả / Lời dặn dò của Cô</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ví dụ: Các em đọc kỹ các luận điểm và ví dụ dẫn chứng trong tài liệu này nhé..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Assignment Target */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phân quyền xem tài liệu</label>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setAssignedType('all')}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold border text-center transition ${
                      assignedType === 'all'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Giao cho tất cả HS ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignedType('specific')}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold border text-center transition ${
                      assignedType === 'specific'
                        ? 'bg-purple-50 border-purple-300 text-purple-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Chọn từng học sinh cụ thể
                  </button>
                </div>

                {assignedType === 'specific' && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto space-y-1.5">
                    {students.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Chưa có học sinh nào trong hệ thống</p>
                    ) : (
                      students.map(s => {
                        const isChecked = selectedStudentIds.includes(s.id);
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
                                  setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                } else {
                                  setSelectedStudentIds(prev => [...prev, s.id]);
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
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
                >
                  {loading ? 'Đang tải lên...' : 'Lưu tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-slate-800">Sửa thông tin tài liệu</h4>
              <button onClick={() => setEditingMaterial(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMaterial} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  required
                  value={editingMaterial.title}
                  onChange={e => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề *</label>
                <select
                  value={editingMaterial.topic}
                  onChange={e => setEditingMaterial({ ...editingMaterial, topic: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  {TOPICS.filter(t => t !== 'Tất cả').map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả / Lời dặn dò</label>
                <textarea
                  rows={3}
                  value={editingMaterial.description || ''}
                  onChange={e => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-sm"
                >
                  {loading ? 'Đang lưu...' : 'Lưu cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100">
            <h4 className="text-base font-bold text-slate-800 mb-1">Xác nhận xóa tài liệu?</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Cô có chắc muốn xóa tài liệu <strong>{deletingMaterial.title}</strong> không?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingMaterial(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteMaterial}
                disabled={loading}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                {loading ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <DocumentViewerModal material={previewMaterial} onClose={() => setPreviewMaterial(null)} />
    </div>
  );
};
