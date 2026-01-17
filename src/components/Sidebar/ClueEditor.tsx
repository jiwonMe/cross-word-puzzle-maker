import { usePuzzleStore } from '@/stores/puzzleStore';

export function ClueEditor() {
  const { puzzle, updateWordClue } = usePuzzleStore();

  if (!puzzle || puzzle.words.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">힌트</h3>
        <p className="text-sm text-gray-400">단어를 입력하면 힌트를 작성할 수 있습니다</p>
      </div>
    );
  }

  const acrossWords = puzzle.words.filter((w) => w.direction === 'across');
  const downWords = puzzle.words.filter((w) => w.direction === 'down');

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 max-h-[400px] overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">힌트</h3>

      {acrossWords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            가로
          </h4>
          <ul className="space-y-2">
            {acrossWords.map((word) => (
              <li key={word.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 w-4">{word.number}.</span>
                  <span className="text-sm font-medium text-gray-700">
                    {word.text || `(${word.length}글자)`}
                  </span>
                </div>
                <input
                  type="text"
                  value={word.clue}
                  onChange={(e) => updateWordClue(word.id, e.target.value)}
                  placeholder="힌트를 입력하세요"
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {downWords.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            세로
          </h4>
          <ul className="space-y-2">
            {downWords.map((word) => (
              <li key={word.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 w-4">{word.number}.</span>
                  <span className="text-sm font-medium text-gray-700">
                    {word.text || `(${word.length}글자)`}
                  </span>
                </div>
                <input
                  type="text"
                  value={word.clue}
                  onChange={(e) => updateWordClue(word.id, e.target.value)}
                  placeholder="힌트를 입력하세요"
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
