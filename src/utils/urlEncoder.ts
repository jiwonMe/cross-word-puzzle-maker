import LZString from 'lz-string';
import type { Puzzle, Cell } from '@/types/puzzle';

interface CompressedPuzzle {
  t: string;
  s: [number, number];
  g: string;
  w: {
    n: number;
    d: 'a' | 'd';
    t: string;
    c: string;
  }[];
}

function encodeGrid(grid: Cell[][]): string {
  let result = '';
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isBlack) {
        result += '#';
      } else if (cell.value) {
        result += cell.value;
      } else {
        result += '.';
      }
    }
  }
  return result;
}

function decodeGrid(encoded: string, rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  let index = 0;

  for (let row = 0; row < rows; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      const char = encoded[index++] || '.';
      rowCells.push({
        row,
        col,
        value: char === '#' || char === '.' ? '' : char,
        isBlack: char === '#',
      });
    }
    grid.push(rowCells);
  }

  return grid;
}

export function encodePuzzleToUrl(puzzle: Puzzle): string {
  const compressed: CompressedPuzzle = {
    t: puzzle.title,
    s: [puzzle.size.rows, puzzle.size.cols],
    g: encodeGrid(puzzle.grid),
    w: puzzle.words.map((w) => ({
      n: w.number,
      d: w.direction === 'across' ? 'a' : 'd',
      t: w.text,
      c: w.clue,
    })),
  };

  const jsonStr = JSON.stringify(compressed);
  const encodedData = LZString.compressToEncodedURIComponent(jsonStr);

  return `${window.location.origin}${window.location.pathname}?p=${encodedData}`;
}

export function decodePuzzleFromUrl(url: string): Puzzle | null {
  try {
    const urlObj = new URL(url);
    const encodedData = urlObj.searchParams.get('p');

    if (!encodedData) return null;

    const jsonStr = LZString.decompressFromEncodedURIComponent(encodedData);
    if (!jsonStr) return null;

    const compressed: CompressedPuzzle = JSON.parse(jsonStr);
    const [rows, cols] = compressed.s;
    const grid = decodeGrid(compressed.g, rows, cols);

    const puzzle: Puzzle = {
      id: `imported-${Date.now()}`,
      title: compressed.t,
      size: { rows, cols },
      grid,
      words: compressed.w.map((w) => ({
        id: `${w.d === 'a' ? 'across' : 'down'}-${w.n}`,
        number: w.n,
        direction: w.d === 'a' ? 'across' : 'down',
        text: w.t,
        clue: w.c,
        startPosition: { row: 0, col: 0 },
        length: w.t.length,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return puzzle;
  } catch (error) {
    console.error('Failed to decode puzzle from URL:', error);
    return null;
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
