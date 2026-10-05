import "server-only";
import { jsonStore } from "./json-store";
import { supabaseStore } from "./supabase-store";
import type { Store } from "./types";

/** Supabase when its env vars are set, otherwise the local demo store. */
export const store: Store =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseStore : jsonStore;
