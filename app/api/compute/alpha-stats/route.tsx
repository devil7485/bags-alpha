import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function GET() {
  try {
    console.log("---- ALPHA STATS COMPUTE START ----");

    const { data: trades, error } = await supabase
      .from("trades")
      .select("wallet, token_mint, side, price, amount");

    if (error) {
      console.error("FETCH TRADES ERROR =", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // wallet_token -> avg buy price & size
    const positionMap: Record<
      string,
      { buyValue: number; buyAmount: number }
    > = {};

    // wallet -> alpha stats
    const alphaMap: Record<
      string,
      { bestRoi: number; bigHits: number }
    > = {};

    for (const t of trades || []) {
      const key = `${t.wallet}_${t.token_mint}`;

      if (!alphaMap[t.wallet]) {
        alphaMap[t.wallet] = { bestRoi: 0, bigHits: 0 };
      }

      if (t.side === "buy") {
        if (!positionMap[key]) {
          positionMap[key] = { buyValue: 0, buyAmount: 0 };
        }
        positionMap[key].buyValue += Number(t.price) * Number(t.amount);
        positionMap[key].buyAmount += Number(t.amount);
      }

      if (t.side === "sell" && positionMap[key]?.buyAmount > 0) {
        const avgBuy =
          positionMap[key].buyValue / positionMap[key].buyAmount;

        const roi = Number(t.price) / avgBuy;

        if (roi > alphaMap[t.wallet].bestRoi) {
          alphaMap[t.wallet].bestRoi = roi;
        }

        if (roi >= 2.0) {
          alphaMap[t.wallet].bigHits += 1;
        }
      }
    }

    let upserted = 0;

    for (const wallet of Object.keys(alphaMap)) {
      const a = alphaMap[wallet];

      if (a.bestRoi <= 1) continue; // ignore non-alpha wallets

      const { error } = await supabase.from("alpha_stats").upsert({
        wallet,
        best_roi: a.bestRoi,
        big_roi_hits: a.bigHits,
        last_updated: new Date(),
      });

      if (!error) upserted++;
    }

    return Response.json({
      status: "ok",
      wallets_processed: Object.keys(alphaMap).length,
      upserted,
    });
  } catch (e: any) {
    console.error("ALPHA STATS ERROR =", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
