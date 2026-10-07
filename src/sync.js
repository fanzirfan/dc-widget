import { fetchStats } from "./providers/lastfm.js";
import { updateProfile } from "./discord/profile.js";
import { clamp, formatListenTime, formatCount } from "./lib/format.js";

function required(name) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`missing required env var: ${name}`);
    return value;
}

function optional(name) {
    return process.env[name]?.trim() ?? "";
}

function buildFields(stats, title) {
    return [
        // WIDGET_TITLE lets the profile show a chosen name; without it the
        // Last.fm username is used. Only one display_name may be sent, since
        // duplicate keys make Discord's resolution of the field ambiguous.
        { type: 1, name: "display_name", value: clamp(title || stats.displayName) },
        { type: 1, name: "top_track", value: clamp(stats.topTrackName) },
        { type: 1, name: "top_artist", value: clamp(stats.topArtist) },
        { type: 1, name: "top_album", value: clamp(stats.topAlbum) },
        { type: 1, name: "total_listen", value: formatListenTime(stats.totalListenMs) },
        { type: 1, name: "scrobble_count", value: formatCount(stats.scrobbleCount) },
        // last.fm's terms require crediting the service in apps built on its API.
        { type: 1, name: "attribution", value: "Via Last.fm" },
    ];
}

async function main() {
    const stats = await fetchStats({
        apiKey: required("LASTFM_API_KEY"),
        user: required("LASTFM_USER"),
        period: optional("LASTFM_PERIOD") || "overall",
    });

    const fields = buildFields(stats, optional("WIDGET_TITLE"));

    const imageUrl = optional("WIDGET_IMAGE_URL");
    if (imageUrl) {
        fields.push({ type: 3, name: "cover_art", value: { url: imageUrl } });
    }

    const sent = await updateProfile({
        token: required("DISCORD_TOKEN"),
        clientId: required("DISCORD_CLIENT_ID"),
        userId: required("DISCORD_USER_ID"),
        providerIssuedUserId: required("PROVIDER_ISSUED_USER_ID"),
        dynamic: fields,
    });

    console.log(`[dc-widget] pushed ${sent.length} fields to Discord profile widget`);
    console.log(`[dc-widget] ${stats.profileUrl} — ${stats.scrobbleCount} scrobbles, ${formatListenTime(stats.totalListenMs)}`);
}

main().catch((error) => {
    console.error(`[dc-widget] sync failed: ${error.message}`);
    process.exitCode = 1;
});