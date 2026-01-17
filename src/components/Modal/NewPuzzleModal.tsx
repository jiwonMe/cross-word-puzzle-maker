import { useState } from 'react';
import { GRID_SIZE_MIN, GRID_SIZE_MAX, GRID_SIZE_DEFAULT } from '@/types/puzzle';

interface NewPuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rows: number, cols: number, title: string) => void;
}

export function NewPuzzleModal({ isOpen, onClose, onCreate }: NewPuzzleModalProps) {
  const [rows, setRows] = useState(GRID_SIZE_DEFAULT);
  const [cols, setCols] = useState(GRID_SIZE_DEFAULT);
  const [title, setTitle] = useState('새 퍼즐');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(rows, cols, title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4">새 퍼즐 만들기</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가로 (열)</label>
              <input
                type="number"
                min={GRID_SIZE_MIN}
                max={GRID_SIZE_MAX}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">세로 (행)</label>
              <input
                type="number"
                min={GRID_SIZE_MIN}
                max={GRID_SIZE_MAX}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            크기: {GRID_SIZE_MIN}x{GRID_SIZE_MIN} ~ {GRID_SIZE_MAX}x{GRID_SIZE_MAX}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
