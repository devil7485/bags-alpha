import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;

    const [walletStats, alphaStats, devStats] = await Promise.all([
      supabase
        .from("wallet_stats")
        .select("*")
        .eq("wallet", address)
        .single(),
      supabase
        .from("alpha_stats")
        .select("*")
        .eq("wallet", address)
        .single(),
      supabase
        .from("dev_stats")
        .select("*")
        .eq("creator_wallet", address)
        .single(),
    ]);

    return Response.json({
      wallet: address,
      wallet_stats: walletStats.data || null,
      alpha_stats: alphaStats.data || null,
      dev_stats: devStats.data || null,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
