import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    const { data: trades } = await supabase
      .from("trades")
      .select("wallet, token_mint, side, price, amount");

    const positionMap: Record<string, { buyValue: number; buyAmount: number }> =
      {};
    const alphaMap: Record<string, { bestRoi: number; bigHits: number }> = {};

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

      if (t.side === "sell" && positionMap[key]?.buyAmount) {
        const avgBuy =
          positionMap[key].buyValue / positionMap[key].buyAmount;
        const roi = Number(t.price) / avgBuy;

        if (roi > alphaMap[t.wallet].bestRoi)
          alphaMap[t.wallet].bestRoi = roi;

        if (roi >= 2) alphaMap[t.wallet].bigHits++;
      }
    }

    for (const wallet of Object.keys(alphaMap)) {
      const a = alphaMap[wallet];
      if (a.bestRoi <= 1) continue;

      await supabase.from("alpha_stats").upsert({
        wallet,
        best_roi: a.bestRoi,
        big_roi_hits: a.bigHits,
        last_updated: new Date(),
      });
    }

    return Response.json({ status: "ok" });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
