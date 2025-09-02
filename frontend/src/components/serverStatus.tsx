"use client";

import { useEffect, useState } from "react";
import { HTTP_BASE } from "@/lib/env";

type Status = "checking" | "online" | "offline";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL;

// if (!BACKEND_URL) {
//   throw new Error(
//     "❌ Environment variable NEXT_PUBLIC_BACKEND_HTTP_URL is not set. " +
//     "Make sure it's provided at build time."
//   );
// }

export default function ServerStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${HTTP_BASE}/api/health`, {
          cache: "no-store",
        });
        if (response.ok) {
          setStatus("online");
        } else {
          setStatus("offline");
        }
      } catch (error) {
        setStatus("offline");
        console.log(error)
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 100000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm font-mono px-2 py-1 rounded-md">
      {status === "checking" && <span>🟡 Checking server...</span>}
      {status === "online" && <span className="text-green-600">🟢 Server online</span>}
      {status === "offline" && <span className="text-red-600">🔴 Server offline</span>}
    </div>
  );
}
