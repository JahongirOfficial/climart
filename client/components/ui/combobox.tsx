import * as React from "react"
import { Check, Plus, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  keywords?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  onCreateNew?: (searchTerm: string) => void
  createNewLabel?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Tanlang...",
  searchPlaceholder = "Qidirish...",
  emptyText = "Natija topilmadi",
  className,
  disabled = false,
  onCreateNew,
  createNewLabel = "Yangi qo'shish",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  // Inputga yozganda dropdown ochilsin
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (!open) setOpen(true)
  }

  const handleFocus = () => {
    setSearch("")
    setOpen(true)
  }

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setSearch("")
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearch("")
      setOpen(false)
      inputRef.current?.blur()
    }
    if (e.key === "Tab") {
      setSearch("")
      setOpen(false)
    }
  }

  // Filter options by search term
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const term = search.toLowerCase()
    return options.filter(opt =>
      opt.label.toLowerCase().includes(term) ||
      (opt.keywords && opt.keywords.toLowerCase().includes(term)) ||
      (opt.description && opt.description.toLowerCase().includes(term))
    )
  }, [options, search])

  // Display value: when focused show search, when not show selected label
  const displayValue = open ? search : (selectedOption?.label || "")

  return (
    <Popover open={open} onOpenChange={(v) => {
      if (!v) { setSearch(""); }
      setOpen(v)
    }} modal={false}>
      <div ref={containerRef} className="relative w-full">
        <PopoverAnchor asChild>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50 pr-7",
                className
              )}
            />
            <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40 pointer-events-none" />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="p-0 z-[9999]"
          style={{ width: containerRef.current?.offsetWidth || "auto" }}
          align="start"
          side="bottom"
          sideOffset={2}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Input ga bosganda yopilmasin
            if (inputRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
        >
          <Command className="overflow-hidden" shouldFilter={false}>
            <CommandList className="max-h-[250px]">
              {filteredOptions.length === 0 ? (
                <div className="py-3 px-3 text-center">
                  <p className="text-sm text-muted-foreground">{emptyText}</p>
                  {onCreateNew && search && (
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNew(search)
                        setSearch("")
                        setOpen(false)
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {createNewLabel}: "{search}"
                    </button>
                  )}
                </div>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </div>
    </Popover>
  )
}
