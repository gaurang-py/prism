import type { Character as CharacterRow, CharacterImage as CharacterImageRow } from "@prisma/client";
import type { Character } from "./types";
import { getReadUrl, r2Configured } from "./r2";

async function readUrl(key: string | null | undefined): Promise<string> {
  if (!key || !r2Configured()) return "";
  try {
    return await getReadUrl(key);
  } catch (error) {
    console.error("[r2] signed URL failed", error);
    return "";
  }
}

export async function serializeCharacter(
  row: CharacterRow & { images: CharacterImageRow[] },
): Promise<Character> {
  const images = await Promise.all(
    [...row.images]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime())
      .map(async (image) => ({
        id: image.id,
        key: image.key,
        url: await readUrl(image.key),
        sortOrder: image.sortOrder,
      })),
  );
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.getTime(),
    images,
  };
}

export async function serializeCharacters(
  rows: Array<CharacterRow & { images: CharacterImageRow[] }>,
): Promise<Character[]> {
  return Promise.all(rows.map(serializeCharacter));
}
