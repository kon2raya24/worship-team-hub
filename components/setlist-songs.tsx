"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { reorderSetlistSongs, removeSongFromSetlist } from "@/app/(app)/setlists/actions";

export type SetlistSongRow = {
  song_id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  played_in_key: string | null;
};

export function SetlistSongs({
  setlistId,
  songs,
  canEdit,
}: {
  setlistId: string;
  songs: SetlistSongRow[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(songs);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.song_id === active.id);
    const newIndex = items.findIndex((i) => i.song_id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(() => {
      reorderSetlistSongs(setlistId, next.map((i) => i.song_id));
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No songs in this setlist yet.</p>;
  }

  if (!canEdit) {
    return (
      <ol className="space-y-1 list-decimal list-inside">
        {items.map((s) => (
          <li key={s.song_id}>
            <a href={`/songs/${s.song_id}`} className="hover:underline font-medium">
              {s.title}
            </a>
            <span className="text-zinc-500 text-sm">
              {s.played_in_key ? ` · key ${s.played_in_key}` : s.original_key ? ` · key ${s.original_key}` : ""}
              {s.artist ? ` · ${s.artist}` : ""}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.song_id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1">
          {items.map((s, i) => (
            <SortableRow key={s.song_id} row={s} index={i} setlistId={setlistId} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  row,
  index,
  setlistId,
}: {
  row: SetlistSongRow;
  index: number;
  setlistId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.song_id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border rounded-md p-2 bg-white dark:bg-zinc-950"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing px-1 text-zinc-400 hover:text-zinc-700"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <span className="w-6 text-right text-zinc-500 tabular-nums text-sm">{index + 1}.</span>
      <div className="flex-1 min-w-0">
        <a href={`/songs/${row.song_id}`} className="font-medium hover:underline">
          {row.title}
        </a>
        <span className="text-zinc-500 text-sm">
          {row.played_in_key ? ` · key ${row.played_in_key}` : row.original_key ? ` · key ${row.original_key}` : ""}
          {row.artist ? ` · ${row.artist}` : ""}
        </span>
      </div>
      <form action={removeSongFromSetlist.bind(null, setlistId, row.song_id)}>
        <Button type="submit" size="sm" variant="ghost" className="text-red-600">
          Remove
        </Button>
      </form>
    </li>
  );
}
