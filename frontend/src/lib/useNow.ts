import { useEffect, useState } from "react";

/** Current time, re-rendered periodically so "updated 12s ago" labels stay honest. */
export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
