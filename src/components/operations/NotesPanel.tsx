import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StickyNote, Send, Pin, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface OpsNote {
  id: string;
  user_id: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
}

const NotesPanel = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<OpsNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("ops_notes")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) setNotes(data as OpsNote[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
    const channel = supabase
      .channel("ops_notes_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ops_notes" }, () => fetchNotes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotes]);

  const handleSubmit = async () => {
    if (!newNote.trim() || !user) return;
    const { error } = await supabase.from("ops_notes").insert({
      user_id: user.id,
      content: newNote.trim(),
      priority,
    } as any);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      setNewNote("");
      setPriority("normal");
    }
  };

  const togglePin = async (note: OpsNote) => {
    await supabase.from("ops_notes").update({ is_pinned: !note.is_pinned } as any).eq("id", note.id);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("ops_notes").delete().eq("id", id);
  };

  return (
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <StickyNote className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-zinc-300">Interne Notizen</h2>
        <span className="text-[10px] text-zinc-600 ml-auto">{notes.length} Einträge</span>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mb-2 space-y-1.5">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Nachricht an das Team..."
          className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs min-h-[56px] max-h-[80px] resize-none placeholder:text-zinc-600 focus-visible:ring-amber-500/30"
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPriority(priority === "normal" ? "urgent" : "normal")}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
              priority === "urgent"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-[#0c1018] text-zinc-500 border border-[#1e2836] hover:text-zinc-400"
            )}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            {priority === "urgent" ? "Dringend" : "Normal"}
          </button>
          <div className="flex-1" />
          <Button
            size="sm"
            disabled={!newNote.trim()}
            onClick={handleSubmit}
            className="h-6 px-2.5 text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Send className="w-3 h-3 mr-1" />
            Senden
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-auto space-y-1.5 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4">
            <StickyNote className="w-5 h-5 mx-auto mb-1 text-zinc-700" />
            <p className="text-[10px] text-zinc-600">Noch keine Notizen vorhanden</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "p-2 rounded border transition-colors group",
                note.is_pinned
                  ? "bg-amber-500/5 border-amber-500/20"
                  : note.priority === "urgent"
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-[#0c1018] border-[#1e2836]"
              )}
            >
              <div className="flex items-start gap-1.5">
                {note.is_pinned && <Pin className="w-2.5 h-2.5 text-amber-400 mt-0.5 flex-shrink-0" />}
                {note.priority === "urgent" && !note.is_pinned && (
                  <AlertTriangle className="w-2.5 h-2.5 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-[11px] text-zinc-300 flex-1 whitespace-pre-wrap break-words">{note.content}</p>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => togglePin(note)} className="p-0.5 rounded hover:bg-[#1e2836] text-zinc-600 hover:text-amber-400">
                    <Pin className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className="p-0.5 rounded hover:bg-[#1e2836] text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-zinc-600 mt-1">
                {format(new Date(note.created_at), "dd. MMM, HH:mm", { locale: de })} · #{note.user_id.slice(0, 6)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
