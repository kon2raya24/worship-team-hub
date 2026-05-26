"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
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
import { SubmitButton } from "@/components/submit-button";
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
  // Touch: long-press 200ms / 8px tolerance — keeps vertical scroll usable on phones.
  // Pointer (mouse / desktop trackpad): start on 5px movement, no delay.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // React 19 prop-sync pattern: when the server re-renders with new songs
  // (added / removed / reordered server-side), reset local optimistic state
  // during render — not in an effect.
  const [prevSongs, setPrevSongs] = useState(songs);
  if (prevSongs !== songs) {
    setPrevSongs(songs);
    setItems(songs);
  }

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
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li
            key={s.song_id}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.025] border border-white/[0.06]"
          >
            <span className="font-mono text-xs tabular-nums text-[#8a92b4] w-5 text-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <a
                href={`/songs/${s.song_id}`}
                className="font-medium text-white/95 hover:text-[#00e8ff] transition-colors"
              >
                {s.title}
              </a>
              <span className="text-[#8a92b4] text-sm">
                {s.played_in_key
                  ? ` · key ${s.played_in_key}`
                  : s.original_key
                    ? ` · key ${s.original_key}`
                    : ""}
                {s.artist ? ` · ${s.artist}` : ""}
              </span>
            </div>
            {(s.played_in_key || s.original_key) && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#00e8ff]/10 text-[#00e8ff] border border-[#00e8ff]/20">
                {s.played_in_key ?? s.original_key}
              </span>
            )}
          </li>
        ))}
      </ul>
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
      className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing px-1 text-[#8a92b4] hover:text-white transition-colors"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <span className="font-mono text-xs tabular-nums text-[#8a92b4] w-5 text-center">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <a
          href={`/songs/${row.song_id}`}
          className="font-medium text-white/95 hover:text-[#00e8ff] transition-colors"
        >
          {row.title}
        </a>
        <span className="text-[#8a92b4] text-sm">
          {row.played_in_key
            ? ` · key ${row.played_in_key}`
            : row.original_key
              ? ` · key ${row.original_key}`
              : ""}
          {row.artist ? ` · ${row.artist}` : ""}
        </span>
      </div>
      <form action={removeSongFromSetlist.bind(null, setlistId, row.song_id)}>
        <SubmitButton
          size="sm"
          variant="ghost"
          className="text-red-400 hover:text-red-300"
          pendingLabel="…"
        >
          Remove
        </SubmitButton>
      </form>
    </li>
  );
}
