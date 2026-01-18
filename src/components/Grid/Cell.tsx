import { clsx } from 'clsx';
import type { Cell as CellType } from '@/types/puzzle';

interface CellProps {
  cell: CellType;
  isSelected: boolean;
  isInWord: boolean;
  isInLine: boolean;
  composingValue?: string;
  onTouchStart: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function Cell({ cell, isSelected, isInWord, isInLine, composingValue, onTouchStart, onMouseDown, onContextMenu }: CellProps) {
  if (cell.isBlack) {
    return (
      <div
        className={clsx(
          'w-[var(--cell-size)] h-[var(--cell-size)] cursor-pointer border border-gray-600 select-none touch-manipulation',
          {
            'bg-green-900': isInLine,
            'bg-gray-800': !isInLine,
          }
        )}
        onTouchStart={onTouchStart}
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
      />
    );
  }

  const displayValue = isSelected && composingValue ? composingValue : cell.value;

  return (
    <div
      className={clsx(
        'relative w-[var(--cell-size)] h-[var(--cell-size)] border border-gray-300 cursor-pointer transition-colors select-none touch-manipulation',
        'flex items-center justify-center',
        {
          'bg-green-500 border-green-500': isSelected,
          'bg-green-100': isInWord && !isSelected,
          'bg-white hover:bg-gray-50': !isSelected && !isInWord,
        }
      )}
      onTouchStart={onTouchStart}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      {cell.number && (
        <span className="absolute top-0.5 left-1 text-[10px] font-medium text-gray-600 leading-none">
          {cell.number}
        </span>
      )}
      <span
        className={clsx('text-base sm:text-lg lg:text-xl font-bold', {
          'text-white': isSelected,
          'text-gray-900': !isSelected,
        })}
      >
        {displayValue}
      </span>
    </div>
  );
}
