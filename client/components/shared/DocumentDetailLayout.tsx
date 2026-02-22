import { ReactNode, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, X, ChevronLeft, ChevronRight, ChevronDown, Printer, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/format";

export interface PrintAction {
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface CreateAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface EditAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface DocumentDetailLayoutProps {
  // Identity
  title: string;
  documentNumber?: string;
  documentDate?: string;
  isNew: boolean;

  // Navigation
  listUrl: string;
  currentIndex?: number;
  totalCount?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;

  // Toolbar actions
  onSave: () => void | Promise<void>;
  saving?: boolean;
  onDelete?: () => void;
  printActions?: PrintAction[];
  createActions?: CreateAction[];
  editActions?: EditAction[];

  // Status
  statusBadge?: ReactNode;
  paymentBadge?: ReactNode;
  additionalBadges?: ReactNode;

  // Metadata
  lastModified?: string;

  // Content slots
  headerExtra?: ReactNode;
  formFields: ReactNode;
  itemsTable?: ReactNode;
  footer?: ReactNode;

  children?: ReactNode;
}

export const DocumentDetailLayout = ({
  title,
  documentNumber,
  documentDate,
  isNew,
  listUrl,
  currentIndex,
  totalCount,
  hasPrev,
  hasNext,
  onNavigatePrev,
  onNavigateNext,
  onSave,
  saving,
  printActions,
  createActions,
  editActions,
  statusBadge,
  paymentBadge,
  additionalBadges,
  lastModified,
  headerExtra,
  formFields,
  itemsTable,
  footer,
  children,
}: DocumentDetailLayoutProps) => {
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    navigate(listUrl);
  }, [navigate, listUrl]);

  // Ctrl+S saqlash, Escape — orqaga
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!saving) onSave();
      }
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave, saving, handleClose]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-gray-50 dark:bg-gray-950">
      {/* ===== TOOLBAR ===== */}
      <div className="sticky top-[96px] z-30 bg-gray-50 dark:bg-gray-900 border-b">
        <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
          {/* Saqlash */}
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-green-600 hover:bg-green-700"
            onClick={() => onSave()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Saqlash
          </Button>

          {/* Yopish */}
          <Button variant="outline" size="sm" className="h-8" onClick={handleClose} disabled={saving}>
            <X className="h-3.5 w-3.5 mr-1" />
            Yopish
          </Button>

          {/* Navigatsiya */}
          {totalCount && totalCount > 0 ? (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onNavigatePrev}
                disabled={!hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-500 min-w-[40px] text-center">
                {currentIndex} / {totalCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onNavigateNext}
                disabled={!hasNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}

          <div className="h-6 w-px bg-gray-300" />

          {/* O'zgartirish dropdown */}
          {editActions && editActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  O'zgartirish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {editActions.map((action, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={action.destructive ? "text-red-600" : ""}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Hujjat yaratish dropdown */}
          {createActions && createActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  Hujjat yaratish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {createActions.map((action, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Chop etish dropdown */}
          {printActions && printActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  <Printer className="h-3.5 w-3.5" />
                  Chop etish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {printActions.map((action, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex-1" />

          {/* O'zgartirilgan vaqt */}
          {lastModified && (
            <span className="text-xs text-gray-400">
              O'zgartirilgan: {formatDateTime(lastModified)}
            </span>
          )}
        </div>
      </div>

      {/* ===== SARLAVHA QATORI ===== */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-white dark:bg-gray-900 flex-wrap">
        <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
          {isNew ? `Yangi ${title.toLowerCase()}` : `${title} № ${documentNumber || ""}`}
        </span>
        {documentDate && !isNew && (
          <span className="text-sm text-gray-400">
            dan {formatDateTime(documentDate)}
          </span>
        )}

        {paymentBadge}
        {statusBadge}
        {additionalBadges}
        {headerExtra}

        <div className="flex-1" />
      </div>

      {/* ===== KONTENT ===== */}
      <div className="max-w-[1400px] mx-auto">
        {/* Form maydonlari */}
        <div className="bg-white dark:bg-gray-900 border-x border-b px-4 py-4">
          {formFields}
        </div>

        {/* Items jadval */}
        {itemsTable && (
          <div className="bg-white dark:bg-gray-900 border-x border-b">
            {itemsTable}
          </div>
        )}

        {/* Footer / jami */}
        {footer && (
          <div className="bg-white dark:bg-gray-900 border-x border-b rounded-b-lg px-4 py-4">
            {footer}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
