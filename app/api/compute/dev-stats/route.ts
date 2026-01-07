import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("creator_wallet, migrated");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const devMap: Record<string, { total: number; migrated: number }> = {};

    for (const t of tokens || []) {
      if (!t.creator_wallet || t.creator_wallet === "unknown") continue;

      if (!devMap[t.creator_wallet]) {
        devMap[t.creator_wallet] = { total: 0, migrated: 0 };
      }

      devMap[t.creator_wallet].total++;
      if (t.migrated) devMap[t.creator_wallet].migrated++;
    }

    for (const wallet of Object.keys(devMap)) {
      const d = devMap[wallet];
      const rate = d.total > 0 ? d.migrated / d.total : 0;

      await supabase.from("dev_stats").upsert({
        creator_wallet: wallet,
        total_launched: d.total,
        total_migrated: d.migrated,
        migration_rate: rate,
        last_updated: new Date(),
      });
    }

    return Response.json({ status: "ok" });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
