import { supabaseAdmin as supabase } from "@/lib/supabase-admin";


export async function GET() {
  try {
    console.log("---- DEV STATS COMPUTE START ----");

    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("creator_wallet, migrated");

    if (error) {
      console.error("FETCH TOKENS ERROR =", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const devMap: Record<
      string,
      { total: number; migrated: number }
    > = {};

    for (const t of tokens || []) {
      if (!t.creator_wallet || t.creator_wallet === "unknown") continue;

      if (!devMap[t.creator_wallet]) {
        devMap[t.creator_wallet] = { total: 0, migrated: 0 };
      }

      devMap[t.creator_wallet].total += 1;
      if (t.migrated) devMap[t.creator_wallet].migrated += 1;
    }

    let upserted = 0;

    for (const wallet of Object.keys(devMap)) {
      const total = devMap[wallet].total;
      const migrated = devMap[wallet].migrated;
      const rate = total > 0 ? migrated / total : 0;

      const { error } = await supabase.from("dev_stats").upsert({
        creator_wallet: wallet,
        total_launched: total,
        total_migrated: migrated,
        migration_rate: rate,
        last_updated: new Date(),
      });

      if (!error) upserted++;
    }

    return Response.json({
      status: "ok",
      devs_processed: Object.keys(devMap).length,
      upserted,
    });
  } catch (e: any) {
    console.error("DEV STATS ERROR =", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
