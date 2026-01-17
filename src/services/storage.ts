import type { Puzzle } from '@/types/puzzle';

const STORAGE_KEY = 'crossword-puzzles';

export function savePuzzle(puzzle: Puzzle): void {
  const puzzles = loadAllPuzzles();
  const existingIndex = puzzles.findIndex((p) => p.id === puzzle.id);

  if (existingIndex >= 0) {
    puzzles[existingIndex] = puzzle;
  } else {
    puzzles.push(puzzle);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
}

export function loadPuzzle(id: string): Puzzle | null {
  const puzzles = loadAllPuzzles();
  return puzzles.find((p) => p.id === id) || null;
}

export function loadAllPuzzles(): Puzzle[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deletePuzzle(id: string): void {
  const puzzles = loadAllPuzzles().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
}
