export type ClinicalAnalysis = {
  possibleConsiderations: string[];
  suggestedChecks: string[];
  redFlags: string[];
  lessLikely: string[];
  detectedSignals: string[];
  safetyNote: string;
};

type RuleSet = {
  name: string;
  matchers: RegExp[];
  considerations: string[];
  suggestedChecks: string[];
  redFlags: string[];
  lessLikely?: string[];
  detectedSignals: string[];
};

const RULESETS: RuleSet[] = [
  {
    name: "cardiac-chest-pain",
    matchers: [
      /\bchest pain\b/i,
      /\bexertional\b/i,
      /\bangina\b/i,
      /\bpressure\b/i,
      /\btightness\b/i,
    ],
    considerations: [
      "Acute coronary syndrome",
      "Stable angina",
      "Gastro-oesophageal reflux disease",
      "Musculoskeletal chest pain",
    ],
    suggestedChecks: [
      "12-lead ECG",
      "Cardiac enzymes if clinically indicated",
      "Focused cardiovascular exam and vital signs review",
      "Cardiovascular risk factor assessment",
    ],
    redFlags: [
      "Pain at rest or rapidly worsening symptoms",
      "Associated syncope, diaphoresis, or nausea",
      "Radiation to jaw or left arm",
      "Known cardiovascular disease or multiple risk factors",
    ],
    lessLikely: [
      "Traumatic injury if no injury history is described",
      "Infective cause if fever and cough are absent",
    ],
    detectedSignals: [
      "Chest pain language detected",
      "Potential exertional/cardiac pattern",
    ],
  },
  {
    name: "respiratory",
    matchers: [/\bcough\b/i, /\bshortness of breath\b/i, /\bdyspn(?:ea|ea)\b/i, /\bwheeze\b/i],
    considerations: [
      "Lower respiratory tract infection",
      "Asthma or reactive airway flare",
      "Pulmonary embolic process if risk factors fit",
      "Cardiac cause of breathlessness",
    ],
    suggestedChecks: [
      "Respiratory rate and oxygen saturation",
      "Chest examination",
      "Chest imaging if symptoms or exam warrant it",
      "Review PE and infection risk factors",
    ],
    redFlags: [
      "Hypoxia or increased work of breathing",
      "Hemoptysis or pleuritic chest pain",
      "New confusion or exhaustion",
      "Hypotension or tachycardia out of proportion",
    ],
    lessLikely: [
      "Upper-airway-only process if lower respiratory features dominate",
    ],
    detectedSignals: [
      "Respiratory symptom language detected",
    ],
  },
  {
    name: "infection-fever",
    matchers: [
      /\bfever\b/i,
      /\bpyrexia\b/i,
      /\bchills?\b/i,
      /\brigors?\b/i,
      /\bunwell\b/i,
    ],
    considerations: [
      "Viral or bacterial infective process",
      "Early sepsis or systemic infection if physiology is abnormal",
      "Localized infection requiring source review",
      "Non-infective inflammatory cause if infection is not supported",
    ],
    suggestedChecks: [
      "Full vital signs review including temperature and blood pressure",
      "Look for likely infective source on focused history and examination",
      "Assess hydration, perfusion, and mental state",
      "Basic bloods and cultures if clinically indicated",
    ],
    redFlags: [
      "Hypotension, tachycardia, or altered mental status",
      "Escalating fever with rigors or poor oral intake",
      "Concern for sepsis, meningism, or severe focal infection",
      "Immunocompromise or frailty with systemic symptoms",
    ],
    lessLikely: [
      "Minor self-limited illness if systemic compromise is described",
    ],
    detectedSignals: [
      "Systemic infective symptom language detected",
    ],
  },
  {
    name: "abdominal",
    matchers: [/\babdominal pain\b/i, /\bepigastric\b/i, /\bruq\b/i, /\bnausea\b/i, /\bvomit(?:ing)?\b/i],
    considerations: [
      "Biliary or upper gastrointestinal pathology",
      "Peptic ulcer or gastritis pattern",
      "Pancreatic or hepatobiliary process if severe",
      "Non-specific abdominal pain",
    ],
    suggestedChecks: [
      "Abdominal exam with localization and guarding review",
      "Hydration status and vital signs",
      "Basic laboratory panel if clinically indicated",
      "Targeted imaging depending on site and severity",
    ],
    redFlags: [
      "Peritonitic features or involuntary guarding",
      "Persistent vomiting or GI bleeding",
      "Fever with severe or worsening pain",
      "Hemodynamic instability",
    ],
    lessLikely: [
      "Benign self-limited cause if pain is escalating or localized",
    ],
    detectedSignals: [
      "Abdominal symptom language detected",
    ],
  },
  {
    name: "urinary",
    matchers: [
      /\bdysuria\b/i,
      /\bfrequency\b/i,
      /\burgency\b/i,
      /\bflank pain\b/i,
      /\bhaematuria\b|\bhematuria\b/i,
    ],
    considerations: [
      "Lower urinary tract infection",
      "Pyelonephritis or upper urinary infection",
      "Renal colic or obstructive uropathy",
      "Non-infective urinary tract irritation or bleeding source",
    ],
    suggestedChecks: [
      "Urinalysis and focused urinary symptom review",
      "Temperature, hydration status, and CVA tenderness assessment",
      "Pregnancy status where relevant",
      "Renal imaging if obstruction, severe pain, or recurrent stone history is suspected",
    ],
    redFlags: [
      "Fever with flank pain or vomiting",
      "Sepsis physiology or inability to tolerate fluids",
      "Visible hematuria with clots or retention symptoms",
      "Single kidney, pregnancy, or obstruction concern",
    ],
    lessLikely: [
      "Simple cystitis if systemic illness or severe flank pain is present",
    ],
    detectedSignals: [
      "Urinary tract symptom language detected",
    ],
  },
  {
    name: "back-pain",
    matchers: [
      /\bback pain\b/i,
      /\blower back\b/i,
      /\blumbar\b/i,
      /\bsciatica\b/i,
      /\bradicular\b/i,
    ],
    considerations: [
      "Mechanical back pain",
      "Radicular irritation or nerve root compression",
      "Spinal infection or malignancy if risk features fit",
      "Renal or referred pain source if history is atypical",
    ],
    suggestedChecks: [
      "Focused spine and neurologic examination",
      "Clarify trauma, cancer, steroid, and infection history",
      "Assess mobility, bladder or bowel symptoms, and saddle sensation",
      "Imaging only if red flags or persistent severe symptoms support it",
    ],
    redFlags: [
      "Urinary retention or bowel dysfunction",
      "Saddle anesthesia or progressive neurologic deficit",
      "Fever, immunosuppression, or malignancy history",
      "Major trauma or suspected fracture",
    ],
    lessLikely: [
      "Simple mechanical strain if cauda equina or infection features are present",
    ],
    detectedSignals: [
      "Back pain language detected",
    ],
  },
  {
    name: "neuro",
    matchers: [/\bheadache\b/i, /\bweakness\b/i, /\bnumb(?:ness)?\b/i, /\bseizure\b/i, /\bconfusion\b/i],
    considerations: [
      "Primary headache syndrome",
      "Neurologic event requiring exclusion",
      "Metabolic or toxic contributor",
      "Infective or inflammatory CNS process if other features fit",
    ],
    suggestedChecks: [
      "Focused neurologic examination",
      "Time course and deficit progression review",
      "Capillary glucose and other bedside basics as appropriate",
      "Urgent imaging or escalation if focal deficits are present",
    ],
    redFlags: [
      "Sudden severe onset",
      "Focal neurologic deficit",
      "Reduced consciousness or seizure activity",
      "Meningism, fever, or immunocompromise context",
    ],
    lessLikely: [
      "Benign headache pattern if neurologic deficits are described",
    ],
    detectedSignals: [
      "Neurologic symptom language detected",
    ],
  },
  {
    name: "dizziness-syncope",
    matchers: [
      /\bdizz(?:y|iness)\b/i,
      /\blight-?headed\b/i,
      /\bvertigo\b/i,
      /\bsyncope\b/i,
      /\bfaint(?:ed|ing)?\b/i,
    ],
    considerations: [
      "Benign vestibular or orthostatic cause",
      "Cardiovascular or arrhythmic event requiring exclusion",
      "Volume depletion or medication-related effect",
      "Neurologic cause if focal features or severe headache coexist",
    ],
    suggestedChecks: [
      "Orthostatic vitals and cardiovascular assessment",
      "Clarify triggers, prodrome, loss of consciousness, and recovery",
      "Medication and fluid balance review",
      "ECG and escalation if syncope or high-risk features are present",
    ],
    redFlags: [
      "Exertional syncope or no prodrome",
      "Chest pain, palpitations, or breathlessness around the event",
      "Neurologic deficit, severe headache, or persistent confusion",
      "Injury from collapse or recurrent episodes",
    ],
    lessLikely: [
      "Benign positional dizziness if cardiovascular or neurologic features dominate",
    ],
    detectedSignals: [
      "Dizziness or syncope language detected",
    ],
  },
];

const RISK_SIGNAL_RULES: Array<{ label: string; regex: RegExp; checks?: string[]; flags?: string[] }> = [
  {
    label: "Diabetes risk noted",
    regex: /\bdiabet(?:es|ic)\b|\bdm\b/i,
    checks: ["Review glycaemic control and vascular risk context"],
  },
  {
    label: "Hypertension risk noted",
    regex: /\bhypertension\b|\bhtn\b/i,
    checks: ["Review blood pressure history and cardiovascular risk burden"],
  },
  {
    label: "Smoking history noted",
    regex: /\bsmok(?:er|ing)\b/i,
    checks: ["Account for smoking as a cardiopulmonary risk amplifier"],
  },
  {
    label: "Fever reported",
    regex: /\bfever\b|\bpyrexia\b/i,
    flags: ["Infective cause moves higher if systemic features are present"],
  },
  {
    label: "Pregnancy context noted",
    regex: /\bpregnan(?:t|cy)\b|\bantepartum\b|\bpostpartum\b/i,
    checks: ["Adjust differential and medication safety to pregnancy context"],
    flags: ["Escalate earlier where pregnancy-related risk could change urgency"],
  },
  {
    label: "Syncope reported",
    regex: /\bsyncope\b|\bfaint(?:ed|ing)?\b/i,
    flags: ["Syncope is a high-priority escalation signal"],
  },
  {
    label: "Rest pain reported",
    regex: /\bat rest\b/i,
    flags: ["Symptoms occurring at rest raise urgency"],
  },
];

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function scoreRules(text: string): RuleSet[] {
  return RULESETS
    .map((rule) => ({
      rule,
      score: rule.matchers.reduce(
        (count, matcher) => count + (matcher.test(text) ? 1 : 0),
        0
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.rule);
}

export function analyzeClinicalNotes(input: {
  notes?: string;
  summary?: string;
}): ClinicalAnalysis {
  const combinedText = `${input.notes ?? ""}\n${input.summary ?? ""}`.trim();

  if (!combinedText) {
    return {
      possibleConsiderations: [
        "Insufficient information for rule-based analysis",
      ],
      suggestedChecks: [
        "Add symptom details, onset, negatives, and risk factors",
      ],
      redFlags: [
        "Escalate immediately if the patient is unstable or deteriorating",
      ],
      lessLikely: [
        "No lower-probability conditions inferred from the current text",
      ],
      detectedSignals: ["No clinical content detected"],
      safetyNote:
        "Rule-based support only. Output depends entirely on the clinician-authored text provided.",
    };
  }

  const matchedRules = scoreRules(combinedText);
  const seededRules = matchedRules.length > 0 ? matchedRules.slice(0, 2) : [];

  const possibleConsiderations = unique(
    seededRules.flatMap((rule) => rule.considerations)
  );
  const suggestedChecks = unique(
    seededRules.flatMap((rule) => rule.suggestedChecks)
  );
  const redFlags = unique(seededRules.flatMap((rule) => rule.redFlags));
  const lessLikely = unique(
    seededRules.flatMap((rule) => rule.lessLikely ?? [])
  );
  const detectedSignals = unique(
    seededRules.flatMap((rule) => rule.detectedSignals)
  );

  for (const signalRule of RISK_SIGNAL_RULES) {
    if (signalRule.regex.test(combinedText)) {
      detectedSignals.push(signalRule.label);
      if (signalRule.checks) {
        suggestedChecks.push(...signalRule.checks);
      }
      if (signalRule.flags) {
        redFlags.push(...signalRule.flags);
      }
    }
  }

  if (possibleConsiderations.length === 0) {
    possibleConsiderations.push(
      "Broad undifferentiated presentation based on limited rule matches",
      "Common benign causes should be balanced against time-critical pathology",
      "Prototype rule coverage is strongest for chest pain, respiratory, abdominal, neurologic, infection, urinary, back pain, and dizziness presentations"
    );
  }

  if (suggestedChecks.length === 0) {
    suggestedChecks.push(
      "Clarify onset, severity, timeline, and associated symptoms",
      "Document key negatives and risk factors"
    );
  }

  if (redFlags.length === 0) {
    redFlags.push(
      "Hemodynamic instability",
      "Rapid deterioration or severe uncontrolled symptoms"
    );
  }

  if (lessLikely.length === 0) {
    lessLikely.push(
      "Conditions without supporting features in the current notes"
    );
  }

  return {
    possibleConsiderations: unique(possibleConsiderations).slice(0, 5),
    suggestedChecks: unique(suggestedChecks).slice(0, 6),
    redFlags: unique(redFlags).slice(0, 6),
    lessLikely: unique(lessLikely).slice(0, 4),
    detectedSignals: unique(detectedSignals).slice(0, 6),
    safetyNote:
      "Rule-based support only. This prototype is strongest for a limited set of presentation patterns and does not diagnose, prescribe, or replace clinical judgment.",
  };
}
