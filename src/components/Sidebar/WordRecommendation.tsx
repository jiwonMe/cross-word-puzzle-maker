import { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { usePuzzleStore } from '@/stores/puzzleStore';
import { getWordConstraints, getWordFromCells } from '@/utils/gridUtils';

interface WordRecommendationProps {
  onFetchRecommendations?: (
    length: number,
    constraints: { position: number; char: string }[]
  ) => Promise<string[]>;
}

export function WordRecommendation({ onFetchRecommendations }: WordRecommendationProps) {
  const { puzzle, wordCells, applyWord } = usePuzzleStore();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentWord = useMemo(() => {
    if (!puzzle || wordCells.length === 0) return '';
    return getWordFromCells(puzzle.grid, wordCells);
  }, [puzzle, wordCells]);

  const hasEmptyCell = useMemo(() => {
    if (!puzzle || wordCells.length === 0) return false;
    return wordCells.some(({ row, col }) => !puzzle.grid[row][col].value);
  }, [puzzle, wordCells]);

  const hasFilledCell = useMemo(() => {
    if (!puzzle || wordCells.length === 0) return false;
    return wordCells.some(({ row, col }) => !!puzzle.grid[row][col].value);
  }, [puzzle, wordCells]);

  const existingWords = useMemo(() => {
    if (!puzzle) return new Set<string>();
    return new Set(
      puzzle.words
        .map((w) => w.text.toUpperCase())
        .filter((text) => text.length > 0 && !text.includes(''))
    );
  }, [puzzle]);

  const minWordLength = useMemo(() => {
    return existingWords.size === 0 ? 3 : 2;
  }, [existingWords]);

  useEffect(() => {
    if (!puzzle || wordCells.length === 0) {
      setRecommendations([]);
      setSelectedIndex(null);
      return;
    }

    if (wordCells.length < minWordLength) {
      setRecommendations([]);
      setSelectedIndex(null);
      return;
    }

    if (!hasEmptyCell || !hasFilledCell) {
      setRecommendations([]);
      setSelectedIndex(null);
      return;
    }

    const fetchRecommendations = async () => {
      if (!onFetchRecommendations) {
        setRecommendations(['야시장', '후시녹음', '시발점']);
        return;
      }

      setIsLoading(true);
      try {
        const constraints = getWordConstraints(puzzle.grid, wordCells);
        const words = await onFetchRecommendations(wordCells.length, constraints);
        
        const uniqueWords = [...new Set(words)];
        const filteredWords = uniqueWords.filter((word) => {
          const upperWord = word.toUpperCase();
          if (existingWords.has(upperWord)) return false;
          if (upperWord === currentWord.toUpperCase()) return false;
          return true;
        });
        
        setRecommendations(filteredWords);
        setSelectedIndex(null);
      } catch {
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [puzzle, wordCells, minWordLength, hasEmptyCell, hasFilledCell, currentWord, existingWords, onFetchRecommendations]);

  const handleWordClick = (word: string, index: number) => {
    setSelectedIndex(index);
    applyWord(word);
  };

  if (wordCells.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">추천단어</h3>
        <p className="text-sm text-gray-400">셀을 선택해주세요</p>
      </div>
    );
  }

  if (wordCells.length < minWordLength) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">추천단어</h3>
        <p className="text-sm text-gray-400">{minWordLength}글자 이상부터 추천합니다</p>
      </div>
    );
  }

  if (!hasEmptyCell) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">추천단어</h3>
        <p className="text-sm text-gray-400">단어가 이미 완성되었습니다</p>
      </div>
    );
  }

  if (!hasFilledCell) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">추천단어</h3>
        <p className="text-sm text-gray-400">글자를 입력하면 추천합니다</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">추천단어</h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recommendations.length > 0 ? (
        <ul className="space-y-1">
          {recommendations.map((word, index) => (
            <li key={index}>
              <button
                onClick={() => handleWordClick(word, index)}
                className={clsx(
                  'w-full px-3 py-2 text-left text-sm rounded-lg transition-colors',
                  'flex items-center gap-2',
                  {
                    'bg-green-500 text-white': selectedIndex === index,
                    'bg-gray-50 hover:bg-gray-100 text-gray-900': selectedIndex !== index,
                  }
                )}
              >
                <span className="text-xs text-gray-400 w-4">{index + 1}.</span>
                <span className="font-medium">{word}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">후보 없음</p>
      )}
    </div>
  );
}
