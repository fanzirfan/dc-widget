# dc-widget

Pushes Last.fm listening stats to your Discord profile widget. One-shot script,
no bot process — run it on a schedule and it exits.

## Requirements

- Node.js >= 20.6
- A Discord application whose profile widget you have already added to your profile
- A Last.fm API key — https://www.last.fm/api/account/create
- A Last.fm account that receives scrobbles from YouTube Music

## Setup

```bash
npm install
cp .env.example .env   # then fill it in
npm run sync
```

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DISCORD_TOKEN` | yes | Bot token |
| `DISCORD_CLIENT_ID` | yes | Application ID |
| `DISCORD_USER_ID` | yes | Your user ID (Developer Mode → right-click → Copy ID) |
| `PROVIDER_ISSUED_USER_ID` | yes | Identity key. **Never change it** — Discord rejects writes that move an identity to a different external account |
| `LASTFM_API_KEY` | yes | Read-only key. Do not put the shared secret here; this project never writes to Last.fm |
| `LASTFM_USER` | yes | Last.fm username |
| `LASTFM_PERIOD` | no | `overall` (default), `7day`, `1month`, `3month`, `6month`, `12month` |
| `WIDGET_TITLE` | no | Overrides the display name |
| `WIDGET_IMAGE_URL` | no | Public HTTPS image. Empty sends no image, so the Dev Portal fallback renders |

## Dev Portal setup

Each widget field in the Developer Portal is bound to a **Data Field** name.
The names below must match the payload exactly, or the widget shows its fallback.

| Slot | Data Field | Value type |
| --- | --- | --- |
| Title | `display_name` | User Data → User Data |
| Subtitle 1–3 | *(leave unbound)* | — |
| Stat 1 | `top_track` | Custom String |
| Stat 2 | `top_artist` | Custom String |
| Stat 3 | `top_album` | Custom String |
| Stat 4 | `total_listen` | Custom String |
| Stat 5 | `scrobble_count` | Custom String |
| Stat 6 | `attribution` | Custom String |
| Image | `cover_art` | Media |

The identity key must match one already attached to your account. To check it:

```bash
curl -H "Authorization: Bot $DISCORD_TOKEN" \
  https://discord.com/api/v10/users/$DISCORD_USER_ID/application-identities/$DISCORD_CLIENT_ID
```

Use the `provider_issued_user_id` from that response.

Fields left unbound fall back to whatever you configure in the portal, so a
missing stat never blanks the widget.

## How the numbers work

- **Top track / artist / album** come straight from Last.fm.
- **Total listening time is an estimate.** Last.fm has no listened-time endpoint,
  so it is computed as *lifetime scrobbles × average duration of your top 50
  tracks*. Scrobbles fire when a track passes its halfway point, so skipped
  tracks are counted as fully played. That is why the widget shows `≈`.
  Durations are cached in `data/durations.json` and never re-fetched.
- **Scrobble count** is the lifetime figure from `user.getInfo`.

## Scheduling

Run `npm run sync` on a schedule (any cron or external scheduler). Last.fm asks
that callers pace themselves; hourly is comfortable.

## Notes

- Last.fm's terms require crediting the service, which is what the `attribution`
  field is for.
- Discord says existing custom profile widgets are "no longer supported" since
  the July 2026 experiment shutdown. Existing widgets still update, but treat
  this as best-effort.