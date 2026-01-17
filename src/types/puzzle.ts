export interface Position {
  row: number;
  col: number;
}

export type Direction = 'across' | 'down';

export interface Cell {
  row: number;
  col: number;
  value: string;
  isBlack: boolean;
  number?: number;
}

export interface Word {
  id: string;
  number: number;
  direction: Direction;
  text: string;
  clue: string;
  startPosition: Position;
  length: number;
}

export interface PuzzleSize {
  rows: number;
  cols: number;
}

export interface Puzzle {
  id: string;
  title: string;
  size: PuzzleSize;
  grid: Cell[][];
  words: Word[];
  createdAt: string;
  updatedAt: string;
}

export interface Selection {
  position: Position | null;
  direction: Direction;
}

export const GRID_SIZE_MIN = 5;
export const GRID_SIZE_MAX = 20;
export const GRID_SIZE_DEFAULT = 7;
