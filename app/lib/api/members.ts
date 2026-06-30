// app/lib/api/members.ts

import { supabase } from "../supabase";
import { useState, useEffect } from "react";
import type { Member, FormState } from "../types";

/**
 * Fetches ALL members using batched pagination to bypass Supabase's 1000-row limit.
 */
export async function fetchAllMembers(): Promise<Member[]> {
  const BATCH = 1000;
  let all: Member[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .range(from, from + BATCH - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    all = [...all, ...data];
    if (data.length < BATCH) break;
    from += BATCH;
  }

  return all;
}

/**
 * Fetches ALL members ordered by last name.
 */
export async function fetchAllMembersSorted(): Promise<Member[]> {
  const BATCH = 1000;
  let all: Member[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("last_name", { ascending: true })
      .range(from, from + BATCH - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    all = [...all, ...data];
    if (data.length < BATCH) break;
    from += BATCH;
  }

  return all;
}

/**
 * Fetches a single member by ID.
 */
export async function fetchMemberById(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (error) { console.error(error); return null; }
  return data as Member;
}

/**
 * Inserts a new member record.
 */
export async function insertMember(
  payload: Partial<FormState>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("members").insert([payload]);
  return { error: error?.message ?? null };
}

/**
 * Updates an existing member record.
 */
export async function updateMember(
  id: string,
  payload: Partial<FormState>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("members")
    .update({ ...payload, updated_at: new Date() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

/**
 * Deletes a member by ID.
 */
export async function deleteMember(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("members").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/**
 * Gets just the total member count (cheap HEAD query).
 */
export async function fetchMemberCount(): Promise<number> {
  const { count } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}


export function useSettings() {
  const [settings, setSettings] = useState<{
    church_name: string;
    church_address: string;
    church_email: string;
    fellowships: string[];
    ministers: string[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error(error);
        setSettings(null);
      } else {
        setSettings(data);
      }

      setLoading(false);
    }

    load();
  }, []);

  return { settings, loading };
}