import { useState } from 'react';
import { usePuzzleStore } from '@/stores/puzzleStore';
import { generatePuzzlePDF } from '@/utils/pdfGenerator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const puzzle = usePuzzleStore((state) => state.puzzle);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !puzzle) return null;

  const handleExport = async (includeAnswers: boolean) => {
    setIsExporting(true);
    try {
      await generatePuzzlePDF(puzzle, includeAnswers);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBoth = async () => {
    setIsExporting(true);
    try {
      await generatePuzzlePDF(puzzle, false);
      await generatePuzzlePDF(puzzle, true);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4">PDF 내보내기</h2>

        <div className="space-y-3">
          <button
            onClick={() => handleExport(false)}
            disabled={isExporting}
            className="w-full px-4 py-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <div className="font-medium text-gray-900">빈 퍼즐</div>
            <div className="text-sm text-gray-500">풀기용 퍼즐 (정답 없음)</div>
          </button>

          <button
            onClick={() => handleExport(true)}
            disabled={isExporting}
            className="w-full px-4 py-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <div className="font-medium text-gray-900">정답지</div>
            <div className="text-sm text-gray-500">정답이 포함된 퍼즐</div>
          </button>

          <button
            onClick={handleExportBoth}
            disabled={isExporting}
            className="w-full px-4 py-3 text-left bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <div className="font-medium text-green-700">둘 다 내보내기</div>
            <div className="text-sm text-green-600">빈 퍼즐 + 정답지</div>
          </button>
        </div>

        {isExporting && (
          <div className="flex items-center justify-center mt-4">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-600">PDF 생성 중...</span>
          </div>
        )}

        <div className="flex justify-end mt-6">
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
