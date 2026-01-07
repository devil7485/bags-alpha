import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TopWalletsPage() {
  const { data: wallets } = await supabase
    .from("wallet_stats")
    .select("*")
    .order("total_pnl", { ascending: false })
    .limit(50);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Top Wallets (Bags PnL)
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Wallet</th>
            <th className="p-2 text-right">Trades</th>
            <th className="p-2 text-right">Total PnL</th>
          </tr>
        </thead>
        <tbody>
          {wallets?.map((w) => (
            <tr key={w.wallet} className="border-b">
              <td className="p-2 font-mono">
                {w.wallet.slice(0, 6)}…{w.wallet.slice(-4)}
              </td>
              <td className="p-2 text-right">{w.trades_count}</td>
              <td className="p-2 text-right">
                ${Number(w.total_pnl).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
