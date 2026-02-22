import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { DateShortcuts } from "./DateShortcuts";
import { cn } from "@/lib/utils";

export interface FilterField {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange";
  placeholder?: string;
  options?: { value: string; label: string }[];
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
  defaultExpanded = false,
}: AdvancedFilterProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
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
    // Auto-trigger search after shortcut
    setTimeout(onSearch, 0);
  };

  // Select va date o'zgarganda darhol qidirish
  const handleSelectChange = (key: string, value: string) => {
    onChange(key, value);
    setTimeout(onSearch, 0);
  };

  return (
    <div className="bg-white border rounded-lg">
      {/* Toggle header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtr</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs">
              {Object.values(values).filter((v) => v !== "").length}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Filter content */}
      {expanded && (
        <div className="px-4 pb-4 border-t">
          {/* Date shortcuts */}
          {fields.some((f) => f.type === "date" || f.type === "dateRange") && (
            <div className="pt-3 pb-1">
              <DateShortcuts onSelect={handleDateShortcut} />
            </div>
          )}

          {/* Filter grid - 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
            {fields.map((field) => (
              <div key={field.key}>
                <Label className="text-xs text-gray-500 mb-1 block">
                  {field.label}
                </Label>
                {field.type === "text" && (
                  <Input
                    value={values[field.key] || ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder || field.label}
                    className="h-8 text-sm"
                  />
                )}
                {field.type === "date" && (
                  <Input
                    type="date"
                    value={values[field.key] || ""}
                    onChange={(e) => handleSelectChange(field.key, e.target.value)}
                    className="h-8 text-sm"
                  />
                )}
                {field.type === "select" && (
                  <select
                    value={values[field.key] || ""}
                    onChange={(e) => handleSelectChange(field.key, e.target.value)}
                    className={cn(
                      "w-full h-8 px-2 text-sm border border-input rounded-md bg-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                  >
                    <option value="">{field.placeholder || "Barchasi"}</option>
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

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3">
            <Button size="sm" onClick={onSearch} className="h-8">
              <Search className="h-3.5 w-3.5 mr-1" />
              Qidirish
            </Button>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClear}
                className="h-8"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Tozalash
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
