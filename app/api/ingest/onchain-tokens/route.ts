import { supabaseAdmin as supabase } from "@/lib/supabase-admin";


const RPC_URL = process.env.SOLANA_RPC_URL!;

// Raydium AMM v4 (common Bags migration destination)
const RAYDIUM_AMM = "RVKd61ztZW9GdWc2r9nqCuWHa3gwPrmT2y1k4EYBLET";

export async function GET() {
  try {
    console.log("---- ONCHAIN DISCOVERY START ----");

    const sigRes = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [RAYDIUM_AMM, { limit: 25 }],
      }),
    });

    const sigJson = await sigRes.json();
    const signatures = sigJson.result || [];

    let inserted = 0;

    for (const s of signatures) {
      const txRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [s.signature, { encoding: "jsonParsed" }],
        }),
      });

      const txJson = await txRes.json();
      const keys =
        txJson?.result?.transaction?.message?.accountKeys || [];

      for (const k of keys) {
        if (!k.pubkey) continue;
        if (k.pubkey.length < 32 || k.pubkey.length > 44) continue;

        const { error } = await supabase.from("tokens").upsert({
          token_mint: k.pubkey,
          creator_wallet: "unknown",
          launch_time: new Date(),
        });

        if (!error) inserted++;
      }
    }

    return Response.json({
      status: "ok",
      candidates_inserted: inserted,
    });
  } catch (e: any) {
    console.error("ONCHAIN ERROR =", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
