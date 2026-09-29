"use client";

import { useCallback, useEffect, useState } from "react";
import { emptySettings, type AppSettings } from "./types";

const STORAGE_KEY = "ict-pm-suite:settings";

function load(): AppSettings {
  if (typeof window === "undefined") return emptySettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySettings;
    const parsed = JSON.parse(raw);
    return {
      jira: { ...emptySettings.jira, ...parsed.jira },
      confluence: { ...emptySettings.confluence, ...parsed.confluence },
    };
  } catch {
    return emptySettings;
  }
}

/** Credentials never leave this browser except inside a request you trigger
 * (a Jira sync call or a Confluence publish call), sent straight to the
 * server route that proxies to your own Jira/Confluence instance. */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(load());
    setLoaded(true);
  }, []);

  const update = useCallback((next: AppSettings) => {
    setSettings(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { settings, update, loaded };
}
