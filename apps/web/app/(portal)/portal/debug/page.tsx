"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PortalDebugPage() {
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? "");
      setLoading(false);
    });
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading session...</div>;
  }

  if (!token) {
    return (
      <div style={{ padding: 24 }}>
        <p>No active session.</p>
        <a href="/login" style={{ color: "#2B7BC4" }}>
          Go to login
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Portal Debug — JWT Access Token
      </h1>
      <p style={{ color: "#666", marginBottom: 12 }}>
        Copy the token below and paste it into Swagger&apos;s{" "}
        <code>Authorization: Bearer &lt;token&gt;</code> header.
      </p>
      <textarea
        readOnly
        value={token}
        style={{
          width: "100%",
          minHeight: 160,
          fontFamily: "monospace",
          fontSize: 12,
          padding: 12,
          border: "1px solid #ccc",
          borderRadius: 6,
          resize: "vertical",
        }}
      />
      <button
        onClick={handleSignOut}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          background: "#dc2626",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
