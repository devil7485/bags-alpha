import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    console.log("---- BAGS ENRICH START ----");

    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("token_mint")
      .eq("creator_wallet", "unknown")
      .limit(10);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    let enriched = 0;

    for (const t of tokens || []) {
      const res = await fetch(
        "https://public-api-v2.bags.fm/api/v1/token-launch/creator/v3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.BAGS_API_KEY!,
          },
          body: JSON.stringify({
            tokenMint: t.token_mint,
          }),
        }
      );

      const json = await res.json();

      if (json?.success && json?.data?.creator) {
        await supabase
          .from("tokens")
          .update({
            creator_wallet: json.data.creator,
            migrated: true,
            migration_time: new Date(),
          })
          .eq("token_mint", t.token_mint);

        enriched++;
      }
    }

    return Response.json({
      status: "ok",
      enriched,
    });
  } catch (e: any) {
    console.error("BAGS ENRICH ERROR =", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
