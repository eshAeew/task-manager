import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Plus,
  Search,
  Trash2,
  Palette,
  Edit2,
  Save,
  X,
  Tag as TagIcon,
  Pin,
  Grid,
  LayoutList,
  BookOpen,
  Link as LinkIcon,
  Image as ImageIcon,
  Star,
  Archive,
  Share2,
  Folder,
  Copy,
  AlarmClock,
  Check,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ReactQuill from 'react-quill';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  pinned: boolean;
  links: { title: string; url: string; }[];
  image?: string;
  favorite?: boolean;
  archived?: boolean;
  category?: string;
  markdown?: boolean;
  reminder?: string;
  shared?: boolean;
}

// Using semantic color classes that work with both light and dark themes
const COLORS = [
  { name: 'Default', value: 'bg-card' },
  { name: 'Red', value: 'bg-red-100/50 dark:bg-red-900/20' },
  { name: 'Yellow', value: 'bg-yellow-100/50 dark:bg-yellow-900/20' },
  { name: 'Green', value: 'bg-green-100/50 dark:bg-green-900/20' },
  { name: 'Blue', value: 'bg-blue-100/50 dark:bg-blue-900/20' },
  { name: 'Purple', value: 'bg-purple-100/50 dark:bg-purple-900/20' },
];

// Tag colors that work in both themes
const TAG_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
];

// Define category options for organizing notes
const CATEGORIES = [
  { name: 'Personal', value: 'personal', icon: <BookOpen className="h-4 w-4" /> },
  { name: 'Work', value: 'work', icon: <Folder className="h-4 w-4" /> },
  { name: 'Ideas', value: 'ideas', icon: <ImageIcon className="h-4 w-4" /> },
  { name: 'Tasks', value: 'tasks', icon: <Check className="h-4 w-4" /> },
];

// Rich text editor module configuration
const EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

export default function Notes() {
  const { toast } = useToast();
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", []);
  const [archivedNotes, setArchivedNotes] = useLocalStorage<Note[]>("archived-notes", []);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedLinks, setEditedLinks] = useState<{ title: string; url: string; }[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'archived'>('all');
  const [useMarkdownEditor, setUseMarkdownEditor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: COLORS[0].value,
    tags: [] as string[],
    pinned: false,
    links: [] as { title: string; url: string; }[],
    image: "",
    favorite: false,
    archived: false,
    category: "",
    markdown: false,
    reminder: "",
    shared: false,
  });

  // Get all unique tags from all notes
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  const addNote = () => {
    if (!newNote.title && !newNote.content) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      tags: newNote.tags,
      pinned: newNote.pinned,
      links: newNote.links,
      image: newNote.image,
      favorite: newNote.favorite,
      archived: newNote.archived,
      category: newNote.category,
      markdown: newNote.markdown,
      reminder: newNote.reminder,
      shared: newNote.shared,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes([note, ...notes]);
    setNewNote({
      title: "",
      content: "",
      color: COLORS[0].value,
      tags: [],
      pinned: false,
      links: [],
      image: "",
      favorite: false,
      archived: false,
      category: "",
      markdown: false,
      reminder: "",
      shared: false,
    });
    setIsAdding(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const startEditing = (note: Note) => {
    setEditingNote(note.id);
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setEditedTags(note.tags);
    setEditedLinks(note.links || []);
  };

  const saveEdit = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id
        ? {
            ...note,
            title: editedTitle,
            content: editedContent,
            tags: editedTags,
            links: editedLinks,
            updatedAt: new Date().toISOString()
          }
        : note
    ));
    setEditingNote(null);
  };

  const togglePin = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id
        ? { ...note, pinned: !note.pinned }
        : note
    ));
  };

  const addLink = (isNewNote: boolean = false) => {
    if (!newLinkTitle || !newLinkUrl) return;

    const newLink = { title: newLinkTitle, url: newLinkUrl };

    if (isNewNote) {
      setNewNote(prev => ({
        ...prev,
        links: [...prev.links, newLink]
      }));
    } else {
      setEditedLinks(prev => [...prev, newLink]);
    }

    setNewLinkTitle("");
    setNewLinkUrl("");
  };

  const removeLink = (index: number, isNewNote: boolean = false) => {
    if (isNewNote) {
      setNewNote(prev => ({
        ...prev,
        links: prev.links.filter((_, i) => i !== index)
      }));
    } else {
      setEditedLinks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateNoteColor = (id: string, color: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? { ...note, color, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const addTagToNote = (tag: string, isNewNote: boolean = false) => {
    if (!tag.trim()) return;
    const trimmedTag = tag.trim();
    
    if (isNewNote) {
      setNewNote(prev => {
        if (prev.tags.includes(trimmedTag)) return prev;
        return {
          ...prev,
          tags: [...prev.tags, trimmedTag]
        };
      });
    } else {
      setEditedTags(prev => {
        if (prev.includes(trimmedTag)) return prev;
        return [...prev, trimmedTag];
      });
    }
    setNewTag("");
  };

  const removeTagFromNote = (tagToRemove: string, isNewNote: boolean = false) => {
    if (isNewNote) {
      setNewNote(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    } else {
      setEditedTags(prev => prev.filter(tag => tag !== tagToRemove));
    }
  };

  const getTagColor = (tag: string) => {
    const index = Math.abs(tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    return TAG_COLORS[index % TAG_COLORS.length];
  };
  
  // New feature functions
  const toggleFavorite = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? { ...note, favorite: !note.favorite, updatedAt: new Date().toISOString() }
          : note
      )
    );
    toast({
      title: "Note updated",
      description: `Note ${notes.find(n => n.id === id)?.favorite ? 'removed from' : 'added to'} favorites.`,
    });
  };

  const archiveNote = (id: string) => {
    const noteToArchive = notes.find(note => note.id === id);
    if (!noteToArchive) return;
    
    const archivedNote = { ...noteToArchive, archived: true };
    setArchivedNotes([archivedNote, ...archivedNotes]);
    setNotes(notes.filter(note => note.id !== id));
    
    toast({
      title: "Note archived",
      description: "Note has been moved to archive.",
    });
  };

  const restoreNote = (id: string) => {
    const noteToRestore = archivedNotes.find(note => note.id === id);
    if (!noteToRestore) return;
    
    const restoredNote = { ...noteToRestore, archived: false };
    setNotes([restoredNote, ...notes]);
    setArchivedNotes(archivedNotes.filter(note => note.id !== id));
    
    toast({
      title: "Note restored",
      description: "Note has been moved from archive.",
    });
  };
  
  const deleteArchivedNote = (id: string) => {
    setArchivedNotes(archivedNotes.filter((note) => note.id !== id));
    toast({
      title: "Note deleted",
      description: "Note has been permanently deleted from archive.",
    });
  };

  const shareNote = (id: string) => {
    const note = notes.find(note => note.id === id);
    if (!note) return;
    
    // In a real app, this would generate a shareable link or show sharing options
    const shareableUrl = `${window.location.origin}/shared-note/${id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this note with others.",
      });
      
      // Mark note as shared
      setNotes(
        notes.map((note) =>
          note.id === id
            ? { ...note, shared: true }
            : note
        )
      );
    }).catch(() => {
      toast({
        title: "Failed to copy link",
        description: "Please try again.",
        variant: "destructive",
      });
    });
  };

  const updateCategory = (id: string, category: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? { ...note, category, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const toggleMarkdown = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? { ...note, markdown: !note.markdown, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const handleImageUpload = (isNewNote: boolean = false) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();

    fileInputRef.current.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        
        if (isNewNote) {
          setNewNote({ ...newNote, image: imageData });
        } else if (editingNote) {
          setNotes(
            notes.map((note) =>
              note.id === editingNote
                ? { ...note, image: imageData, updatedAt: new Date().toISOString() }
                : note
            )
          );
        }
        
        setIsUploading(false);
        toast({
          title: "Image uploaded",
          description: "Image has been added to your note.",
        });
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    };
  };

  // Get notes for current view mode
  const getNotesForView = () => {
    switch (viewMode) {
      case 'favorites':
        return notes.filter(note => note.favorite);
      case 'archived':
        return archivedNotes;
      case 'all':
      default:
        return notes;
    }
  };

  // Apply filters and sorting to the current view mode's notes
  const sortedAndFilteredNotes = getNotesForView()
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

      if (selectedCategory && note.category !== selectedCategory) {
        return false;
      }

      return selectedTag ? note.tags.includes(selectedTag) && matchesSearch : matchesSearch;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-background">
      <div className="flex flex-col items-center mb-8 space-y-4">
        <div className="flex items-center justify-between w-full max-w-4xl">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
            Notes
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsGridView(!isGridView)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isGridView ? <LayoutList className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
            </Button>
            <Button
              onClick={() => setIsAdding(true)}
              className="flex items-center bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700 dark:from-emerald-500 dark:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Note
            </Button>
          </div>
        </div>

        <div className="w-full max-w-4xl space-y-4">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-between">
            <Tabs 
              value={viewMode} 
              onValueChange={(value) => setViewMode(value as 'all' | 'favorites' | 'archived')}
              className="w-full"
            >
              <TabsList className="bg-background/50 dark:bg-background/20 backdrop-blur-sm border-2 grid w-full grid-cols-3">
                <TabsTrigger value="all" className="flex items-center justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BookOpen className="h-4 w-4 mr-2" />
                  All Notes
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center justify-center data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                  <Star className="h-4 w-4 mr-2" />
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center justify-center data-[state=active]:bg-slate-500 data-[state=active]:text-white">
                  <Archive className="h-4 w-4 mr-2" />
                  Archived
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes or tags..."
              className="pl-10 h-12 bg-background/50 dark:bg-background/20 backdrop-blur-sm border-2 focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all duration-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>Category</span>
              </label>
              <Select 
                value={selectedCategory || 'all'} 
                onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-full md:w-[180px] bg-background/50 dark:bg-background/20">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  className={`cursor-pointer transition-all ${
                    selectedTag === tag
                      ? getTagColor(tag)
                      : 'bg-muted hover:bg-muted/80 dark:bg-muted/20 dark:hover:bg-muted/30'
                  }`}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                  {selectedTag === tag && (
                    <X className="h-3 w-3 ml-1 hover:text-muted-foreground" />
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`grid gap-6 ${isGridView ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} max-w-[1400px] mx-auto`}>
        {isAdding && (
          <Card className={`${newNote.color} transition-all duration-300 transform hover:scale-102 shadow-lg hover:shadow-xl border-2`}>
            <CardHeader className="space-y-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewNote(prev => ({ ...prev, pinned: !prev.pinned }))}
                    className={`hover:bg-black/5 ${newNote.pinned ? 'text-yellow-600' : ''}`}
                  >
                    <Pin className={`h-4 w-4 ${newNote.pinned ? 'fill-current' : ''}`} />
                  </Button>
                  <div className="flex-1 overflow-hidden">
                    <Input
                      placeholder="Title"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Note content..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="min-h-[100px] bg-transparent border-none resize-none focus-visible:ring-0"
              />

              {/* Links Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Links</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Link title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="bg-transparent"
                  />
                  <Input
                    placeholder="URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="bg-transparent"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addLink(true)}
                  >
                    Add
                  </Button>
                </div>
                {newNote.links.length > 0 && (
                  <div className="space-y-2">
                    {newNote.links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {link.title}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLink(index, true)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTagToNote(newTag, true);
                      }
                    }}
                    className="bg-transparent"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTagToNote(newTag, true)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newNote.tags.map(tag => (
                    <Badge
                      key={tag}
                      className={`${getTagColor(tag)} cursor-pointer`}
                      onClick={() => removeTagFromNote(tag, true)}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-black/5">
                    <Palette className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {COLORS.map((color) => (
                    <DropdownMenuItem
                      key={color.value}
                      onClick={() => setNewNote({ ...newNote, color: color.value })}
                      className="cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded mr-2 ${color.value}`}></div>
                      {color.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="hover:bg-black/5"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={addNote}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {sortedAndFilteredNotes.map((note) => (
          <Card
            key={note.id}
            className={`${note.color} group transition-all duration-300 transform hover:scale-102 hover:shadow-lg border-2 ${
              !isGridView ? 'max-w-4xl mx-auto' : ''
            }`}
          >
            <CardHeader>
              <div className="flex flex-col gap-2">
                {/* Title section with pin button */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePin(note.id)}
                    className={`hover:bg-black/5 ${note.pinned ? 'text-yellow-600' : ''}`}
                  >
                    <Pin className={`h-4 w-4 ${note.pinned ? 'fill-current' : ''}`} />
                  </Button>
                  <div className="flex-1 overflow-hidden">
                    {editingNote === note.id ? (
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
                      />
                    ) : (
                      <h3 className="font-semibold text-lg truncate" title={note.title}>
                        {note.title}
                      </h3>
                    )}
                  </div>
                </div>
                
                {/* Action buttons in a separate row */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1 flex-wrap">
                  {/* Actions for regular notes */}
                  {viewMode !== 'archived' ? (
                    <>
                      {/* Color Picker */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-black/5">
                            <Palette className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {COLORS.map((color) => (
                            <DropdownMenuItem
                              key={color.value}
                              onClick={() => updateNoteColor(note.id, color.value)}
                              className="cursor-pointer"
                            >
                              <div className={`w-4 h-4 rounded mr-2 ${color.value}`}></div>
                              {color.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* More Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-black/5">
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => toggleFavorite(note.id)} className="cursor-pointer">
                            <Star className={`h-4 w-4 mr-2 ${note.favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            {note.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => toggleMarkdown(note.id)} className="cursor-pointer">
                            <AlarmClock className={`h-4 w-4 mr-2 ${note.markdown ? 'text-blue-500' : ''}`} />
                            {note.markdown ? 'Disable Markdown' : 'Enable Markdown'} 
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="cursor-pointer">
                              <Folder className="h-4 w-4 mr-2" />
                              {note.category ? 
                                CATEGORIES.find(c => c.value === note.category)?.name || 'Set Category' 
                                : 'Set Category'}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {CATEGORIES.map(category => (
                                <DropdownMenuItem 
                                  key={category.value}
                                  onClick={() => updateCategory(note.id, category.value)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center">
                                    {category.icon}
                                    <span className="ml-2">{category.name}</span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => archiveNote(note.id)} className="cursor-pointer text-amber-600 dark:text-amber-400">
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Note
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Edit/Save Button */}
                      {editingNote === note.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEdit(note.id)}
                          className="hover:bg-emerald-100"
                        >
                          <Save className="h-4 w-4 text-emerald-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(note)}
                          className="hover:bg-blue-100"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Restore Button for archived notes */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreNote(note.id)}
                        className="hover:bg-emerald-100"
                      >
                        <BookOpen className="h-4 w-4 text-emerald-600" />
                        <span className="ml-2">Restore</span>
                      </Button>
                      
                      {/* Delete Button for archived notes */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteArchivedNote(note.id)}
                        className="hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="ml-2">Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingNote === note.id ? (
                <>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[100px] bg-transparent border-none resize-none focus-visible:ring-0"
                  />

                  {/* Links Section */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Links</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Link title"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        className="bg-transparent"
                      />
                      <Input
                        placeholder="URL"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="bg-transparent"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addLink()}
                      >
                        Add
                      </Button>
                    </div>
                    {editedLinks.length > 0 && (
                      <div className="space-y-2">
                        {editedLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {link.title}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLink(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags Section */}
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTagToNote(newTag);
                          }
                        }}
                        className="bg-transparent"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTagToNote(newTag)}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editedTags.map(tag => (
                        <Badge
                          key={tag}
                          className={`${getTagColor(tag)} cursor-pointer`}
                          onClick={() => removeTagFromNote(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-muted-foreground">{note.content}</p>

                  {/* Display Links */}
                  {note.links && note.links.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Links</span>
                      </div>
                      <div className="space-y-2">
                        {note.links.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-600 hover:underline"
                          >
                            {link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {note.tags.map(tag => (
                        <Badge
                          key={tag}
                          className={getTagColor(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground/80">
                Last updated: {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}