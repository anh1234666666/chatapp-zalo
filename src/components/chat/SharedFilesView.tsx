import React, { useState } from 'react';
import { FolderArchive, FileText, Image as ImageIcon, Download, Search, HardDrive } from 'lucide-react';
import { MessageAttachment } from '../../types/database';

interface SharedFilesViewProps {
  attachments: MessageAttachment[];
}

export const SharedFilesView: React.FC<SharedFilesViewProps> = ({ attachments }) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'doc'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = attachments.filter((att) => {
    const isImg = att.file_type.startsWith('image/');
    if (filterType === 'image' && !isImg) return false;
    if (filterType === 'doc' && isImg) return false;
    return att.file_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-slate-900 select-none overflow-hidden p-6">
      
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderArchive className="w-6 h-6 text-blue-600" />
              <span>Kho Tệp & Tài Liệu Đã Chia Sẻ</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng hợp hình ảnh, tài liệu và tập tin đã gửi nhận trong các cuộc trò chuyện
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên file..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Tất cả ({attachments.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Hình ảnh
          </button>
          <button
            onClick={() => setFilterType('doc')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'doc'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Tài liệu & Tệp khác
          </button>
        </div>
      </div>

      {/* Attachments Grid */}
      <div className="max-w-5xl w-full mx-auto flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-400">
            <HardDrive className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Chưa có tệp nào</h4>
            <p className="text-xs mt-1">Các hình ảnh và tệp bạn gửi trong phòng chat sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((att) => {
              const isImg = att.file_type.startsWith('image/');
              return (
                <div
                  key={att.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3 group hover:border-blue-400 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                    {isImg ? (
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {att.file_name}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatFileSize(att.file_size)}</p>
                  </div>

                  <a
                    href={att.file_url}
                    download={att.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Tải xuống"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
