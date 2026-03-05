const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface ValidationFlag {
  fields: string[];
  type: "HARD_ERROR" | "SOFT_WARNING" | "PLAUSIBLE_OUTLIER";
  description_ar: string;
  description_en: string;
  suggested_correction?: {
    field: string;
    value: unknown;
    confidence: number;
  };
}

export interface ValidationResponse {
  survey_id: string;
  trust_score: number;
  severity: "GREEN" | "YELLOW" | "RED";
  flags: ValidationFlag[];
  classification: string | null;
  processing_time_ms: number;
}

export interface DashboardMetrics {
  total_submissions: number;
  severity_distribution: { GREEN: number; YELLOW: number; RED: number };
  average_trust_score: number;
  trust_histogram: Array<{ bucket: string; count: number }>;
  daily_trend: Array<{
    day: string;
    total: number;
    red: number;
    yellow: number;
    green: number;
  }>;
  field_error_frequency: Array<{ field: string; count: number }>;
  recent_submissions: Array<{
    id: string;
    survey_id: string;
    respondent_id: string;
    trust_score: number;
    severity: string;
    classification: string | null;
    processing_time_ms: number;
    created_at: string;
  }>;
}

export async function validateSurvey(payload: {
  survey_id: string;
  respondent_id: string;
  fields: Record<string, unknown>;
}): Promise<ValidationResponse> {
  const res = await fetch(`${API_BASE}/api/v1/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Validation failed: ${res.status}`);
  return res.json();
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/api/v1/dashboard/metrics`);
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  return res.json();
}

const _wsBase = API_BASE
  || `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
export const WS_URL = _wsBase + "/ws/validate";
