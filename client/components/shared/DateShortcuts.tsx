import { Button } from "@/components/ui/button";

interface DateShortcutsProps {
  onSelect: (startDate: string, endDate: string) => void;
}

const today = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const weekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

export const DateShortcuts = ({ onSelect }: DateShortcutsProps) => {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-blue-600"
        onClick={() => onSelect(yesterday(), yesterday())}
      >
        kecha
      </Button>
      <span className="text-gray-300">|</span>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-blue-600"
        onClick={() => onSelect(today(), today())}
      >
        bugun
      </Button>
      <span className="text-gray-300">|</span>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-blue-600"
        onClick={() => onSelect(weekStart(), today())}
      >
        hafta
      </Button>
      <span className="text-gray-300">|</span>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-blue-600"
        onClick={() => onSelect(monthStart(), today())}
      >
        oy
      </Button>
    </div>
  );
};
