import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, Circle, AlertTriangle, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export type TaskFilterOptions = {
  showCompleted: boolean;
  showNotCompleted: boolean;
  showOverdue: boolean;
  filterTags: string[];
};

interface TaskFilterProps {
  filters: TaskFilterOptions;
  onFilterChange: (filters: TaskFilterOptions) => void;
}

export function TaskFilter({ filters, onFilterChange }: TaskFilterProps) {
  const [open, setOpen] = useState(false);

  // Count active filters
  const activeFilterCount = 
    (filters.showCompleted ? 1 : 0) +
    (filters.showNotCompleted ? 1 : 0) +
    (filters.showOverdue ? 1 : 0) +
    (filters.filterTags?.length || 0);

  // Get a summary of active filters for the badge
  const getFilterSummary = (): string => {
    const parts = [];
    if (filters.showCompleted) parts.push("Completed");
    if (filters.showNotCompleted) parts.push("Not Completed");
    if (filters.showOverdue) parts.push("Overdue");
    if (filters.filterTags && filters.filterTags.length > 0) {
      parts.push(`${filters.filterTags.length} tag${filters.filterTags.length > 1 ? 's' : ''}`);
    }
    
    return parts.join(", ");
  };

  const handleFilterChange = (key: keyof TaskFilterOptions, value: boolean) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      showCompleted: true,
      showNotCompleted: true,
      showOverdue: false,
      filterTags: []
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 flex items-center gap-1.5 bg-background"
        >
          <Filter className="h-4 w-4 mr-1" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1.5 px-1.5 font-normal"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 shadow-md" align="start">
        <div className="p-3">
          <div className="text-sm font-medium py-1.5 px-1">Filter by Status</div>
          <div className="grid gap-2.5">
            <div className="flex items-center space-x-2.5">
              <Checkbox 
                id="completed" 
                checked={filters.showCompleted}
                onCheckedChange={(checked) => 
                  handleFilterChange("showCompleted", checked === true)
                }
                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
              <Label htmlFor="completed" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completed
              </Label>
            </div>
            <div className="flex items-center space-x-2.5">
              <Checkbox 
                id="not-completed" 
                checked={filters.showNotCompleted}
                onCheckedChange={(checked) => 
                  handleFilterChange("showNotCompleted", checked === true)
                }
              />
              <Label htmlFor="not-completed" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                <Circle className="h-4 w-4 text-gray-500" />
                Not Completed
              </Label>
            </div>
          </div>
          
          <Separator className="my-3" />
          
          <div className="text-sm font-medium py-1.5 px-1">Filter by Due Date</div>
          <div className="grid gap-2.5">
            <div className="flex items-center space-x-2.5">
              <Checkbox 
                id="overdue" 
                checked={filters.showOverdue}
                onCheckedChange={(checked) => 
                  handleFilterChange("showOverdue", checked === true)
                }
                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <Label htmlFor="overdue" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Overdue
              </Label>
            </div>
          </div>

          <Separator className="my-3" />

          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-sm mt-1" 
              onClick={clearFilters}
            >
              Clear all filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}