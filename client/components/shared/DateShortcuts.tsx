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
    <span className="inline-flex items-center gap-0.5 text-[11px]">
      <button
        type="button"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        onClick={() => onSelect(yesterday(), yesterday())}
      >
        bch
      </button>
      <span className="text-gray-400">&middot;</span>
      <button
        type="button"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        onClick={() => onSelect(today(), today())}
      >
        bug
      </button>
      <span className="text-gray-400">&middot;</span>
      <button
        type="button"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        onClick={() => onSelect(weekStart(), today())}
      >
        haf
      </button>
      <span className="text-gray-400">&middot;</span>
      <button
        type="button"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        onClick={() => onSelect(monthStart(), today())}
      >
        oy
      </button>
    </span>
  );
};
