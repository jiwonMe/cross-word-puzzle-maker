import { WordRecommendation } from './WordRecommendation';
import { ClueEditor } from './ClueEditor';

interface SidebarProps {
  onFetchRecommendations?: (
    length: number,
    constraints: { position: number; char: string }[]
  ) => Promise<string[]>;
}

export function Sidebar({ onFetchRecommendations }: SidebarProps) {
  return (
    <aside className="w-full lg:w-72 flex flex-col gap-4">
      <WordRecommendation onFetchRecommendations={onFetchRecommendations} />
      <ClueEditor />
    </aside>
  );
}
