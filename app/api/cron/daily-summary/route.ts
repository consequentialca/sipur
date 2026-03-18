import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  // Get internal user IDs to exclude from all metrics
  const { data: internalUsers } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("email", "%@rreichmann.com");
  const excludedIds = (internalUsers ?? []).map((u) => u.id);

  // New users in last 24h (excluding internal)
  const { count: newUsers } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .not("email", "ilike", "%@rreichmann.com");

  // Total registered users (excluding internal)
  const { count: totalUsers } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .not("email", "ilike", "%@rreichmann.com");

  // Stories generated in last 24h — exclude logged-in internal users; keep anon
  let recentStoriesQuery = supabaseAdmin
    .from("story_events")
    .select("seed, user_id, created_at")
    .gte("created_at", sinceIso);
  if (excludedIds.length > 0) {
    recentStoriesQuery = recentStoriesQuery.not("user_id", "in", `(${excludedIds.join(",")})`);
  }
  const { data: recentStories } = await recentStoriesQuery;

  // Total stories generated all time (excluding internal)
  let totalStoriesQuery = supabaseAdmin
    .from("story_events")
    .select("*", { count: "exact", head: true });
  if (excludedIds.length > 0) {
    totalStoriesQuery = totalStoriesQuery.not("user_id", "in", `(${excludedIds.join(",")})`);
  }
  const { count: totalStories } = await totalStoriesQuery;

  const stories = recentStories ?? [];
  const todayCount = stories.length;
  const anonCount = stories.filter((r) => !r.user_id).length;
  const loggedInCount = todayCount - anonCount;

  // Breakdowns
  const voiceCounts: Record<string, number> = {};
  const durationCounts: Record<string, number> = {};
  const toneCounts: Record<string, number> = {};

  for (const row of stories) {
    const seed = row.seed as {
      voice?: string;
      duration?: string;
      tone?: string[];
    };

    const voice = seed?.voice ?? "unknown";
    voiceCounts[voice] = (voiceCounts[voice] ?? 0) + 1;

    const duration = seed?.duration ?? "unknown";
    durationCounts[duration] = (durationCounts[duration] ?? 0) + 1;

    for (const t of seed?.tone ?? []) {
      toneCounts[t] = (toneCounts[t] ?? 0) + 1;
    }
  }

  const fmtCounts = (obj: Record<string, number>) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}: ${v}`)
      .join("  |  ") || "—";

  const topTones = Object.entries(toneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ") || "—";

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Georgia, serif; background: #0a0814; color: #f5e6c8; margin: 0; padding: 24px; }
    .card { background: rgba(10,8,20,0.95); border: 1px solid rgba(180,150,80,0.3); border-radius: 12px; padding: 32px; max-width: 580px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 4px; color: #f5e6c8; }
    .subtitle { color: rgba(245,230,200,0.5); font-size: 13px; margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    td { padding: 8px 0; border-bottom: 1px solid rgba(180,150,80,0.1); font-size: 15px; }
    td:first-child { color: rgba(245,230,200,0.55); width: 55%; }
    td:last-child { font-weight: bold; color: #f5e6c8; }
    .section { margin-top: 24px; }
    .section-title { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(180,150,80,0.6); margin-bottom: 10px; }
    .breakdown { font-size: 13px; color: rgba(245,230,200,0.75); line-height: 2; }
    .note { font-size: 11px; color: rgba(245,230,200,0.35); margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>&#128202; Sipur Daily Summary</h1>
    <div class="subtitle">${dateLabel} &middot; 8 am EST</div>

    <table>
      <tr><td>New users today</td><td>${newUsers ?? 0}</td></tr>
      <tr><td>Stories generated today</td><td>${todayCount} &nbsp;<span style="font-weight:normal;font-size:12px;color:rgba(245,230,200,0.4)">(${loggedInCount} logged-in · ${anonCount} anonymous)</span></td></tr>
      <tr><td>Total registered users</td><td>${totalUsers ?? 0}</td></tr>
      <tr><td>Total stories generated (all time)</td><td>${totalStories ?? 0}</td></tr>
    </table>

    ${todayCount > 0 ? `
    <div class="section">
      <div class="section-title">Today's Stories — Breakdown</div>
      <div class="breakdown">
        <strong>By voice:</strong> ${fmtCounts(voiceCounts)}<br/>
        <strong>By duration:</strong> ${fmtCounts(durationCounts)}<br/>
        <strong>Top tones:</strong> ${topTones}
      </div>
    </div>
    ` : ""}

    <p class="note">Story counts include all generations (anonymous + logged-in) logged since this feature was deployed.</p>
  </div>
</body>
</html>
`;

  const { error: sendError } = await resend.emails.send({
    from: "Sipur <onboarding@resend.dev>",
    to: "github@rreichmann.com",
    subject: `Sipur Daily Summary — ${dateLabel}`,
    html,
  });

  if (sendError) {
    console.error("Resend error:", sendError);
    return NextResponse.json({ error: "Failed to send email", detail: sendError }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    newUsers,
    todayCount,
    totalUsers,
    totalStories,
  });
}
