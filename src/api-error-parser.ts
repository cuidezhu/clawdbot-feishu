// --- Permission error extraction ---
// Extract permission grant URL from Feishu API error response.
export type PermissionError = {
  code: number;
  message: string;
  grantUrl?: string;
};

export function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');
}

export function extractFirstUrl(raw: string): string | undefined {
  if (!raw) return undefined;
  const decoded = decodeHtmlEntities(raw);
  const urlMatch = decoded.match(/https?:\/\/[^\s"'<>]+/i);
  return urlMatch?.[0];
}

export function extractPermissionError(err: unknown): PermissionError | null {
  if (!err || typeof err !== "object") return null;

  // Axios error structure: err.response.data contains the Feishu error
  const axiosErr = err as { response?: { data?: unknown } };
  const data = axiosErr.response?.data;
  if (!data || typeof data !== "object") return null;

  const feishuErr = data as {
    code?: number;
    msg?: string;
    error?: { permission_violations?: Array<{ uri?: string }> };
  };

  // Feishu permission error code: 99991672
  if (feishuErr.code !== 99991672) return null;

  const msg = feishuErr.msg ?? "";
  const grantUrlFromMsg = extractFirstUrl(msg);
  const grantUrlFromViolations = feishuErr.error?.permission_violations
    ?.map((item) => extractFirstUrl(item.uri ?? ""))
    .find((url): url is string => Boolean(url));
  const grantUrl = grantUrlFromMsg ?? grantUrlFromViolations;

  return {
    code: feishuErr.code,
    message: msg,
    grantUrl,
  };
}
