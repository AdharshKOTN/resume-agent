"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "online" | "offline";

const BACKEND_URL = process.env.BACKEND_HTTP_URL || "http://localhost:5000";

export default function ServerStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/health`, {
          cache: "no-store",
        });
        if (response.ok) {
          setStatus("online");
        } else {
          setStatus("offline");
        }
      } catch (error) {
        setStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 70000000); // poll every 10s
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
