export type PostCursor = {
  createdAt: string;
  id: string;
  score?: number;
  commentCount?: number;
  sortValue?: number;
};

export type CommentCursor = {
  createdAt: string;
  id: string;
};

function encode(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

function decode<T>(str: string): T | null {
  try {
    const json = Buffer.from(str, "base64url").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function encodePostCursor(cursor: PostCursor): string {
  return encode(cursor);
}

export function decodePostCursor(str: string): PostCursor | null {
  const raw = decode<PostCursor>(str);
  if (!raw || typeof raw.createdAt !== "string" || typeof raw.id !== "string") {
    return null;
  }
  return raw;
}

export function encodeCommentCursor(cursor: CommentCursor): string {
  return encode(cursor);
}

export function decodeCommentCursor(str: string): CommentCursor | null {
  const raw = decode<CommentCursor>(str);
  if (!raw || typeof raw.createdAt !== "string" || typeof raw.id !== "string") {
    return null;
  }
  return raw;
}
