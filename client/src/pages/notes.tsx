import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Plus, Search, Trash2, Palette, Edit2, Save } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const COLORS = [
  { name: 'Default', value: 'bg-card' },
  { name: 'Red', value: 'bg-red-50 hover:bg-red-100' },
  { name: 'Yellow', value: 'bg-yellow-50 hover:bg-yellow-100' },
  { name: 'Green', value: 'bg-green-50 hover:bg-green-100' },
  { name: 'Blue', value: 'bg-blue-50 hover:bg-blue-100' },
  { name: 'Purple', value: 'bg-purple-50 hover:bg-purple-100' },
];

export default function Notes() {
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", []);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: COLORS[0].value,
  });

  const addNote = () => {
    if (!newNote.title && !newNote.content) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes([note, ...notes]);
    setNewNote({ title: "", content: "", color: COLORS[0].value });
    setIsAdding(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const startEditing = (note: Note) => {
    setEditingNote(note.id);
    setEditedTitle(note.title);
    setEditedContent(note.content);
  };

  const saveEdit = (id: string) => {
    setNotes(notes.map(note => 
      note.id === id 
        ? {
            ...note,
            title: editedTitle,
            content: editedContent,
            updatedAt: new Date().toISOString()
          }
        : note
    ));
    setEditingNote(null);
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

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="flex flex-col items-center mb-8 space-y-4">
        <div className="flex items-center justify-between w-full max-w-4xl">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Notes
          </h1>
          <Button 
            onClick={() => setIsAdding(true)} 
            className="flex items-center bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Note
          </Button>
        </div>

        <div className="w-full max-w-4xl relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-10 h-12 bg-white/50 backdrop-blur-sm border-2 focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all duration-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-[1400px] mx-auto">
        {isAdding && (
          <Card className={`${newNote.color} transition-all duration-300 transform hover:scale-102 shadow-lg hover:shadow-xl border-2`}>
            <CardHeader className="space-y-2">
              <Input
                placeholder="Title"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
                className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
              />
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Note content..."
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
                className="min-h-[100px] bg-transparent border-none resize-none focus-visible:ring-0"
              />
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
                      onClick={() =>
                        setNewNote({ ...newNote, color: color.value })
                      }
                      className="cursor-pointer"
                    >
                      <div
                        className={`w-4 h-4 rounded mr-2 ${color.value}`}
                      ></div>
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

        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className={`${note.color} group transition-all duration-300 transform hover:scale-102 hover:shadow-lg border-2`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                {editingNote === note.id ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
                  />
                ) : (
                  <h3 className="font-semibold text-lg">{note.title}</h3>
                )}
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
                          <div
                            className={`w-4 h-4 rounded mr-2 ${color.value}`}
                          ></div>
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
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[100px] bg-transparent border-none resize-none focus-visible:ring-0"
                />
              ) : (
                <p className="whitespace-pre-wrap text-muted-foreground">{note.content}</p>
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