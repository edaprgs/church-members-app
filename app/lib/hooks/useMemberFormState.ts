"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getAge, getAgeGroup, getYearsMarried, getZone, titleCase } from "@/app/lib/utils";
import { CAPITALIZE_FIELDS } from "@/app/lib/constants";
import type { Child, FormState } from "@/app/lib/types";

/**
 * Auto-computes age/age_group, years_married, and zone whenever their
 * source fields change. Shared by the admin new/edit member forms, which
 * had this effect logic duplicated verbatim.
 */
export function useMemberAutoCompute(
  form: FormState,
  setForm: Dispatch<SetStateAction<FormState>>
) {
  useEffect(() => {
    if (!form.birthdate) { setForm(p => ({ ...p, age: "", age_group: "" })); return; }
    const age = getAge(form.birthdate);
    setForm(p => ({ ...p, age, age_group: getAgeGroup(age) }));
  }, [form.birthdate, setForm]);

  useEffect(() => {
    if (!form.wedding_date) { setForm(p => ({ ...p, years_married: "" })); return; }
    setForm(p => ({ ...p, years_married: getYearsMarried(form.wedding_date!) }));
  }, [form.wedding_date, setForm]);

  useEffect(() => {
    if (!form.home_address) { setForm(p => ({ ...p, zone: "" })); return; }
    setForm(p => ({ ...p, zone: getZone(form.home_address!) }));
  }, [form.home_address, setForm]);
}

/**
 * Field-change, children, and tag-toggle handlers shared by the admin
 * new/edit member forms.
 */
export function useMemberFormHandlers(
  setForm: Dispatch<SetStateAction<FormState>>,
  errors: Record<string, string>,
  setErrors: Dispatch<SetStateAction<Record<string, string>>>
) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "mobile_num") {
      setForm(p => ({ ...p, mobile_num: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    const formatted = CAPITALIZE_FIELDS.includes(name) ? titleCase(value) : value;
    setForm(p => ({ ...p, [name]: formatted }));
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const addChild = () => setForm(p => ({ ...p, children: [...p.children, { name: "", birthdate: "" }] }));
  const removeChild = (i: number) => setForm(p => ({ ...p, children: p.children.filter((_, idx) => idx !== i) }));
  const updateChild = (i: number, field: keyof Child, value: string) =>
    setForm(p => {
      const updated = [...p.children];
      updated[i] = { ...updated[i], [field]: field === "name" ? titleCase(value) : value };
      return { ...p, children: updated };
    });

  const toggleSkills = (v: string) =>
    setForm(p => ({
      ...p,
      interest_skills: p.interest_skills.includes(v)
        ? p.interest_skills.filter(x => x !== v)
        : [...p.interest_skills, v],
    }));

  const toggleChurch = (v: string) =>
    setForm(p => ({
      ...p,
      church_involvement: p.church_involvement.includes(v)
        ? p.church_involvement.filter(x => x !== v)
        : [...p.church_involvement, v],
    }));

  return { handleChange, addChild, removeChild, updateChild, toggleSkills, toggleChurch };
}
