import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, Circle, AlertTriangle, Filter, Tag, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export type TaskFilterOptions = {
  showCompleted: boolean;
  showNotCompleted: boolean;
  showOverdue: boolean;
  filterTags: string[];
};

interface TaskFilterProps {
  filters: TaskFilterOptions;
  onFilterChange: (filters: TaskFilterOptions) => void;
  availableTags?: string[];
}

export function TaskFilter({ filters, onFilterChange, availableTags = [] }: TaskFilterProps) {
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Count active filters
  const activeFilterCount = 
    (filters.showCompleted ? 1 : 0) +
    (filters.showNotCompleted ? 1 : 0) +
    (filters.showOverdue ? 1 : 0) +
    (filters.filterTags?.length || 0);

  // Create a list of unique tags from tasks
  const uniqueTags = Array.from(new Set([...availableTags]));

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

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return;
    
    if (!filters.filterTags?.includes(tag)) {
      onFilterChange({
        ...filters,
        filterTags: [...(filters.filterTags || []), tag.trim().toLowerCase()]
      });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    onFilterChange({
      ...filters,
      filterTags: filters.filterTags?.filter(t => t !== tag) || []
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput) {
      e.preventDefault();
      handleAddTag(tagInput);
    }
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
      <PopoverContent className="w-[240px] p-0 shadow-md" align="start">
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
          
          <div className="text-sm font-medium py-1.5 px-1">Filter by Tags</div>
          <div className="grid gap-2.5">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-500" />
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tag filter..."
                className="h-8 text-sm"
              />
            </div>
            
            {filters.filterTags && filters.filterTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 my-2">
                {filters.filterTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    #{tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {uniqueTags.length > 0 && (
              <ScrollArea className="h-24 rounded-md border p-2">
                <div className="flex flex-wrap gap-1.5">
                  {uniqueTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => handleAddTag(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}
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