import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TopDevsPage() {
  const { data: devs, error } = await supabase
    .from("dev_stats")
    .select("*")
    .order("total_migrated", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">Error loading dev stats</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Top Devs (Bags Migrated Tokens)
      </h1>

      <table className="w-full border border-gray-300">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">Dev Wallet</th>
            <th className="p-2 text-right">Launched</th>
            <th className="p-2 text-right">Migrated</th>
            <th className="p-2 text-right">Migration %</th>
          </tr>
        </thead>
        <tbody>
          {devs?.map((d) => (
            <tr key={d.creator_wallet} className="border-b">
              <td className="p-2 font-mono">
                {d.creator_wallet.slice(0, 6)}…
                {d.creator_wallet.slice(-4)}
              </td>
              <td className="p-2 text-right">{d.total_launched}</td>
              <td className="p-2 text-right">{d.total_migrated}</td>
              <td className="p-2 text-right">
                {(d.migration_rate * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
