export type PhiMatch = {
  label: string;
  value: string;
};

const RULES: Array<{ label: string; regex: RegExp }> = [
  { label: "Email address", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  {
    label: "US phone number",
    regex: /\b(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/,
  },
  { label: "US SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/ },
  { label: "MRN-like ID", regex: /\b(?:mrn|medical record|patient id)\s*[:#-]?\s*[a-z0-9-]{4,}\b/i },
  {
    label: "DOB-like date",
    regex: /\b(?:dob|date of birth)\s*[:#-]?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{2,4})\b/i,
  },
  {
    label: "Address keyword",
    regex: /\b\d{1,5}\s+[A-Z0-9.\s]{2,}\s(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)\b/i,
  },
];

export function detectPhi(text: string): PhiMatch[] {
  if (!text.trim()) {
    return [];
  }

  const matches: PhiMatch[] = [];

  for (const rule of RULES) {
    const hit = text.match(rule.regex);
    if (hit?.[0]) {
      matches.push({ label: rule.label, value: hit[0].slice(0, 80) });
    }
  }

  return matches;
}

export function isSafeForNonHipaa(text: string): boolean {
  return detectPhi(text).length === 0;
}
