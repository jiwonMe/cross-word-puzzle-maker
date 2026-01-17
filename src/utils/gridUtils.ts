import type { Cell, PuzzleSize, Position, Direction } from '@/types/puzzle';

export function createEmptyGrid(size: PuzzleSize, allBlack: boolean = true): Cell[][] {
  const grid: Cell[][] = [];
  for (let row = 0; row < size.rows; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < size.cols; col++) {
      rowCells.push({
        row,
        col,
        value: '',
        isBlack: allBlack,
      });
    }
    grid.push(rowCells);
  }
  return grid;
}

export function assignCellNumbers(grid: Cell[][]): Cell[][] {
  let number = 1;
  const newGrid: Cell[][] = grid.map((row) => row.map((cell) => ({ ...cell, number: undefined })));

  for (let row = 0; row < newGrid.length; row++) {
    for (let col = 0; col < newGrid[row].length; col++) {
      const cell = newGrid[row][col];
      if (cell.isBlack) continue;

      const needsNumber = isWordStart(newGrid, row, col, 'across') || isWordStart(newGrid, row, col, 'down');

      if (needsNumber) {
        newGrid[row][col] = { ...cell, number: number++ };
      }
    }
  }

  return newGrid;
}

function isWordStart(grid: Cell[][], row: number, col: number, direction: Direction): boolean {
  const cell = grid[row]?.[col];
  if (!cell || cell.isBlack) return false;

  if (direction === 'across') {
    const prevCell = grid[row]?.[col - 1];
    const nextCell = grid[row]?.[col + 1];
    const isStart = !prevCell || prevCell.isBlack;
    const hasNext = nextCell && !nextCell.isBlack;
    return isStart && hasNext;
  } else {
    const prevCell = grid[row - 1]?.[col];
    const nextCell = grid[row + 1]?.[col];
    const isStart = !prevCell || prevCell.isBlack;
    const hasNext = nextCell && !nextCell.isBlack;
    return isStart && hasNext;
  }
}

export function getWordCells(grid: Cell[][], position: Position, direction: Direction): Position[] {
  const cells: Position[] = [];
  const { row, col } = position;

  if (grid[row]?.[col]?.isBlack) return cells;

  if (direction === 'across') {
    let startCol = col;
    while (startCol > 0 && !grid[row][startCol - 1].isBlack) {
      startCol--;
    }

    let currentCol = startCol;
    while (currentCol < grid[row].length && !grid[row][currentCol].isBlack) {
      cells.push({ row, col: currentCol });
      currentCol++;
    }
  } else {
    let startRow = row;
    while (startRow > 0 && !grid[startRow - 1][col].isBlack) {
      startRow--;
    }

    let currentRow = startRow;
    while (currentRow < grid.length && !grid[currentRow][col].isBlack) {
      cells.push({ row: currentRow, col });
      currentRow++;
    }
  }

  return cells;
}

export function getNextCell(
  grid: Cell[][],
  position: Position,
  direction: Direction
): Position | null {
  const { row, col } = position;

  if (direction === 'across') {
    const nextCol = col + 1;
    if (nextCol < grid[row].length && !grid[row][nextCol].isBlack) {
      return { row, col: nextCol };
    }
  } else {
    const nextRow = row + 1;
    if (nextRow < grid.length && !grid[nextRow][col].isBlack) {
      return { row: nextRow, col };
    }
  }

  return null;
}

export function getNextCellPosition(
  grid: Cell[][],
  position: Position,
  direction: Direction
): Position | null {
  const { row, col } = position;

  if (direction === 'across') {
    const nextCol = col + 1;
    if (nextCol < grid[row].length) {
      return { row, col: nextCol };
    }
  } else {
    const nextRow = row + 1;
    if (nextRow < grid.length) {
      return { row: nextRow, col };
    }
  }

  return null;
}

export function getPrevCell(
  grid: Cell[][],
  position: Position,
  direction: Direction
): Position | null {
  const { row, col } = position;

  if (direction === 'across') {
    const prevCol = col - 1;
    if (prevCol >= 0 && !grid[row][prevCol].isBlack) {
      return { row, col: prevCol };
    }
  } else {
    const prevRow = row - 1;
    if (prevRow >= 0 && !grid[prevRow][col].isBlack) {
      return { row: prevRow, col };
    }
  }

  return null;
}

export function getWordFromCells(grid: Cell[][], cells: Position[]): string {
  return cells.map(({ row, col }) => grid[row][col].value || '').join('');
}

export function getLineCells(grid: Cell[][], position: Position, direction: Direction): Position[] {
  const cells: Position[] = [];
  const { row, col } = position;

  if (direction === 'across') {
    for (let c = 0; c < grid[row].length; c++) {
      cells.push({ row, col: c });
    }
  } else {
    for (let r = 0; r < grid.length; r++) {
      cells.push({ row: r, col });
    }
  }

  return cells;
}

export function getWordConstraints(
  grid: Cell[][],
  cells: Position[]
): { position: number; char: string }[] {
  const constraints: { position: number; char: string }[] = [];

  cells.forEach((cell, index) => {
    const value = grid[cell.row][cell.col].value;
    if (value) {
      constraints.push({ position: index, char: value });
    }
  });

  return constraints;
}
