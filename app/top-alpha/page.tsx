import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TopAlphaPage() {
  const { data: alpha } = await supabase
    .from("alpha_stats")
    .select("*")
    .order("best_roi", { ascending: false })
    .limit(50);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Top Alpha Wallets
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Wallet</th>
            <th className="p-2 text-right">Best ROI</th>
            <th className="p-2 text-right">2x+ Hits</th>
          </tr>
        </thead>
        <tbody>
          {alpha?.map((a) => (
            <tr key={a.wallet} className="border-b">
              <td className="p-2 font-mono">
                {a.wallet.slice(0, 6)}…{a.wallet.slice(-4)}
              </td>
              <td className="p-2 text-right">
                {a.best_roi.toFixed(2)}x
              </td>
              <td className="p-2 text-right">
                {a.big_roi_hits}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
