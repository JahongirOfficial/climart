import * as React from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

export type ModalType = "success" | "error" | "warning";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: ModalType;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
};

const colorMap = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
};

const bgColorMap = {
  success: "bg-emerald-500/10",
  error: "bg-red-500/10",
  warning: "bg-amber-500/10",
};

const titleMap = {
  success: "Muvaffaqiyatli!",
  error: "Xatolik!",
  warning: "Diqqat!",
};

export function SuccessModal({
  open,
  onClose,
  title,
  message,
  type = "success",
  autoClose = true,
  autoCloseDelay = 2000,
}: SuccessModalProps) {
  const Icon = iconMap[type];
  const iconColor = colorMap[type];
  const bgColor = bgColorMap[type];
  const defaultTitle = titleMap[type];

  React.useEffect(() => {
    if (open && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [open, autoClose, autoCloseDelay, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden">
        <div className="flex flex-col items-center py-8 px-6">
          {/* Icon with animated background */}
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              "animate-in zoom-in-50 duration-300",
              bgColor
            )}
          >
            <Icon className={cn("w-8 h-8", iconColor)} strokeWidth={2.5} />
          </div>

          {/* Title */}
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl font-semibold text-center">
              {title || defaultTitle}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground max-w-[250px]">
              {message}
            </DialogDescription>
          </DialogHeader>

          {/* Close button */}
          <Button
            onClick={onClose}
            className={cn(
              "mt-6 px-8",
              type === "success" && "bg-emerald-500 hover:bg-emerald-600",
              type === "error" && "bg-red-500 hover:bg-red-600",
              type === "warning" && "bg-amber-500 hover:bg-amber-600"
            )}
          >
            OK
          </Button>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="h-1 w-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all ease-linear",
                type === "success" && "bg-emerald-500",
                type === "error" && "bg-red-500",
                type === "warning" && "bg-amber-500"
              )}
              style={{
                animation: `shrink ${autoCloseDelay}ms linear forwards`,
              }}
            />
          </div>
        )}

        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

export { SuccessModal as default };
