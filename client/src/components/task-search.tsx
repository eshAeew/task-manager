import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search, Tags } from "lucide-react";
import { categoryOptions } from "@shared/schema";

interface TaskSearchProps {
  onSearch: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  tags: string[];
}

export function TaskSearch({
  onSearch,
  onCategoryChange,
  onTagAdd,
  onTagRemove,
  tags,
}: TaskSearchProps) {
  const [tagInput, setTagInput] = useState("");

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      onTagAdd(tagInput.trim().toLowerCase());
      setTagInput("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Select onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <span className="flex items-center gap-2">
                  {category.icon} {category.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 items-center">
        <Tags className="h-4 w-4 text-muted-foreground" />
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagAdd}
          placeholder="Add tags (press Enter)"
          className="flex-1"
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => onTagRemove(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
