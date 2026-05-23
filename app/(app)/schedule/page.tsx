import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assignMember, unassign } from "./actions";

const ROLES = ["lead_vocal", "vocals", "acoustic", "electric", "bass", "keys", "drums", "tech"];

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

  const byDate = new Map<string, { id: string; role: string; user_id: string; name: string }[]>();
  for (const a of assignments ?? []) {
    const name =
      (a.profiles as { display_name?: string } | null)?.display_name ?? "Member";
    const list = byDate.get(a.service_date) ?? [];
    list.push({ id: a.id, role: a.role, user_id: a.user_id, name });
    byDate.set(a.service_date, list);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sunday schedule</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {dates.map((d) => {
          const items = byDate.get(d) ?? [];
          return (
            <Card key={d}>
              <CardHeader>
                <CardTitle>{fmt(d)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500">No assignments yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {items.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-mono text-xs">
                          {a.role}
                        </Badge>
                        <span className={a.user_id === profile.id ? "font-medium" : ""}>
                          {a.name}
                        </span>
                        {canEdit && (
                          <form action={unassign.bind(null, a.id)} className="ml-auto">
                            <button
                              type="submit"
                              className="text-xs text-zinc-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {canEdit && (
                  <form
                    action={assignMember}
                    className="flex flex-wrap gap-2 items-end pt-3 border-t"
                  >
                    <input type="hidden" name="service_date" value={d} />
                    <div className="space-y-1 flex-1 min-w-[8rem]">
                      <Label htmlFor={`user-${d}`} className="text-xs">
                        Member
                      </Label>
                      <select
                        id={`user-${d}`}
                        name="user_id"
                        required
                        className="w-full border rounded-md p-1 text-sm h-9 bg-transparent"
                      >
                        <option value="">Pick…</option>
                        {(members ?? []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 flex-1 min-w-[8rem]">
                      <Label htmlFor={`role-${d}`} className="text-xs">
                        Role
                      </Label>
                      <select
                        id={`role-${d}`}
                        name="role"
                        required
                        className="w-full border rounded-md p-1 text-sm h-9 bg-transparent"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-zinc-500">
        Custom role: add a date below to assign for a non-standard service.
      </div>
      {canEdit && (
        <form
          action={assignMember}
          className="flex flex-wrap gap-2 items-end border rounded-md p-3"
        >
          <div className="space-y-1">
            <Label htmlFor="custom-date" className="text-xs">
              Date
            </Label>
            <Input id="custom-date" name="service_date" type="date" required />
          </div>
          <div className="space-y-1 flex-1 min-w-[10rem]">
            <Label htmlFor="custom-user" className="text-xs">
              Member
            </Label>
            <select
              id="custom-user"
              name="user_id"
              required
              className="w-full border rounded-md p-1 text-sm h-9 bg-transparent"
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
            <Label htmlFor="custom-role" className="text-xs">
              Role
            </Label>
            <Input id="custom-role" name="role" placeholder="e.g. tech" required />
          </div>
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
