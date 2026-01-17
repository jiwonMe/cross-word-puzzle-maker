import { useState } from 'react';
import { usePuzzleStore } from '@/stores/puzzleStore';
import { encodePuzzleToUrl, copyToClipboard } from '@/utils/urlEncoder';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const puzzle = usePuzzleStore((state) => state.puzzle);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !puzzle) return null;

  const shareUrl = encodePuzzleToUrl(puzzle);

  const handleCopy = async () => {
    await copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-4">퍼즐 공유</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공유 URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 truncate"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
              >
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            이 URL을 공유하면 다른 사람이 동일한 퍼즐을 볼 수 있습니다.
          </p>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
