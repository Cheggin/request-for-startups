"use client";

import { useState, useEffect, useCallback } from "react";
import type { RealAgent, RealLoop, RealStartup, GitHubIssue } from "./data";

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

/**
 * Fetch real GitHub issue data from the API route.
 * Polls every 30 seconds — issues change less frequently than agents.
 */
export function useIssues(pollInterval = 30000) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIssues(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, pollInterval);
    return () => clearInterval(interval);
  }, [fetchIssues, pollInterval]);

  return { issues, loading, error, refetch: fetchIssues };
}

/**
 * Fetch loop definitions from the API route.
 * Polls every 5 seconds for live status updates.
 */
export function useLoops(pollInterval = 5000) {
  const [loops, setLoops] = useState<RealLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoops = useCallback(async () => {
    try {
      const res = await fetch("/api/loops");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLoops(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch loops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoops();
    const interval = setInterval(fetchLoops, pollInterval);
    return () => clearInterval(interval);
  }, [fetchLoops, pollInterval]);

  return { loops, loading, error, refetch: fetchLoops };
}
