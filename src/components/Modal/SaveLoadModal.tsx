import { useState, useEffect } from 'react';
import { usePuzzleStore } from '@/stores/puzzleStore';
import { loadAllPuzzles, savePuzzle, deletePuzzle } from '@/services/storage';
import type { Puzzle } from '@/types/puzzle';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
}

export function SaveLoadModal({ isOpen, onClose, mode }: SaveLoadModalProps) {
  const { puzzle, setPuzzle } = usePuzzleStore();
  const [savedPuzzles, setSavedPuzzles] = useState<Puzzle[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSavedPuzzles(loadAllPuzzles());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!puzzle) return;
    savePuzzle(puzzle);
    setSavedPuzzles(loadAllPuzzles());
    onClose();
  };

  const handleLoad = (selectedPuzzle: Puzzle) => {
    setPuzzle(selectedPuzzle);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 퍼즐을 삭제하시겠습니까?')) {
      deletePuzzle(id);
      setSavedPuzzles(loadAllPuzzles());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {mode === 'save' ? '퍼즐 저장' : '퍼즐 불러오기'}
        </h2>

        {mode === 'save' && puzzle && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <div className="font-medium text-gray-900">{puzzle.title}</div>
            <div className="text-sm text-gray-500">
              {puzzle.size.cols}x{puzzle.size.rows} | {puzzle.words.length}개 단어
            </div>
            <button
              onClick={handleSave}
              className="mt-3 w-full px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              저장하기
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {savedPuzzles.length > 0 ? (
            <ul className="space-y-2">
              {savedPuzzles.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{p.title}</div>
                    <div className="text-xs text-gray-500">
                      {p.size.cols}x{p.size.rows} | {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    {mode === 'load' && (
                      <button
                        onClick={() => handleLoad(p)}
                        className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
                      >
                        불러오기
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">저장된 퍼즐이 없습니다</p>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
