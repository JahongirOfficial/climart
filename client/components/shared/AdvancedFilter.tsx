import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { DateShortcuts } from "./DateShortcuts";
import { cn } from "@/lib/utils";

export interface FilterField {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange";
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** MoySklad uslubida muhim maydon belgisi (turunj nuqta) */
  primary?: boolean;
}

interface AdvancedFilterProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  defaultExpanded?: boolean;
}

export const AdvancedFilter = ({
  fields,
  values,
  onChange,
  onSearch,
  onClear,
}: AdvancedFilterProps) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const isInitialMount = useRef(true);

  const hasActiveFilters = Object.values(values).some((v) => v !== "");

  // Text inputlar o'zgarganda 0.5s kutib avtomatik qidirish
  const textFields = fields.filter(f => f.type === 'text').map(f => f.key);
  const textValues = textFields.map(k => values[k] || '').join('|');

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    debounceRef.current = setTimeout(() => {
      onSearch();
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [textValues]);

  const handleDateShortcut = (startDate: string, endDate: string) => {
    onChange("startDate", startDate);
    onChange("endDate", endDate);
    setTimeout(onSearch, 0);
  };

  // Select va date o'zgarganda darhol qidirish
  const handleSelectChange = (key: string, value: string) => {
    onChange(key, value);
    setTimeout(onSearch, 0);
  };

  // Maydonlarni ajratish
  const dateFields = fields.filter(f => f.type === 'date');
  const otherFields = fields.filter(f => f.type !== 'date');
  const hasDateFields = dateFields.length > 0;

  return (
    <div>
      {/* ===== 1-qator: Tugmalar + Davr + tezkor filtrlar ===== */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {/* Topish tugmasi — turunj (MoySklad uslubi) */}
        <button
          type="button"
          onClick={onSearch}
          className="h-[26px] px-3 text-[11px] font-medium text-white bg-[#ff8c00] hover:bg-[#e07800] rounded border border-[#cc7000] shadow-sm"
        >
          Topish
        </button>

        {/* Tozalash tugmasi */}
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "h-[26px] px-3 text-[11px] font-medium rounded border shadow-sm",
            hasActiveFilters
              ? "text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
              : "text-gray-400 bg-gray-50 border-gray-200 cursor-default"
          )}
          disabled={!hasActiveFilters}
        >
          Tozalash
        </button>

        {/* Davr: bch·bug·haf·oy + sana diapazon */}
        {hasDateFields && (
          <>
            <div className="h-4 w-px bg-gray-300 mx-0.5" />

            <span className="text-[11px] text-[#666] font-medium">Davr:</span>
            <DateShortcuts onSelect={handleDateShortcut} />

            {/* Sana inputlar */}
            <div className="flex items-center gap-1">
              {dateFields[0] && (
                <input
                  type="date"
                  value={values[dateFields[0].key] || ""}
                  onChange={(e) => handleSelectChange(dateFields[0].key, e.target.value)}
                  className="h-[26px] w-[130px] px-1.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
                />
              )}
              {dateFields[1] && (
                <>
                  <span className="text-gray-400 text-[11px]">—</span>
                  <input
                    type="date"
                    value={values[dateFields[1].key] || ""}
                    onChange={(e) => handleSelectChange(dateFields[1].key, e.target.value)}
                    className="h-[26px] w-[130px] px-1.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ===== 2-qator: 5 ustunli grid — qolgan filtrlar ===== */}
      {otherFields.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-1.5">
          {otherFields.map((field) => (
            <div key={field.key}>
              <label className="text-[11px] text-[#666] block mb-0.5 leading-tight">
                {field.primary && <span className="text-orange-500 mr-0.5">&bull;</span>}
                {field.label}
              </label>

              {field.type === "text" && (
                <input
                  value={values[field.key] || ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder || field.label}
                  className="w-full h-[26px] px-1.5 text-[12px] border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400 placeholder:text-gray-400"
                />
              )}

              {field.type === "select" && (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => handleSelectChange(field.key, e.target.value)}
                  className="w-full h-[26px] px-1 text-[12px] border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400 appearance-auto"
                >
                  <option value="">{field.placeholder || ""}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
