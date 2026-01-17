import jsPDF from 'jspdf';
import type { Puzzle } from '@/types/puzzle';

const CELL_SIZE = 25;
const MARGIN = 20;
const FONT_SIZE = 10;
const NUMBER_FONT_SIZE = 6;

export async function generatePuzzlePDF(puzzle: Puzzle, includeAnswers: boolean = false): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(puzzle.title, pageWidth / 2, MARGIN, { align: 'center' });

  const gridWidth = puzzle.size.cols * CELL_SIZE;
  const gridStartX = (pageWidth - gridWidth) / 2;
  const gridStartY = MARGIN + 15;

  for (let row = 0; row < puzzle.size.rows; row++) {
    for (let col = 0; col < puzzle.size.cols; col++) {
      const cell = puzzle.grid[row][col];
      const x = gridStartX + col * CELL_SIZE;
      const y = gridStartY + row * CELL_SIZE;

      if (cell.isBlack) {
        doc.setFillColor(50, 50, 50);
        doc.rect(x, y, CELL_SIZE, CELL_SIZE, 'F');
      } else {
        doc.setDrawColor(0);
        doc.rect(x, y, CELL_SIZE, CELL_SIZE, 'S');

        if (cell.number) {
          doc.setFontSize(NUMBER_FONT_SIZE);
          doc.text(String(cell.number), x + 1, y + 4);
        }

        if (includeAnswers && cell.value) {
          doc.setFontSize(FONT_SIZE);
          doc.text(cell.value, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 3, { align: 'center' });
        }
      }
    }
  }

  const clueStartY = gridStartY + puzzle.size.rows * CELL_SIZE + 15;
  let currentY = clueStartY;

  const acrossWords = puzzle.words.filter((w) => w.direction === 'across');
  const downWords = puzzle.words.filter((w) => w.direction === 'down');

  if (acrossWords.length > 0) {
    doc.setFontSize(12);
    doc.text('가로', MARGIN, currentY);
    currentY += 6;

    doc.setFontSize(FONT_SIZE);
    for (const word of acrossWords) {
      const clueText = word.clue || (includeAnswers ? word.text : '(힌트 없음)');
      doc.text(`${word.number}. ${clueText}`, MARGIN + 5, currentY);
      currentY += 5;

      if (currentY > doc.internal.pageSize.getHeight() - MARGIN) {
        doc.addPage();
        currentY = MARGIN;
      }
    }
    currentY += 5;
  }

  if (downWords.length > 0) {
    doc.setFontSize(12);
    doc.text('세로', MARGIN, currentY);
    currentY += 6;

    doc.setFontSize(FONT_SIZE);
    for (const word of downWords) {
      const clueText = word.clue || (includeAnswers ? word.text : '(힌트 없음)');
      doc.text(`${word.number}. ${clueText}`, MARGIN + 5, currentY);
      currentY += 5;

      if (currentY > doc.internal.pageSize.getHeight() - MARGIN) {
        doc.addPage();
        currentY = MARGIN;
      }
    }
  }

  const filename = includeAnswers
    ? `${puzzle.title}_정답.pdf`
    : `${puzzle.title}_퍼즐.pdf`;

  doc.save(filename);
}

export async function generateBothPDFs(puzzle: Puzzle): Promise<void> {
  await generatePuzzlePDF(puzzle, false);
  await generatePuzzlePDF(puzzle, true);
}
