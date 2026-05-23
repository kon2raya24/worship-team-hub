"use client";

import { useState } from "react";
import { getSignedUrl } from "@/app/(app)/files/actions";

export function FileLink({
  storagePath,
  label,
}: {
  storagePath: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const url = await getSignedUrl(storagePath);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      className="text-left underline hover:text-blue-600 disabled:opacity-50"
    >
      {loading ? "Opening…" : label}
    </button>
  );
}
