import { useState, useEffect } from "react";
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
  Image as ImageIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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

export default function Notes() {
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", []);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedLinks, setEditedLinks] = useState<{ title: string; url: string; }[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: COLORS[0].value,
    tags: [] as string[],
    pinned: false,
    links: [] as { title: string; url: string; }[],
    image: "",
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

    if (isNewNote) {
      setNewNote(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, tag.trim()])]
      }));
    } else {
      setEditedTags(prev => [...new Set([...prev, tag.trim()])]);
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

  // Sort notes with pinned first, then by date
  const sortedAndFilteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes or tags..."
              className="pl-10 h-12 bg-background/50 dark:bg-background/20 backdrop-blur-sm border-2 focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all duration-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewNote(prev => ({ ...prev, pinned: !prev.pinned }))}
                  className={`hover:bg-black/5 ${newNote.pinned ? 'text-yellow-600' : ''}`}
                >
                  <Pin className={`h-4 w-4 ${newNote.pinned ? 'fill-current' : ''}`} />
                </Button>
                <Input
                  placeholder="Title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
                />
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
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePin(note.id)}
                    className={`hover:bg-black/5 ${note.pinned ? 'text-yellow-600' : ''}`}
                  >
                    <Pin className={`h-4 w-4 ${note.pinned ? 'fill-current' : ''}`} />
                  </Button>
                  {editingNote === note.id ? (
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
                    />
                  ) : (
                    <h3 className="font-semibold text-lg">{note.title}</h3>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
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