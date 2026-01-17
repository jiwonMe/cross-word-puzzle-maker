import { usePuzzleStore } from '@/stores/puzzleStore';

interface HeaderProps {
  onSave?: () => void;
  onShare?: () => void;
  onExportPDF?: () => void;
  onNewPuzzle?: () => void;
}

export function Header({ onSave, onShare, onExportPDF, onNewPuzzle }: HeaderProps) {
  const puzzle = usePuzzleStore((state) => state.puzzle);

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 lg:px-6 lg:py-4 border-b border-gray-200 bg-white gap-3 sm:gap-0">
      <div className="flex items-center gap-2 lg:gap-4 w-full sm:w-auto justify-between sm:justify-start">
        <h1 className="text-lg lg:text-xl font-bold text-gray-900">십자말풀이</h1>
        {puzzle && (
          <span className="text-xs lg:text-sm text-gray-500">
            {puzzle.size.cols} x {puzzle.size.rows}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={onNewPuzzle}
          className="px-2 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          새 퍼즐
        </button>
        <button
          onClick={onSave}
          className="px-2 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          저장
        </button>
        <button
          onClick={onShare}
          className="px-2 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          공유
        </button>
        <button
          onClick={onExportPDF}
          className="px-2 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
        >
          PDF
        </button>
      </div>
    </header>
  );
}
