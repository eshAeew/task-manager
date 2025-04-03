import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, ChevronDown } from "lucide-react";

interface TagFilterProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilter({ selectedTags, availableTags, onTagsChange }: TagFilterProps) {
  const [tagInput, setTagInput] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    <div className="flex-1">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map(tag => (
          <Badge 
            key={tag} 
            variant="default"
            className="flex items-center gap-0.5 h-6 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0"
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
            className="h-6 text-xs px-1.5 text-muted-foreground"
            onClick={() => onTagsChange([])}
          >
            Clear
          </Button>
        )}
        
        {/* Show/Hide available tags toggle */}
        {uniqueTags.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Tags" : "Browse Tags"}
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        )}
      </div>
      
      {/* Available tags panel that shows only when expanded */}
      {isExpanded && (
        <div className="mt-2 p-2 border rounded-md bg-card">
          {uniqueTags.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {visibleTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${
                      selectedTags.includes(tag) 
                        ? "bg-primary/10 text-primary hover:bg-primary/20 border-0" 
                        : "bg-card text-muted-foreground hover:bg-accent border border-input"
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
                  {showAllTags ? "Show Less" : `Show All (${uniqueTags.length - INITIAL_TAG_COUNT} more)`}
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAllTags ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </>
          ) : (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">No tags available yet</span>
            </div>
          )}
          
          {/* Add new tag input inside the panel */}
          <div className="mt-2 flex items-center gap-2 pt-2 border-t">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Create new tag..."
              className="h-7 text-xs"
            />
            <Button 
              variant="outline"
              size="sm" 
              className="h-7 text-xs px-2"
              disabled={!tagInput.trim()}
              onClick={() => handleAddTag(tagInput)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}
      
      {uniqueTags.length === 0 && !selectedTags.length && (
        <div className="text-xs text-muted-foreground">
          No tags available yet
        </div>
      )}
    </div>
  );
}