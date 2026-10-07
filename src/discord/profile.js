import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v10";

/**
 * Push stats to the user's Discord profile widget.
 *
 * `data` is replaced wholesale on every PATCH, so any field omitted here
 * disappears from the widget and falls back to whatever the Dev Portal has
 * configured for it.
 */
export async function updateProfile({
    token,
    clientId,
    userId,
    providerIssuedUserId,
    dynamic,
}) {
    const rest = new REST({ version: "10" }).setToken(token);

    const dynamicFields = dynamic.filter((field) => field.value !== "" && field.value != null);
    if (dynamicFields.length === 0) {
        throw new Error("no widget fields resolved; refusing to send an empty payload");
    }

    const body = {
        username: providerIssuedUserId,
        data: { dynamic: dynamicFields },
    };

    await rest.patch(Routes.applicationUserIdentityProfile(clientId, userId, providerIssuedUserId), {
        body,
    });

    return dynamicFields;
}