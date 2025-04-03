import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tag, X, Plus } from "lucide-react";

interface TagFilterProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilter({ selectedTags, availableTags, onTagsChange }: TagFilterProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return;
    
    const normalizedTag = tag.trim().toLowerCase();
    if (!selectedTags.includes(normalizedTag)) {
      onTagsChange([...selectedTags, normalizedTag]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput) {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      handleAddTag(tag);
    }
  };

  // Create a list of unique tags
  const uniqueTags = Array.from(new Set([...availableTags])).sort();

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-medium">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => onTagsChange([])}
          >
            Clear All
          </Button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 py-1.5 px-2 bg-muted/50 rounded-md">
          {selectedTags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              #{tag}
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex gap-1.5 items-center mb-3">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          placeholder="Add new tag..."
          className="h-8 text-xs"
        />
        <Button 
          size="sm" 
          className="h-8 text-xs px-2"
          disabled={!tagInput.trim()}
          onClick={() => handleAddTag(tagInput)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
        
      {uniqueTags.length > 0 ? (
        <ScrollArea className="h-24 p-1.5 border rounded-md">
          <div className="flex flex-wrap gap-1.5 pr-2">
            {uniqueTags.map(tag => (
              <Badge 
                key={tag} 
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer text-xs ${selectedTags.includes(tag) ? "" : "hover:bg-secondary"}`}
                onClick={() => toggleTag(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="h-24 flex items-center justify-center border rounded-md">
          <div className="text-center text-xs text-muted-foreground py-3">
            No tags available yet
          </div>
        </div>
      )}
    </Card>
  );
}