import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tag, X, Plus, ChevronDown } from "lucide-react";

interface TagFilterProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilter({ selectedTags, availableTags, onTagsChange }: TagFilterProps) {
  const [tagInput, setTagInput] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  
  // Initial number of tags to show
  const INITIAL_TAG_COUNT = 6;

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
  
  // Get tags to display based on show all toggle
  const visibleTags = showAllTags ? uniqueTags : uniqueTags.slice(0, INITIAL_TAG_COUNT);
  const hasMoreTags = uniqueTags.length > INITIAL_TAG_COUNT;

  return (
    <Card className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-3.5 w-3.5 text-blue-500" />
        <h3 className="text-xs font-medium">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 text-xs px-2 py-0"
            onClick={() => onTagsChange([])}
          >
            Clear All
          </Button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 py-1 px-1.5 bg-muted/50 rounded-md">
          {selectedTags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary"
              className="flex items-center gap-0.5 text-xs h-5 py-0 px-1.5"
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
      
      <div className="flex gap-1.5 items-center mb-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          placeholder="Add new tag..."
          className="h-7 text-xs"
        />
        <Button 
          size="sm" 
          className="h-7 text-xs px-2"
          disabled={!tagInput.trim()}
          onClick={() => handleAddTag(tagInput)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
        
      {uniqueTags.length > 0 ? (
        <div className="border rounded-md">
          <div className="p-1">
            <div className="flex flex-wrap gap-1">
              {visibleTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer text-xs h-5 py-0 ${selectedTags.includes(tag) ? "" : "hover:bg-secondary"}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {hasMoreTags && (
            <div className="border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-4 text-xs justify-center items-center p-0"
                onClick={() => setShowAllTags(!showAllTags)}
              >
                {showAllTags ? "Show Less" : `Load More (${uniqueTags.length - INITIAL_TAG_COUNT})`}
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAllTags ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center border rounded-md py-1.5">
          <div className="text-center text-xs text-muted-foreground">
            No tags available yet
          </div>
        </div>
      )}
    </Card>
  );
}