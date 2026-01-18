import { create } from 'zustand';
import type { Cell, Direction, Position, Puzzle, PuzzleSize, Word } from '@/types/puzzle';
import { GRID_SIZE_DEFAULT } from '@/types/puzzle';
import { createEmptyGrid, assignCellNumbers, getWordCells, getNextCell, getPrevCell, getNextCellPosition } from '@/utils/gridUtils';

interface PuzzleState {
  puzzle: Puzzle | null;
  selection: {
    position: Position | null;
    direction: Direction;
  };
  wordCells: Position[];

  createPuzzle: (size?: PuzzleSize, title?: string) => void;
  selectCell: (position: Position, skipFinalize?: boolean) => void;
  toggleDirection: () => void;
  toggleBlackCell: (position: Position) => void;
  setCellValue: (position: Position, value: string, skipActivateNext?: boolean) => void;
  moveToNextCell: () => void;
  moveToNextCellAndActivate: () => void;
  moveToPrevCell: () => void;
  moveToPrevCellAndClear: () => void;
  clearCellValue: (position: Position) => void;
  moveInDirection: (dir: 'up' | 'down' | 'left' | 'right') => void;
  applyWord: (word: string) => void;
  updateWordClue: (wordId: string, clue: string) => void;
  resizeGrid: (size: PuzzleSize) => void;
  setPuzzle: (puzzle: Puzzle) => void;
  clearPuzzle: () => void;
  finalizeEmptyCells: (excludePosition?: Position) => void;
  commitComposingAndFinalize: (composingPosition: Position, composingValue: string, nextPosition?: Position) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function convertEmptyCellsToBlack(grid: Cell[][], excludePosition?: Position): Cell[][] {
  return grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (excludePosition && excludePosition.row === rowIndex && excludePosition.col === colIndex) {
        return cell;
      }
      if (!cell.isBlack && !cell.value) {
        return { ...cell, isBlack: true };
      }
      return cell;
    })
  );
}

function extractWords(grid: Cell[][]): Word[] {
  const words: Word[] = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      if (cell.number === undefined) continue;

      const acrossCells = getWordCells(grid, { row, col }, 'across');
      if (acrossCells.length > 1 && acrossCells[0].row === row && acrossCells[0].col === col) {
        const text = acrossCells.map((c) => grid[c.row][c.col].value).join('');
        words.push({
          id: `across-${cell.number}`,
          number: cell.number,
          direction: 'across',
          text,
          clue: '',
          startPosition: { row, col },
          length: acrossCells.length,
        });
      }

      const downCells = getWordCells(grid, { row, col }, 'down');
      if (downCells.length > 1 && downCells[0].row === row && downCells[0].col === col) {
        const text = downCells.map((c) => grid[c.row][c.col].value).join('');
        words.push({
          id: `down-${cell.number}`,
          number: cell.number,
          direction: 'down',
          text,
          clue: '',
          startPosition: { row, col },
          length: downCells.length,
        });
      }
    }
  }

  return words;
}

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  puzzle: null,
  selection: {
    position: null,
    direction: 'across',
  },
  wordCells: [],

  createPuzzle: (size = { rows: GRID_SIZE_DEFAULT, cols: GRID_SIZE_DEFAULT }, title = '새 퍼즐') => {
    const grid = createEmptyGrid(size, true);
    const puzzle: Puzzle = {
      id: generateId(),
      title,
      size,
      grid,
      words: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ puzzle, selection: { position: null, direction: 'across' }, wordCells: [] });
  },

  selectCell: (position, skipFinalize?: boolean) => {
    const { puzzle, selection } = get();
    console.log('[selectCell] called, position:', position, 'skipFinalize:', skipFinalize);
    if (!puzzle) return;

    let currentGrid = puzzle.grid;
    
    if (!skipFinalize) {
      console.log('[selectCell] converting empty cells to black');
      currentGrid = convertEmptyCellsToBlack(currentGrid, position);
    }

    const cell = currentGrid[position.row]?.[position.col];
    if (!cell) return;

    if (cell.isBlack) {
      const newGrid = currentGrid.map((row, rowIndex) =>
        row.map((c, colIndex) => {
          if (rowIndex === position.row && colIndex === position.col) {
            return { ...c, isBlack: false };
          }
          return c;
        })
      );

      const numberedGrid = assignCellNumbers(newGrid);
      const words = extractWords(numberedGrid);
      const wordCells = getWordCells(numberedGrid, position, selection.direction);

      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        selection: { position, direction: selection.direction },
        wordCells,
      });
      return;
    }

    const isSameCell =
      selection.position?.row === position.row && selection.position?.col === position.col;

    const newDirection = isSameCell
      ? selection.direction === 'across'
        ? 'down'
        : 'across'
      : selection.direction;

    const numberedGrid = assignCellNumbers(currentGrid);
    const words = extractWords(numberedGrid);
    const wordCells = getWordCells(numberedGrid, position, newDirection);

    set({
      puzzle: {
        ...puzzle,
        grid: numberedGrid,
        words,
        updatedAt: new Date().toISOString(),
      },
      selection: { position, direction: newDirection },
      wordCells,
    });
  },

  toggleDirection: () => {
    const { puzzle, selection } = get();
    console.log('[toggleDirection] called, position:', selection.position, 'direction:', selection.direction);
    if (!puzzle || !selection.position) return;

    const newDirection = selection.direction === 'across' ? 'down' : 'across';
    console.log('[toggleDirection] newDirection:', newDirection);
    const wordCells = getWordCells(puzzle.grid, selection.position, newDirection);

    set({
      selection: { ...selection, direction: newDirection },
      wordCells,
    });
  },

  toggleBlackCell: (position) => {
    const { puzzle, selection } = get();
    if (!puzzle) return;

    const targetCell = puzzle.grid[position.row]?.[position.col];
    if (!targetCell) return;

    const wasBlack = targetCell.isBlack;

    const newGrid = puzzle.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === position.row && colIndex === position.col) {
          if (wasBlack) {
            return { ...cell, isBlack: false, value: '' };
          } else {
            return { ...cell, isBlack: true, value: '' };
          }
        }
        return cell;
      })
    );

    const numberedGrid = assignCellNumbers(newGrid);
    const words = extractWords(numberedGrid);

    if (wasBlack) {
      const wordCells = getWordCells(numberedGrid, position, selection.direction);
      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        selection: { position, direction: selection.direction },
        wordCells,
      });
    } else {
      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        selection: { position: null, direction: selection.direction },
        wordCells: [],
      });
    }
  },

  setCellValue: (position, value, skipActivateNext) => {
    const { puzzle, selection } = get();
    console.log('[setCellValue] called, position:', position, 'value:', value, 'skipActivateNext:', skipActivateNext);
    console.log('[setCellValue] current selection:', selection);
    if (!puzzle) return;

    const cell = puzzle.grid[position.row]?.[position.col];
    if (!cell || cell.isBlack) return;

    const newValue = value.slice(-1).toUpperCase();
    const shouldBecomeBlack = newValue === '';

    let newGrid = puzzle.grid.map((row, rowIndex) =>
      row.map((c, colIndex) => {
        if (rowIndex === position.row && colIndex === position.col) {
          return { ...c, value: newValue, isBlack: shouldBecomeBlack };
        }
        return c;
      })
    );

    if (!shouldBecomeBlack && !skipActivateNext) {
      const nextPos = getNextCellPosition(puzzle.grid, position, selection.direction);
      console.log('[setCellValue] nextPos:', nextPos);
      if (nextPos && puzzle.grid[nextPos.row][nextPos.col].isBlack) {
        console.log('[setCellValue] activating next cell');
        newGrid = newGrid.map((row, rowIndex) =>
          row.map((c, colIndex) => {
            if (rowIndex === nextPos.row && colIndex === nextPos.col) {
              return { ...c, isBlack: false };
            }
            return c;
          })
        );
      }
    }

    const numberedGrid = assignCellNumbers(newGrid);
    const words = extractWords(numberedGrid);

    if (shouldBecomeBlack) {
      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        selection: { position: null, direction: selection.direction },
        wordCells: [],
      });
    } else {
      const wordCells = getWordCells(numberedGrid, position, selection.direction);
      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        wordCells,
      });
    }
  },

  moveToNextCell: () => {
    const { puzzle, selection } = get();
    if (!puzzle || !selection.position) return;

    const nextPos = getNextCell(puzzle.grid, selection.position, selection.direction);
    if (nextPos) {
      const wordCells = getWordCells(puzzle.grid, nextPos, selection.direction);
      set({
        selection: { ...selection, position: nextPos },
        wordCells,
      });
    }
  },

  moveToNextCellAndActivate: () => {
    const { puzzle, selection } = get();
    if (!puzzle || !selection.position) return;

    const nextPos = getNextCellPosition(puzzle.grid, selection.position, selection.direction);
    if (!nextPos) return;

    const nextCell = puzzle.grid[nextPos.row]?.[nextPos.col];
    if (!nextCell) return;

    if (nextCell.isBlack) {
      const newGrid = puzzle.grid.map((row, rowIndex) =>
        row.map((c, colIndex) => {
          if (rowIndex === nextPos.row && colIndex === nextPos.col) {
            return { ...c, isBlack: false };
          }
          return c;
        })
      );

      const numberedGrid = assignCellNumbers(newGrid);
      const words = extractWords(numberedGrid);
      const wordCells = getWordCells(numberedGrid, nextPos, selection.direction);

      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        selection: { ...selection, position: nextPos },
        wordCells,
      });
    } else {
      const wordCells = getWordCells(puzzle.grid, nextPos, selection.direction);
      set({
        selection: { ...selection, position: nextPos },
        wordCells,
      });
    }
  },

  moveToPrevCell: () => {
    const { puzzle, selection } = get();
    if (!puzzle || !selection.position) return;

    const prevPos = getPrevCell(puzzle.grid, selection.position, selection.direction);
    if (prevPos) {
      const wordCells = getWordCells(puzzle.grid, prevPos, selection.direction);
      set({
        selection: { ...selection, position: prevPos },
        wordCells,
      });
    }
  },

  moveToPrevCellAndClear: () => {
    const { puzzle, selection } = get();
    console.log('[moveToPrevCellAndClear] called');
    console.log('[moveToPrevCellAndClear] selection.position:', selection.position);
    if (!puzzle || !selection.position) return;

    const currentPos = selection.position;
    const prevPos = getPrevCell(puzzle.grid, currentPos, selection.direction);
    console.log('[moveToPrevCellAndClear] prevPos:', prevPos);
    if (!prevPos) return;

    console.log('[moveToPrevCellAndClear] prevCell before:', puzzle.grid[prevPos.row][prevPos.col]);

    // 현재 셀(빈 셀)을 검은 칸으로 만들고, 이전 셀의 값을 지움
    const newGrid = puzzle.grid.map((row, rowIndex) =>
      row.map((c, colIndex) => {
        // 현재 셀 (빈 셀) → 검은 칸으로
        if (rowIndex === currentPos.row && colIndex === currentPos.col) {
          return { ...c, value: '', isBlack: true };
        }
        // 이전 셀 → 값만 지움
        if (rowIndex === prevPos.row && colIndex === prevPos.col) {
          return { ...c, value: '' };
        }
        return c;
      })
    );

    console.log('[moveToPrevCellAndClear] currentCell after (should be black):', newGrid[currentPos.row][currentPos.col]);
    console.log('[moveToPrevCellAndClear] prevCell after clear:', newGrid[prevPos.row][prevPos.col]);

    const numberedGrid = assignCellNumbers(newGrid);
    const words = extractWords(numberedGrid);
    const wordCells = getWordCells(numberedGrid, prevPos, selection.direction);

    console.log('[moveToPrevCellAndClear] final prevCell:', numberedGrid[prevPos.row][prevPos.col]);

    set({
      puzzle: { ...puzzle, grid: numberedGrid, words, updatedAt: new Date().toISOString() },
      selection: { ...selection, position: prevPos },
      wordCells,
    });
  },

  clearCellValue: (position) => {
    const { puzzle, selection } = get();
    console.log('[clearCellValue] called, position:', position);
    if (!puzzle) return;

    const cell = puzzle.grid[position.row]?.[position.col];
    console.log('[clearCellValue] cell before:', cell);
    if (!cell || cell.isBlack) return;

    const newGrid = puzzle.grid.map((row, rowIndex) =>
      row.map((c, colIndex) => {
        if (rowIndex === position.row && colIndex === position.col) {
          return { ...c, value: '' };
        }
        return c;
      })
    );

    console.log('[clearCellValue] cell after clear:', newGrid[position.row][position.col]);

    const numberedGrid = assignCellNumbers(newGrid);
    const words = extractWords(numberedGrid);
    const wordCells = getWordCells(numberedGrid, position, selection.direction);

    console.log('[clearCellValue] final cell:', numberedGrid[position.row][position.col]);

    set({
      puzzle: { ...puzzle, grid: numberedGrid, words, updatedAt: new Date().toISOString() },
      wordCells,
    });
  },

  moveInDirection: (dir) => {
    const { puzzle, selection } = get();
    if (!puzzle || !selection.position) return;

    const { row, col } = selection.position;
    let newRow = row;
    let newCol = col;

    switch (dir) {
      case 'up':
        newRow = row - 1;
        break;
      case 'down':
        newRow = row + 1;
        break;
      case 'left':
        newCol = col - 1;
        break;
      case 'right':
        newCol = col + 1;
        break;
    }

    const newCell = puzzle.grid[newRow]?.[newCol];
    if (!newCell) return;

    const currentCell = puzzle.grid[row][col];
    const currentCellIsEmpty = !currentCell.isBlack && !currentCell.value;
    const newPosition = { row: newRow, col: newCol };

    let newGrid = puzzle.grid;

    if (currentCellIsEmpty) {
      newGrid = newGrid.map((r, rowIndex) =>
        r.map((c, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return { ...c, isBlack: true };
          }
          return c;
        })
      );
    }

    if (newCell.isBlack) {
      newGrid = newGrid.map((r, rowIndex) =>
        r.map((c, colIndex) => {
          if (rowIndex === newRow && colIndex === newCol) {
            return { ...c, isBlack: false };
          }
          return c;
        })
      );
    }

    if (currentCellIsEmpty || newCell.isBlack) {
      const numberedGrid = assignCellNumbers(newGrid);
      const words = extractWords(numberedGrid);
      const wordCells = getWordCells(numberedGrid, newPosition, selection.direction);

      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        selection: { ...selection, position: newPosition },
        wordCells,
      });
    } else {
      const wordCells = getWordCells(puzzle.grid, newPosition, selection.direction);
      set({
        selection: { ...selection, position: newPosition },
        wordCells,
      });
    }
  },

  applyWord: (word) => {
    const { puzzle, wordCells, selection } = get();
    if (!puzzle || wordCells.length === 0) return;

    const chars = word.split('');
    const newGrid = puzzle.grid.map((row) => row.map((cell) => ({ ...cell })));

    wordCells.forEach((pos, index) => {
      if (index < chars.length) {
        newGrid[pos.row][pos.col].value = chars[index].toUpperCase();
      }
    });

    const words = extractWords(newGrid);

    const lastPos = wordCells[Math.min(word.length, wordCells.length) - 1] || selection.position;

    set({
      puzzle: {
        ...puzzle,
        grid: newGrid,
        words,
        updatedAt: new Date().toISOString(),
      },
      selection: { ...selection, position: lastPos },
    });
  },

  updateWordClue: (wordId, clue) => {
    const { puzzle } = get();
    if (!puzzle) return;

    const words = puzzle.words.map((w) => (w.id === wordId ? { ...w, clue } : w));

    set({
      puzzle: {
        ...puzzle,
        words,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  resizeGrid: (size) => {
    const { puzzle } = get();
    if (!puzzle) return;

    const newGrid: Cell[][] = [];
    for (let row = 0; row < size.rows; row++) {
      const rowCells: Cell[] = [];
      for (let col = 0; col < size.cols; col++) {
        const existingCell = puzzle.grid[row]?.[col];
        if (existingCell) {
          rowCells.push({ ...existingCell });
        } else {
          rowCells.push({ row, col, value: '', isBlack: true });
        }
      }
      newGrid.push(rowCells);
    }

    const numberedGrid = assignCellNumbers(newGrid);
    const words = extractWords(numberedGrid);

    set({
      puzzle: {
        ...puzzle,
        size,
        grid: numberedGrid,
        words,
        updatedAt: new Date().toISOString(),
      },
      selection: { position: null, direction: get().selection.direction },
      wordCells: [],
    });
  },

  setPuzzle: (puzzle) => {
    set({ puzzle, selection: { position: null, direction: 'across' }, wordCells: [] });
  },

  clearPuzzle: () => {
    set({ puzzle: null, selection: { position: null, direction: 'across' }, wordCells: [] });
  },

  finalizeEmptyCells: (excludePosition?: Position) => {
    const { puzzle } = get();
    console.log('[finalizeEmptyCells] called, excludePosition:', excludePosition);
    console.trace('[finalizeEmptyCells] stack trace');
    if (!puzzle) return;

    const newGrid = convertEmptyCellsToBlack(puzzle.grid, excludePosition);
    const numberedGrid = assignCellNumbers(newGrid);
    const words = extractWords(numberedGrid);

    set({
      puzzle: {
        ...puzzle,
        grid: numberedGrid,
        words,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  commitComposingAndFinalize: (composingPosition, composingValue, nextPosition) => {
    const { puzzle, selection } = get();
    if (!puzzle) return;

    let newGrid = puzzle.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === composingPosition.row && colIndex === composingPosition.col) {
          return { ...cell, value: composingValue };
        }
        return cell;
      })
    );

    newGrid = convertEmptyCellsToBlack(newGrid, nextPosition);
    const numberedGrid = assignCellNumbers(newGrid);
    const words = extractWords(numberedGrid);

    if (nextPosition) {
      const targetCell = numberedGrid[nextPosition.row]?.[nextPosition.col];
      
      if (targetCell?.isBlack) {
        const activatedGrid = numberedGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (rowIndex === nextPosition.row && colIndex === nextPosition.col) {
              return { ...cell, isBlack: false };
            }
            return cell;
          })
        );
        const finalGrid = assignCellNumbers(activatedGrid);
        const finalWords = extractWords(finalGrid);
        const wordCells = getWordCells(finalGrid, nextPosition, selection.direction);

        set({
          puzzle: {
            ...puzzle,
            grid: finalGrid,
            words: finalWords,
            updatedAt: new Date().toISOString(),
          },
          selection: { position: nextPosition, direction: selection.direction },
          wordCells,
        });
      } else if (targetCell) {
        const wordCells = getWordCells(numberedGrid, nextPosition, selection.direction);
        set({
          puzzle: {
            ...puzzle,
            grid: numberedGrid,
            words,
            updatedAt: new Date().toISOString(),
          },
          selection: { position: nextPosition, direction: selection.direction },
          wordCells,
        });
      } else {
        set({
          puzzle: {
            ...puzzle,
            grid: numberedGrid,
            words,
            updatedAt: new Date().toISOString(),
          },
          selection: { position: null, direction: selection.direction },
          wordCells: [],
        });
      }
    } else {
      set({
        puzzle: {
          ...puzzle,
          grid: numberedGrid,
          words,
          updatedAt: new Date().toISOString(),
        },
        selection: { position: null, direction: selection.direction },
        wordCells: [],
      });
    }
  },
}));
