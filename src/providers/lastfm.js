import { sleep } from "../lib/throttle.js";
import { readCache, writeCache } from "../lib/cache.js";

const API_ROOT = "https://ws.audioscrobbler.com/2.0/";

// Last.fm blocks requests without an identifiable User-Agent, and may throttle
// "several calls per second" per the Intro to their API docs. Both are handled
// by sending a real UA and pacing the burst of track.getInfo calls below.
const USER_AGENT = "dc-widget/1.0 ( https://github.com/IRFAN/ )";
const TRACK_INFO_GAP_MS = 260;

class LastfmError extends Error {
    constructor(method, code, message) {
        super(`last.fm ${method} failed (error ${code}): ${message}`);
        this.name = "LastfmError";
        this.code = code;
    }
}

async function call(apiKey, method, params = {}) {
    const url = new URL(API_ROOT);
    url.searchParams.set("method", method);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("format", "json");
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }

    const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    const body = await res.json().catch(() => ({}));
    if (typeof body.error === "number") {
        throw new LastfmError(method, body.error, body.message ?? "unknown error");
    }
    return body;
}

/** Best-effort URL pick: last.fm orders image sizes small→extralarge, last entry wins. */
function pickImage(images) {
    if (!Array.isArray(images)) return "";
    const sized = images.filter((img) => img?.["#text"]);
    return sized.at(-1)?.["#text"] ?? "";
}

function toInt(value) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Cache key for a track. The NUL separator keeps "ab" + "c" from colliding
 * with "a" + "bc".
 */
function cacheKeyFor(track) {
    return `${track.artist.name}\u0000${track.name}`;
}

/**
 * Resolve a track's duration in milliseconds.
 *
 * getTopTracks reports duration in *seconds* and often as "0" for tracks that
 * came from YouTube Music scrobbles, while track.getInfo reports *milliseconds*.
 * Reading seconds from getTopTracks would undercount by 1000x, so every duration
 * used for the listening-time estimate is sourced here. Track lengths never
 * change, so results are cached to disk forever.
 */
async function fetchDurationMs(apiKey, track, cache) {
    const key = cacheKeyFor(track);
    const cached = cache[key];
    if (cached !== undefined) return cached;


    let durationMs = 0;
    try {
        const body = await call(apiKey, "track.getInfo", {
            artist: track.artist.name,
            track: track.name,
        });
        durationMs = toInt(body?.track?.duration);
    } catch {
        // A missing duration must not sink the whole sync; fall back to a
        // neutral average so one unresolvable track cannot distort the rest.
        durationMs = 0;
    }

    cache[key] = durationMs;
    return durationMs;
}

async function averageTrackDurationMs(apiKey, tracks) {
    if (tracks.length === 0) return 0;

    const cache = await readCache("durations.json");
    const durations = [];
    let fetchedAny = false;

    for (const track of tracks) {
        const cached = cache[cacheKeyFor(track)];

        if (cached !== undefined) {
            durations.push(cached);
            continue;
        }

        durations.push(await fetchDurationMs(apiKey, track, cache));
        fetchedAny = true;
        // Pace only requests that reach the network. Throttling cache hits would
        // add ~260ms per track to every later run for no benefit.
        await sleep(TRACK_INFO_GAP_MS);
    }

    if (fetchedAny) {
        await writeCache("durations.json", cache);
    }

    // Tracks with no resolvable duration are dropped rather than counted as
    // zero-length, so one unknown track cannot drag the average down.
    const known = durations.filter((ms) => ms > 0);
    if (known.length === 0) return 0;
    return known.reduce((sum, ms) => sum + ms, 0) / known.length;
}

/**
 * Collect every field the widget renders.
 *
 * `playcount` from getInfo is the lifetime scrobble count. Last.fm has no
 * listened-time endpoint, so the total is estimated as lifetime scrobbles times
 * the average length of the user's top tracks; the UI labels it with "≈"
 * because scrobbles fire at the halfway point of a track.
 */
export async function fetchStats({ apiKey, user, period = "overall", topTracks = 50 }) {
    const infoBody = await call(apiKey, "user.getInfo", { user });
    const tracksBody = await call(apiKey, "user.getTopTracks", {
        user,
        period,
        limit: topTracks,
    });
    const albumsBody = await call(apiKey, "user.getTopAlbums", { user, period, limit: 1 });
    const artistsBody = await call(apiKey, "user.getTopArtists", { user, period, limit: 1 });

    const tracks = tracksBody?.toptracks?.track ?? [];
    const albums = albumsBody?.topalbums?.album ?? [];
    const artists = artistsBody?.topartists?.artist ?? [];

    const lifetimeScrobbles = toInt(infoBody?.user?.playcount);
    const averageDurationMs = await averageTrackDurationMs(apiKey, tracks);
    const totalListenMs = averageDurationMs * lifetimeScrobbles;

    const topTrack = tracks[0] ?? null;
    const topArtist = artists[0]?.name ?? "";
    const topAlbum = albums[0]?.name ?? "";

    return {
        displayName: infoBody?.user?.name ?? user,
        scrobbleCount: lifetimeScrobbles,
        totalListenMs,
        // Kept so a future image slot can default to album art without a
        // second API call; currently unused unless WIDGET_IMAGE_URL is unset.
        topTrackArt: topTrack ? pickImage(topTrack.image) : "",
        topTrackName: topTrack?.name ?? "",
        topTrackArtist: topTrack?.artist?.name ?? "",
        topArtist,
        topAlbum,
        profileUrl: infoBody?.user?.url ?? `https://www.last.fm/user/${user}`,
    };
}