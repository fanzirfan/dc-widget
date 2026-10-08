// Discord truncates dynamic string values past 100 chars; clamping here keeps
// the API call valid and stops long track titles from being cut mid-word by
// the client.
const MAX_VALUE_LENGTH = 100;

export function clamp(value, max = MAX_VALUE_LENGTH) {
    const text = String(value ?? "").trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trimEnd()}…`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Format the listening-time estimate for a stat cell.
 *
 * The value is prefixed with "≈" because it is derived from scrobble counts,
 * which fire at a track's halfway point, and is not true listened time.
 * Units switch at the boundaries where they read naturally: a young profile
 * shows minutes rather than a misleading "0.1 jam".
 */
export function formatListenTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "≈ 0 minutes";

    if (ms < HOUR) return `≈ ${Math.max(1, Math.round(ms / MINUTE))} minutes`;

    const hours = ms / HOUR;
    if (hours < 100) return `≈ ${hours.toFixed(1).replace(/\.0$/, "")} Hours`;
    return `≈ ${Math.round(hours).toLocaleString("en-US")} Hours`;
}

export function formatCount(value) {
    return Number(value ?? 0).toLocaleString("en-US");
}