// API request and response payload shapes
// These are used by both frontend (typed fetch) and backend (Zod validation)

export interface ApiError {
  error: string;
  status?: number;
}

// ---------- Projects ----------
export interface CreateProjectPayload {
  name: string;
  domain?: string;
  organizationId?: string;
  autocaptureEnabled?: boolean;
}

export interface UpdateProjectPayload {
  name?: string;
  domain?: string;
  shareId?: string;
  replayEnabled?: boolean;
  replayConfig?: Record<string, unknown>;
  autocaptureEnabled?: boolean;
}

// ---------- Organizations ----------
export interface CreateOrganizationPayload {
  name: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  logoUrl?: string;
  accessCode?: string | null;
}

// ---------- Reports ----------
export interface CreateReportPayload {
  type: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  projectId: string;
}

export interface UpdateReportPayload {
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// ---------- Event ingestion ----------
export interface SendEventPayload {
  type: string;
  payload: Record<string, unknown>;
}

// ---------- Members / Users ----------
export interface UpdateMemberPayload {
  role: string;
}

// ---------- Generic list response ----------
export interface ListResponse<T> {
  data: T[];
  count: number | string;
  page: number;
  pageSize: number;
}
