"use client";

import { useState } from "react";

export default function WalletSearchPage() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState<any>(null);

  async function search() {
    const res = await fetch(`/api/wallet/${address}`);
    const json = await res.json();
    setData(json);
  }

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Wallet Search</h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Paste wallet address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button
        onClick={search}
        className="bg-black text-white px-4 py-2 mb-4"
      >
        Search
      </button>

      {data && (
        <pre className="bg-gray-100 p-3 text-sm overflow-auto">
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
