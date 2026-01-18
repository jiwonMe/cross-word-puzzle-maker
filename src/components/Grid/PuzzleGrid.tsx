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
  const justFinishedComposingRef = useRef(false);

  const {
    puzzle,
    selection,
    wordCells,
    selectCell,
    toggleBlackCell,
    setCellValue,
    clearCellValue,
    moveToNextCell,
    moveToNextCellAndActivate,
    moveToPrevCell,
    moveToPrevCellAndClear,
    moveInDirection,
    toggleDirection,
    finalizeEmptyCells,
    commitComposingAndFinalize,
  } = usePuzzleStore();

  const commitComposingValue = useCallback((skipActivateNext?: boolean) => {
    console.log('[commitComposingValue] called, skipActivateNext:', skipActivateNext);
    console.log('[commitComposingValue] composingValue:', composingValue);
    console.log('[commitComposingValue] composingPositionRef:', composingPositionRef.current);
    if (composingValue && composingPositionRef.current) {
      console.log('[commitComposingValue] calling setCellValue');
      setCellValue(composingPositionRef.current, composingValue, skipActivateNext);
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

      if (key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        skipMoveOnCompositionEndRef.current = true;
        if (isComposing) {
          toggleDirection();
          commitComposingValue(false);
          justFinishedComposingRef.current = true;
          moveToNextCell();
        } else {
          toggleDirection();
        }
        return;
      }

      if (key === 'Enter') {
        e.preventDefault();
        console.log('[keydown Enter] isComposing:', isComposing, 'position:', selection.position);
        console.log('[keydown Enter] justFinishedComposing:', justFinishedComposingRef.current);
        
        if (justFinishedComposingRef.current) {
          console.log('[keydown Enter] ignoring duplicate Enter after composition');
          justFinishedComposingRef.current = false;
          return;
        }
        
        skipMoveOnCompositionEndRef.current = true;
        console.log('[keydown Enter] set skipMove = true');
        if (isComposing) {
          console.log('[keydown Enter] toggleDirection first, then commitComposingValue');
          toggleDirection();
          commitComposingValue(false);
          justFinishedComposingRef.current = true;
          moveToNextCell();
        } else {
          toggleDirection();
        }
        return;
      }

      if (isComposing) return;

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
        const currentCell = puzzle.grid[row][col];
        console.log('[Backspace] position:', { row, col });
        console.log('[Backspace] currentCell:', currentCell);
        console.log('[Backspace] currentCell.value:', JSON.stringify(currentCell.value));
        console.log('[Backspace] hasValue:', !!currentCell.value);
        if (currentCell.value) {
          console.log('[Backspace] -> clearCellValue');
          clearCellValue(selection.position);
        } else {
          console.log('[Backspace] -> moveToPrevCellAndClear');
          moveToPrevCellAndClear();
        }
        return;
      }

      if (key === 'Delete') {
        e.preventDefault();
        clearCellValue(selection.position);
        return;
      }

      if (/^[a-zA-Z]$/.test(key)) {
        e.preventDefault();
        setCellValue(selection.position, key.toUpperCase());
        requestAnimationFrame(() => {
          if (!skipMoveOnCompositionEndRef.current) {
            moveToNextCell();
          }
          skipMoveOnCompositionEndRef.current = false;
        });
      }
    },
    [puzzle, selection, isComposing, commitComposingValue, toggleDirection, moveInDirection, setCellValue, clearCellValue, moveToNextCell, moveToPrevCell, moveToPrevCellAndClear]
  );

  const handleCompositionStart = useCallback(() => {
    console.log('[compositionStart] called, position:', selection.position);
    
    let targetPosition = selection.position;
    
    if (puzzle && selection.position) {
      const currentCell = puzzle.grid[selection.position.row]?.[selection.position.col];
      if (currentCell && currentCell.value && !currentCell.isBlack) {
        console.log('[compositionStart] current cell has value, moving to next and activating');
        moveToNextCellAndActivate();
        targetPosition = usePuzzleStore.getState().selection.position;
        console.log('[compositionStart] new position:', targetPosition);
      }
    }
    
    setIsComposing(true);
    setComposingValue('');
    composingValueRef.current = '';
    composingPositionRef.current = targetPosition;
    skipMoveOnCompositionEndRef.current = false;
    justFinishedComposingRef.current = false;
  }, [puzzle, selection.position, moveToNextCellAndActivate]);

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      const value = e.data;
      if (value) {
        const lastChar = value.slice(-1);
        setComposingValue(lastChar);
        composingValueRef.current = lastChar;
      } else {
        setComposingValue('');
        composingValueRef.current = '';
      }
    },
    []
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      console.log('[compositionEnd] called, e.data:', e.data);
      console.log('[compositionEnd] skipMoveRef at start:', skipMoveOnCompositionEndRef.current);
      console.log('[compositionEnd] composingPositionRef:', composingPositionRef.current);
      console.log('[compositionEnd] composingValueRef:', composingValueRef.current);

      const shouldSkip = skipMoveOnCompositionEndRef.current;
      skipMoveOnCompositionEndRef.current = false;

      if (pendingClickRef.current) {
        console.log('[compositionEnd] pendingClick, returning early');
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

      if (!targetPosition) {
        console.log('[compositionEnd] no targetPosition, returning');
        return;
      }

      if (shouldSkip) {
        console.log('[compositionEnd] shouldSkip=true, skipping setCellValue');
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }

      const value = e.data ?? savedComposingValue;
      console.log('[compositionEnd] value to save:', value, 'targetPosition:', targetPosition);
      
      if (value && value.length > 0) {
        const lastChar = value.slice(-1);
        console.log('[compositionEnd] calling setCellValue with:', lastChar);
        setCellValue(targetPosition, lastChar, true);
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [selection.position, setCellValue, moveToNextCell]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      console.log('[handleInput] called, isComposing:', isComposing, 'value:', e.currentTarget.value);
      console.log('[handleInput] justFinishedComposing:', justFinishedComposingRef.current);
      if (isComposing) return;
      if (justFinishedComposingRef.current) {
        console.log('[handleInput] ignoring input after composition');
        e.currentTarget.value = '';
        return;
      }
      if (!selection.position) return;

      const input = e.currentTarget;
      const value = input.value;

      if (value && value.length > 0) {
        const lastChar = value.slice(-1);
        console.log('[handleInput] lastChar:', lastChar);
        if (/^[가-힣]$/.test(lastChar)) {
          console.log('[handleInput] calling setCellValue');
          setCellValue(selection.position, lastChar);
          moveToNextCell();
        }
      }

      input.value = '';
    },
    [isComposing, selection.position, setCellValue, moveToNextCell]
  );

  const pendingClickRef = useRef<Position | null>(null);

  const handleCellInteraction = useCallback(
    (row: number, col: number, e?: React.TouchEvent | React.MouseEvent) => {
      if (e) {
        e.preventDefault();
      }
      
      const nextPosition = { row, col };
      pendingClickRef.current = nextPosition;
      
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
    console.log('[handleBlur] called, pendingClick:', pendingClickRef.current);
    if (pendingClickRef.current) {
      return;
    }
    
    const currentComposingValue = composingValueRef.current;
    const currentComposingPosition = composingPositionRef.current;
    
    if (isComposing && currentComposingValue && currentComposingPosition) {
      console.log('[handleBlur] -> commitComposingAndFinalize');
      commitComposingAndFinalize(currentComposingPosition, currentComposingValue);
      setIsComposing(false);
      setComposingValue('');
      composingValueRef.current = '';
      composingPositionRef.current = null;
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } else {
      console.log('[handleBlur] -> finalizeEmptyCells');
      finalizeEmptyCells();
    }
  }, [isComposing, commitComposingAndFinalize, finalizeEmptyCells]);

  useEffect(() => {
    if (selection.position && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selection.position]);

  const lineCells = useMemo(() => {
    if (!puzzle || !selection.position) return [];
    return getLineCells(puzzle.grid, selection.position, selection.direction);
  }, [puzzle, selection.position, selection.direction]);

  if (!puzzle) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        새 퍼즐을 생성해주세요
      </div>
    );
  }

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
        inputMode="text"
        enterKeyHint="next"
        className="absolute left-0 top-0 opacity-0 pointer-events-none"
        style={{
          width: '1px',
          height: '1px',
          fontSize: '16px', // Prevents iOS zoom on focus
          transform: 'translateX(-9999px)',
        }}
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
                  onTouchStart={(e) => handleCellInteraction(rowIndex, colIndex, e)}
                  onMouseDown={(e) => handleCellInteraction(rowIndex, colIndex, e)}
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
