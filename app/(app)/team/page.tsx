import { Users, Crown, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isLeader, roleLabel } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { TextSubmit } from "@/components/text-submit";
import { setRole } from "./actions";

export default async function TeamPage() {
  const me = await requireProfile();
  const canEdit = isLeader(me);
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, role, instruments, created_at")
    .order("role", { ascending: false })
    .order("display_name");

  const leaders = (members ?? []).filter((m) => m.role === "leader");
  const regular = (members ?? []).filter((m) => m.role !== "leader");

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <PageHeader
        icon={Users}
        title="Team"
        subtitle={`${(members ?? []).length} member${
          (members ?? []).length === 1 ? "" : "s"
        } · ${leaders.length} editor${leaders.length === 1 ? "" : "s"}`}
      />

      {leaders.length > 0 && (
        <section className="space-y-2">
          <h2 className="eyebrow flex items-center gap-2">
            <Crown className="size-3" /> Editors
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {leaders.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                isMe={m.id === me.id}
                canEdit={canEdit}
              />
            ))}
          </ul>
        </section>
      )}

      {regular.length > 0 && (
        <section className="space-y-2">
          <h2 className="eyebrow flex items-center gap-2">
            <UserIcon className="size-3" /> Members
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {regular.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                isMe={m.id === me.id}
                canEdit={canEdit}
              />
            ))}
          </ul>
        </section>
      )}

      {(members ?? []).length === 0 && (
        <p className="glass p-8 text-center text-[#8a92b4]">No team members yet.</p>
      )}
    </div>
  );
}

function MemberCard({
  member,
  isMe,
  canEdit,
}: {
  member: {
    id: string;
    display_name: string;
    role: string;
    instruments: string[];
  };
  isMe: boolean;
  canEdit: boolean;
}) {
  const isLeader = member.role === "leader";
  return (
    <li
      className={`glass p-4 ${isLeader ? "ring-1 ring-[#00e8ff]/25" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center justify-center size-10 rounded-md font-display font-semibold text-base shrink-0 ${
            isLeader
              ? "bg-gradient-to-br from-[#00e8ff]/20 to-[#8b5cf6]/20 text-white ring-1 ring-[#00e8ff]/30"
              : "bg-white/[0.06] text-[#c8cee6] ring-1 ring-white/[0.1]"
          }`}
        >
          {member.display_name[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-white/95 flex items-center gap-2">
            {member.display_name}
            {isMe && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a92b4]">
                you
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                isLeader
                  ? "bg-[#00e8ff]/10 text-[#00e8ff] border-[#00e8ff]/30"
                  : "bg-white/[0.04] text-[#8a92b4] border-white/[0.08]"
              }`}
            >
              {roleLabel(member.role as "leader" | "member")}
            </span>
            {member.instruments.length > 0 && (
              <span className="text-xs text-[#8a92b4] truncate">
                {member.instruments.join(" · ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {canEdit && !isMe && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-end">
          <form
            action={setRole.bind(
              null,
              member.id,
              isLeader ? "member" : "leader"
            )}
          >
            <TextSubmit pendingLabel="…">
              {isLeader ? "Make a member" : "Make an editor"}
            </TextSubmit>
          </form>
        </div>
      )}
    </li>
  );
}
