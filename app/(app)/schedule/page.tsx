import { Calendar, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { TextSubmit } from "@/components/text-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { assignMember, unassign } from "./actions";

const ROLES = [
  "lead_vocal",
  "vocals",
  "acoustic",
  "electric",
  "bass",
  "keys",
  "drums",
  "tech",
];

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function nextSunday(offsetWeeks = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + diff + offsetWeeks * 7);
  return d.toISOString().slice(0, 10);
}

export default async function SchedulePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const canEdit = isLeader(profile);

  const dates = [0, 1, 2, 3].map(nextSunday);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: assignments }, { data: members }] = await Promise.all([
    supabase
      .from("schedule_assignments")
      .select("id, service_date, role, user_id, profiles(display_name)")
      .gte("service_date", today)
      .order("service_date"),
    supabase.from("profiles").select("id, display_name").order("display_name"),
  ]);

  const byDate = new Map<
    string,
    { id: string; role: string; user_id: string; name: string }[]
  >();
  for (const a of assignments ?? []) {
    const name =
      (a.profiles as { display_name?: string } | null)?.display_name ?? "Member";
    const list = byDate.get(a.service_date) ?? [];
    list.push({ id: a.id, role: a.role, user_id: a.user_id, name });
    byDate.set(a.service_date, list);
  }

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={Calendar}
        title="Sunday schedule"
        subtitle="Next 4 services · roster by role"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {dates.map((d) => {
          const items = byDate.get(d) ?? [];
          const isFirst = d === dates[0];
          return (
            <div
              key={d}
              className={`glass p-5 ${
                isFirst ? "ring-1 ring-[#00e8ff]/30" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="eyebrow">
                    {isFirst ? "This Sunday" : "Upcoming"}
                  </p>
                  <h3 className="font-display text-lg font-semibold mt-0.5">
                    {fmt(d)}
                  </h3>
                </div>
                <span className="text-xs text-[#8a92b4]">
                  {items.length} assigned
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-[#8a92b4] py-2">No assignments yet.</p>
              ) : (
                <ul className="space-y-1.5 mb-3">
                  {items.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg bg-white/[0.025]"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#00e8ff] bg-[#00e8ff]/10 px-1.5 py-0.5 rounded">
                        {a.role}
                      </span>
                      <span
                        className={
                          a.user_id === profile.id
                            ? "font-medium text-white"
                            : "text-white/85"
                        }
                      >
                        {a.name}
                      </span>
                      {canEdit && (
                        <form
                          action={unassign.bind(null, a.id)}
                          className="ml-auto"
                        >
                          <TextSubmit danger pendingLabel="…">Remove</TextSubmit>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && (
                <form
                  action={assignMember}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end pt-3 border-t border-white/[0.06]"
                >
                  <input type="hidden" name="service_date" value={d} />
                  <div className="space-y-1">
                    <Label htmlFor={`user-${d}`} className="text-[10px] uppercase tracking-wider text-[#8a92b4]">
                      Member
                    </Label>
                    <select
                      id={`user-${d}`}
                      name="user_id"
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-sm h-9"
                    >
                      <option value="">Pick…</option>
                      {(members ?? []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`role-${d}`} className="text-[10px] uppercase tracking-wider text-[#8a92b4]">
                      Role
                    </Label>
                    <select
                      id={`role-${d}`}
                      name="role"
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-sm h-9"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SubmitButton
                    size="sm"
                    pendingLabel="…"
                    className="gap-1 col-span-2 sm:col-span-1"
                  >
                    <Plus className="size-3.5" /> Add
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div className="glass p-5">
          <p className="eyebrow mb-3">Custom date</p>
          <form
            action={assignMember}
            className="grid sm:grid-cols-[140px_1fr_1fr_auto] gap-3 items-end"
          >
            <div className="space-y-1">
              <Label htmlFor="custom-date" className="text-[10px] uppercase tracking-wider text-[#8a92b4]">
                Date
              </Label>
              <Input id="custom-date" name="service_date" type="date" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-user" className="text-[10px] uppercase tracking-wider text-[#8a92b4]">
                Member
              </Label>
              <select
                id="custom-user"
                name="user_id"
                required
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-sm h-9"
              >
                <option value="">Pick…</option>
                {(members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-role" className="text-[10px] uppercase tracking-wider text-[#8a92b4]">
                Role
              </Label>
              <Input
                id="custom-role"
                name="role"
                placeholder="e.g. tech"
                required
              />
            </div>
            <SubmitButton size="sm" pendingLabel="…" className="gap-1">
              <Plus className="size-3.5" /> Add
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
