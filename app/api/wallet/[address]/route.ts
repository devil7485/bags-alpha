export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  context: any
) {
  const supabase = getSupabaseAdmin();

  try {
    const address = context.params?.address;

    if (!address) {
      return Response.json({ error: "Missing address" }, { status: 400 });
    }

    const [walletStats, alphaStats, devStats] = await Promise.all([
      supabase
        .from("wallet_stats")
        .select("*")
        .eq("wallet", address)
        .maybeSingle(),
      supabase
        .from("alpha_stats")
        .select("*")
        .eq("wallet", address)
        .maybeSingle(),
      supabase
        .from("dev_stats")
        .select("*")
        .eq("creator_wallet", address)
        .maybeSingle(),
    ]);

    return Response.json({
      wallet: address,
      wallet_stats: walletStats.data ?? null,
      alpha_stats: alphaStats.data ?? null,
      dev_stats: devStats.data ?? null,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
