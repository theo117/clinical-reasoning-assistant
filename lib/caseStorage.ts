import type { ClinicalAnalysis } from "@/lib/clinicalEngine";

export type SavedClinicalCase = {
  id: string;
  label: string;
  notes: string;
  summary: string;
  followUp: string;
  referralSpecialty: string;
  createdAt: string;
  updatedAt: string;
  analysis?: ClinicalAnalysis;
};

function storageKey(userId: string): string {
  return `clinical-reasoning-cases:${userId}`;
}

export function loadSavedCases(userId: string): SavedClinicalCase[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedClinicalCase[]) : [];
  } catch {
    return [];
  }
}

export function saveClinicalCase(userId: string, clinicalCase: SavedClinicalCase) {
  const existing = loadSavedCases(userId);
  const next = [
    clinicalCase,
    ...existing.filter((item) => item.id !== clinicalCase.id),
  ].slice(0, 30);
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
}

export function deleteClinicalCase(userId: string, caseId: string) {
  const next = loadSavedCases(userId).filter((item) => item.id !== caseId);
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
}
