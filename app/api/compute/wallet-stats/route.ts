import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    console.log("---- WALLET STATS COMPUTE START ----");

    const { data: trades, error } = await supabase
      .from("trades")
      .select("wallet, side, price, amount, token_mint");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const walletMap: Record<string, { pnl: number; trades: number }> = {};
    const positionMap: Record<
      string,
      { buyValue: number; buyAmount: number }
    > = {};

    for (const t of trades || []) {
      const key = `${t.wallet}_${t.token_mint}`;

      if (!walletMap[t.wallet]) {
        walletMap[t.wallet] = { pnl: 0, trades: 0 };
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

        const pnl =
          (Number(t.price) - avgBuy) * Number(t.amount);

        walletMap[t.wallet].pnl += pnl;
        walletMap[t.wallet].trades += 1;
      }
    }

    for (const wallet of Object.keys(walletMap)) {
      const w = walletMap[wallet];
      if (w.trades < 3) continue;

      await supabase.from("wallet_stats").upsert({
        wallet,
        total_pnl: w.pnl,
        trades_count: w.trades,
        last_updated: new Date(),
      });
    }

    return Response.json({ status: "ok" });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
