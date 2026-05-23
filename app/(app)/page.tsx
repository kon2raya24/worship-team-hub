import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: nextSetlist }, { data: pinned }, { data: latestDevotion }, { data: openPrayers }] =
    await Promise.all([
      supabase
        .from("setlists")
        .select("id, service_date, theme")
        .gte("service_date", today)
        .order("service_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("announcements")
        .select("id, title, body, created_at")
        .eq("pinned", true)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("devotions")
        .select("id, title, scripture_ref, published_at")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("prayer_requests")
        .select("id", { count: "exact", head: true })
        .eq("is_answered", false),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {profile.display_name}</h1>
        <p className="text-zinc-500">Here&apos;s what&apos;s happening with the worship team.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next Sunday</CardTitle>
            <CardDescription>
              {nextSetlist ? formatDate(nextSetlist.service_date) : "No setlist scheduled yet."}
            </CardDescription>
          </CardHeader>
          {nextSetlist && (
            <CardContent>
              <p className="text-sm">{nextSetlist.theme ?? "Theme TBA"}</p>
              <Link href={`/setlists/${nextSetlist.id}`} className="text-sm underline">
                Open setlist →
              </Link>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest devotion</CardTitle>
            <CardDescription>
              {latestDevotion
                ? `${latestDevotion.title}${latestDevotion.scripture_ref ? ` — ${latestDevotion.scripture_ref}` : ""}`
                : "No devotions posted yet."}
            </CardDescription>
          </CardHeader>
          {latestDevotion && (
            <CardContent>
              <Link href={`/devotions/${latestDevotion.id}`} className="text-sm underline">
                Read →
              </Link>
            </CardContent>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pinned announcements
            {openPrayers?.length !== undefined && (
              <Badge variant="secondary" className="ml-auto">
                {/* count comes back via head:true on supabase-js; render link instead */}
                <Link href="/prayer">Prayer requests</Link>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pinned && pinned.length > 0 ? (
            pinned.map((a) => (
              <div key={a.id} className="border-l-2 border-zinc-300 pl-3">
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-zinc-500 whitespace-pre-wrap">{a.body}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">Nothing pinned right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
