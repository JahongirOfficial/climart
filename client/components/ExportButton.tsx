import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToExcel, exportToJSON, formatDataForExport } from "@/lib/exportUtils";

interface ExportButtonProps {
  data: any[];
  filename: string;
  fieldsToInclude?: string[];
  disabled?: boolean;
}

export const ExportButton = ({ data, filename, fieldsToInclude, disabled }: ExportButtonProps) => {
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    const formattedData = formatDataForExport(data, fieldsToInclude);
    
    switch (format) {
      case 'csv':
        exportToCSV(formattedData, filename);
        break;
      case 'excel':
        exportToExcel(formattedData, filename);
        break;
      case 'json':
        exportToJSON(formattedData, filename);
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || !data || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          Excel (.xls)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          JSON (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
