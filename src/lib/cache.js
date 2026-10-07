import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), "data");

async function pathFor(name) {
    const path = join(DATA_DIR, name);
    await mkdir(dirname(path), { recursive: true });
    return path;
}

/** A missing or corrupt cache is never fatal: it just means we re-fetch. */
export async function readCache(name) {
    try {
        const raw = await readFile(await pathFor(name), "utf8");
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

export async function writeCache(name, value) {
    await writeFile(await pathFor(name), JSON.stringify(value, null, 2), "utf8");
}