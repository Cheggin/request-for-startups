"use client";

import { useState, useEffect, useCallback } from "react";
import type { RealAgent, RealStartup } from "./data";

/**
 * Fetch real agent data from the API route.
 * Polls every 5 seconds for live updates.
 */
export function useAgents(pollInterval = 5000) {
  const [agents, setAgents] = useState<RealAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, pollInterval);
    return () => clearInterval(interval);
  }, [fetchAgents, pollInterval]);

  return { agents, loading, error, refetch: fetchAgents };
}

/**
 * Fetch real startup data from the API route.
 */
export function useStartups() {
  const [startups, setStartups] = useState<RealStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/startups");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStartups(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch startups");
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, []);

  return { startups, loading, error };
}
