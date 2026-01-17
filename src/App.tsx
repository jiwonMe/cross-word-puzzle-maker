import { useState, useEffect, useCallback } from 'react';
import { usePuzzleStore } from '@/stores/puzzleStore';
import { Header } from '@/components/Header/Header';
import { PuzzleGrid } from '@/components/Grid/PuzzleGrid';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { NewPuzzleModal } from '@/components/Modal/NewPuzzleModal';
import { ShareModal } from '@/components/Modal/ShareModal';
import { ExportModal } from '@/components/Modal/ExportModal';
import { SaveLoadModal } from '@/components/Modal/SaveLoadModal';
import { fetchWordRecommendations } from '@/services/llmApi';
import { decodePuzzleFromUrl } from '@/utils/urlEncoder';
import { savePuzzle } from '@/services/storage';

type ModalType = 'new' | 'share' | 'export' | 'save' | 'load' | null;

function App() {
  const { puzzle, createPuzzle, setPuzzle } = usePuzzleStore();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    const urlPuzzle = decodePuzzleFromUrl(window.location.href);
    if (urlPuzzle) {
      setPuzzle(urlPuzzle);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (!puzzle) {
      createPuzzle();
    }
  }, []);

  const handleFetchRecommendations = useCallback(
    async (length: number, constraints: { position: number; char: string }[]) => {
      return fetchWordRecommendations({ length, constraints });
    },
    []
  );

  const handleSave = useCallback(() => {
    if (puzzle) {
      savePuzzle(puzzle);
      alert('저장되었습니다.');
    }
  }, [puzzle]);

  const handleNewPuzzle = useCallback((rows: number, cols: number, title: string) => {
    createPuzzle({ rows, cols }, title);
  }, [createPuzzle]);

  return (
    <div className="flex flex-col h-screen">
      <Header
        onNewPuzzle={() => setActiveModal('new')}
        onSave={handleSave}
        onShare={() => setActiveModal('share')}
        onExportPDF={() => setActiveModal('export')}
      />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 bg-gray-50 overflow-auto">
        <div className="flex-1 overflow-auto min-h-0 flex">
          <div className="m-auto">
            <PuzzleGrid />
          </div>
        </div>
        <Sidebar onFetchRecommendations={handleFetchRecommendations} />
      </main>

      <NewPuzzleModal
        isOpen={activeModal === 'new'}
        onClose={() => setActiveModal(null)}
        onCreate={handleNewPuzzle}
      />
      <ShareModal
        isOpen={activeModal === 'share'}
        onClose={() => setActiveModal(null)}
      />
      <ExportModal
        isOpen={activeModal === 'export'}
        onClose={() => setActiveModal(null)}
      />
      <SaveLoadModal
        isOpen={activeModal === 'save' || activeModal === 'load'}
        onClose={() => setActiveModal(null)}
        mode={activeModal === 'save' ? 'save' : 'load'}
      />
    </div>
  );
}

export default App;
