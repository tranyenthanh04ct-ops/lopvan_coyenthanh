import React from 'react';
import { Material } from '../types';
import { X, Download, FileText, ExternalLink, Image as ImageIcon, Presentation, FileCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface DocumentViewerModalProps {
  material: Material | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ material, onClose }) => {
  if (!material) return null;

  const isPdf = material.fileType.includes('pdf') || material.fileName.toLowerCase().endsWith('.pdf');
  const isImage = material.fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(material.fileName);
  const isOffice = /\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(material.fileName);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100/80 bg-rose-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-semibold shrink-0">
              {isPdf && <FileText className="w-5 h-5" />}
              {isImage && <ImageIcon className="w-5 h-5" />}
              {isOffice && <Presentation className="w-5 h-5" />}
              {!isPdf && !isImage && !isOffice && <FileCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{material.title}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="bg-rose-100/70 text-rose-700 px-2 py-0.5 rounded-full font-medium">{material.topic}</span>
                <span>•</span>
                <span>{material.fileName}</span>
                <span>•</span>
                <span>{formatFileSize(material.fileSize)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={material.fileUrl}
              download={material.fileName}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm"
              title="Tải tài liệu về máy"
            >
              <Download className="w-4 h-4" />
              <span>Tải về</span>
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-rose-100/50 transition"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 min-h-[400px] flex items-center justify-center">
          {isImage ? (
            <div className="flex flex-col items-center">
              <img
                src={material.fileUrl}
                alt={material.title}
                className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-md border border-slate-200"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[68vh] rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-white">
              <iframe
                src={`${material.fileUrl}#toolbar=1`}
                className="w-full h-full border-none"
                title={material.title}
              />
            </div>
          ) : (
            <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-rose-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-2">{material.fileName}</h4>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                {material.description || 'Tài liệu học tập được biên soạn bởi Cô Yến Thanh.'}
              </p>
              <p className="text-xs text-slate-400 mb-5">
                Định dạng tệp tin này tốt nhất nên được mở bằng ứng dụng chuyên dụng (Microsoft Word / PowerPoint).
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href={material.fileUrl}
                  download={material.fileName}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md shadow-rose-200 hover:from-rose-600 hover:to-pink-600 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp tin về máy</span>
                </a>
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở tab mới</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Description Footer */}
        {material.description && (
          <div className="px-6 py-3 bg-white border-t border-rose-100/60 text-xs text-slate-600 flex items-start gap-2">
            <span className="font-bold text-rose-600 shrink-0">Lời dặn của Cô:</span>
            <span className="leading-relaxed">{material.description}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
