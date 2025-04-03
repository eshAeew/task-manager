import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    <div className="mb-3 flex flex-col">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground border-b pb-1.5">
        <Tag className="h-3.5 w-3.5" />
        <span className="font-medium">Filter by Tags</span>
      </div>

      <div className="flex gap-1.5 items-center mb-3">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          placeholder="Add new tag..."
          className="h-8 text-xs bg-background"
        />
        <Button 
          variant="outline"
          size="sm" 
          className="h-8 text-xs px-2 hover:bg-muted"
          disabled={!tagInput.trim()}
          onClick={() => handleAddTag(tagInput)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
      
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map(tag => (
            <Badge 
              key={tag} 
              variant="default"
              className="flex items-center gap-0.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0"
            >
              #{tag}
              <button
                className="ml-1 hover:bg-transparent rounded-full focus:outline-none"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs px-1.5 text-muted-foreground"
              onClick={() => onTagsChange([])}
            >
              Clear
            </Button>
          )}
        </div>
      )}
        
      {uniqueTags.length > 0 ? (
        <div className="mt-1 w-full">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {visibleTags.map(tag => (
              <Badge 
                key={tag} 
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  selectedTags.includes(tag) 
                    ? "bg-primary/10 text-primary hover:bg-primary/20 border-0" 
                    : "bg-background text-muted-foreground hover:bg-muted border border-input"
                }`}
                onClick={() => toggleTag(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
          
          {hasMoreTags && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 text-xs justify-center items-center p-0 text-muted-foreground"
              onClick={() => setShowAllTags(!showAllTags)}
            >
              {showAllTags ? "Show Less" : `Load More (${uniqueTags.length - INITIAL_TAG_COUNT})`}
              <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${showAllTags ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center text-xs text-muted-foreground mt-1 py-2 border rounded-md">
          No tags available yet
        </div>
      )}
    </div>
  );
}