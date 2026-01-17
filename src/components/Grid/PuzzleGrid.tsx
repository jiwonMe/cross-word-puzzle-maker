import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePuzzleStore } from '@/stores/puzzleStore';
import { Cell } from './Cell';
import { getLineCells } from '@/utils/gridUtils';
import type { Position } from '@/types/puzzle';

export function PuzzleGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composingValue, setComposingValue] = useState('');
  const composingPositionRef = useRef<Position | null>(null);
  const composingValueRef = useRef<string>('');
  const skipMoveOnCompositionEndRef = useRef(false);

  const {
    puzzle,
    selection,
    wordCells,
    selectCell,
    toggleBlackCell,
    setCellValue,
    moveToNextCell,
    moveToPrevCell,
    moveInDirection,
    toggleDirection,
    finalizeEmptyCells,
    commitComposingAndFinalize,
  } = usePuzzleStore();

  const commitComposingValue = useCallback(() => {
    if (composingValue && composingPositionRef.current) {
      setCellValue(composingPositionRef.current, composingValue);
    }
    setIsComposing(false);
    setComposingValue('');
    composingPositionRef.current = null;
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [composingValue, setCellValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!puzzle || !selection.position) return;

      const { key } = e;

      if (key === 'Escape') {
        e.preventDefault();
        if (isComposing) {
          commitComposingValue();
        }
        return;
      }

      if (isComposing) return;

      if (key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        skipMoveOnCompositionEndRef.current = true;
        toggleDirection();
        return;
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        moveInDirection('up');
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault();
        moveInDirection('down');
        return;
      }
      if (key === 'ArrowLeft') {
        e.preventDefault();
        moveInDirection('left');
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        moveInDirection('right');
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        const { row, col } = selection.position;
        if (puzzle.grid[row][col].value) {
          setCellValue(selection.position, '');
        } else {
          moveToPrevCell();
        }
        return;
      }

      if (key === 'Delete') {
        e.preventDefault();
        setCellValue(selection.position, '');
        return;
      }

      if (key === 'Enter') {
        e.preventDefault();
        skipMoveOnCompositionEndRef.current = true;
        toggleDirection();
        return;
      }

      if (/^[a-zA-Z]$/.test(key)) {
        e.preventDefault();
        setCellValue(selection.position, key.toUpperCase());
        moveToNextCell();
      }
    },
    [puzzle, selection, isComposing, commitComposingValue, toggleDirection, moveInDirection, setCellValue, moveToNextCell, moveToPrevCell]
  );

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
    setComposingValue('');
    composingValueRef.current = '';
    composingPositionRef.current = selection.position;
  }, [selection.position]);

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      const value = e.data;
      if (value) {
        const lastChar = value.slice(-1);
        setComposingValue(lastChar);
        composingValueRef.current = lastChar;
      }
    },
    []
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      if (pendingClickRef.current) {
        setIsComposing(false);
        setComposingValue('');
        composingValueRef.current = '';
        composingPositionRef.current = null;
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }

      const targetPosition = composingPositionRef.current;
      const savedComposingValue = composingValueRef.current;
      
      setIsComposing(false);
      setComposingValue('');
      composingValueRef.current = '';
      composingPositionRef.current = null;

      if (!targetPosition) return;

      const value = e.data || savedComposingValue;
      if (value && value.length > 0) {
        const lastChar = value.slice(-1);
        setCellValue(targetPosition, lastChar);
        
        const shouldSkipMove = skipMoveOnCompositionEndRef.current;
        skipMoveOnCompositionEndRef.current = false;
        
        if (!shouldSkipMove &&
            selection.position?.row === targetPosition.row && 
            selection.position?.col === targetPosition.col) {
          moveToNextCell();
        }
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [selection.position, setCellValue, moveToNextCell]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (isComposing) return;
      if (!selection.position) return;

      const input = e.currentTarget;
      const value = input.value;

      if (value && value.length > 0) {
        const lastChar = value.slice(-1);
        if (/^[가-힣]$/.test(lastChar)) {
          setCellValue(selection.position, lastChar);
          moveToNextCell();
        }
      }

      input.value = '';
    },
    [isComposing, selection.position, setCellValue, moveToNextCell]
  );

  const pendingClickRef = useRef<Position | null>(null);

  const handleCellMouseDown = useCallback(
    (row: number, col: number) => {
      const nextPosition = { row, col };
      pendingClickRef.current = nextPosition;
      
      // Use ref values for immediate access (avoids stale closure issues)
      const currentComposingValue = composingValueRef.current;
      const currentComposingPosition = composingPositionRef.current;
      
      if (isComposing && currentComposingValue && currentComposingPosition) {
        commitComposingAndFinalize(currentComposingPosition, currentComposingValue, nextPosition);
        setIsComposing(false);
        setComposingValue('');
        composingValueRef.current = '';
        composingPositionRef.current = null;
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } else {
        selectCell(nextPosition);
      }
      
      setTimeout(() => {
        inputRef.current?.focus();
        pendingClickRef.current = null;
      }, 0);
    },
    [isComposing, commitComposingAndFinalize, selectCell]
  );

  const handleBlur = useCallback(() => {
    if (pendingClickRef.current) {
      return;
    }
    
    const currentComposingValue = composingValueRef.current;
    const currentComposingPosition = composingPositionRef.current;
    
    if (isComposing && currentComposingValue && currentComposingPosition) {
      commitComposingAndFinalize(currentComposingPosition, currentComposingValue);
      setIsComposing(false);
      setComposingValue('');
      composingValueRef.current = '';
      composingPositionRef.current = null;
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } else {
      finalizeEmptyCells();
    }
  }, [isComposing, commitComposingAndFinalize, finalizeEmptyCells]);

  useEffect(() => {
    if (selection.position && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selection.position]);

  if (!puzzle) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        새 퍼즐을 생성해주세요
      </div>
    );
  }

  const lineCells = useMemo(() => {
    if (!puzzle || !selection.position) return [];
    return getLineCells(puzzle.grid, selection.position, selection.direction);
  }, [puzzle, selection.position, selection.direction]);

  const isInWordCells = (row: number, col: number) => {
    return wordCells.some((c) => c.row === row && c.col === col);
  };

  const isInLineCells = (row: number, col: number) => {
    return lineCells.some((c) => c.row === row && c.col === col);
  };

  const composingPosition = composingPositionRef.current;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEnd}
        onInput={handleInput}
        onBlur={handleBlur}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <div className="flex flex-col gap-0 p-4 bg-gray-100 rounded-lg w-fit">
        {puzzle.grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-0">
            {row.map((cell, colIndex) => {
              const isSelected =
                selection.position?.row === rowIndex && selection.position?.col === colIndex;
              const isInWord = isInWordCells(rowIndex, colIndex) && !isSelected;
              const isInLine = isInLineCells(rowIndex, colIndex) && !isSelected;
              const isComposingCell = 
                composingPosition?.row === rowIndex && composingPosition?.col === colIndex;

              return (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  cell={cell}
                  isSelected={isSelected}
                  isInWord={isInWord}
                  isInLine={isInLine}
                  composingValue={isComposingCell ? composingValue : undefined}
                  onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isComposing) {
                      commitComposingValue();
                    }
                    toggleBlackCell({ row: rowIndex, col: colIndex });
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
