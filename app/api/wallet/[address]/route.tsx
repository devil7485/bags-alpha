import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function GET(
  _: Request,
  { params }: { params: { address: string } }
) {
  const wallet = params.address;

  try {
    const [walletStats, alphaStats, devStats] = await Promise.all([
      supabase.from("wallet_stats").select("*").eq("wallet", wallet).single(),
      supabase.from("alpha_stats").select("*").eq("wallet", wallet).single(),
      supabase
        .from("dev_stats")
        .select("*")
        .eq("creator_wallet", wallet)
        .single(),
    ]);

    return Response.json({
      wallet,
      wallet_stats: walletStats.data || null,
      alpha_stats: alphaStats.data || null,
      dev_stats: devStats.data || null,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
