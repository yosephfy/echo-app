// mobile/src/utils/storage.ts
import {
  ref,
  uploadBytesResumable,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { fbStorage, fbAuth } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

/* ================================
   Public API & Types
=================================== */

export enum StorageKind {
  AVATAR = "AVATAR",
  SECRET_IMAGE = "SECRET_IMAGE",
  REPLY_IMAGE = "REPLY_IMAGE",
  PUBLIC_ASSET = "PUBLIC_ASSET",
  USER_FILE = "USER_FILE",
  CHAT_IMAGE = "CHAT_IMAGE",
}

export type UploadSource =
  | { localUri: string } // file:// or content:// or https:// (Expo fetch-able)
  | { dataUrl: string }; // "data:image/webp;base64,..."

export type ImageTransformOptions = {
  /** Max output width (px). If both width/height set, respects aspect ratio. */
  maxWidth?: number;
  /** Max output height (px). If both width/height set, respects aspect ratio. */
  maxHeight?: number;
  /** 0..1 compression (only for JPEG/WEBP). Default 0.85 when transforming. */
  quality?: number;
  /** Output format for images. Defaults to keep-or-infer: "jpeg" | "png" | "webp" */
  format?: "jpeg" | "png" | "webp";
  /** Rotate degrees (clockwise). */
  rotate?: number; // e.g., 90
  /** Optional crop rect in source pixels. */
  crop?: { originX: number; originY: number; width: number; height: number };
};

export type UploadOptions = {
  kind: StorageKind;
  ids?: { userId?: string; secretId?: string; replyId?: string };
  /** Deterministic path & overwrite (default true for AVATAR, false otherwise). */
  overwrite?: boolean;
  /** Optional explicit filename (no path). If missing, a UUID is used (except AVATAR overwrite). */
  fileName?: string;
  /** Explicit extension or contentType (we infer if omitted). */
  ext?: string;
  contentType?: string;

  /** Cache policy:
   *  - AVATAR overwrite → "public, max-age=60"
   *  - others → "public, max-age=31536000, immutable"
   */
  cacheControl?: string;

  /** Extra object metadata. */
  customMetadata?: Record<string, string>;

  /** If present and file is an image, we manipulate before upload. */
  transform?: ImageTransformOptions;
};

export type UploadResult = {
  url: string; // download URL
  path: string; // storage path used
};

export type GetUrlOptions = {
  kind: StorageKind;
  ids?: { userId?: string; secretId?: string; replyId?: string };
  /** For non-deterministic kinds, pass the exact fileName you want to fetch. */
  fileName?: string;
  ext?: string; // helps with deterministic names (e.g., avatar.webp vs avatar.jpg)
};

/* ================================
   Main functions
=================================== */

export async function uploadFile(
  source: UploadSource,
  opts: UploadOptions
): Promise<UploadResult> {
  const authUid = fbAuth.currentUser?.uid;
  const userId = opts.ids?.userId ?? authUid;

  const {
    path,
    contentType: inferredCT,
    cacheControl,
  } = resolvePathAndMeta(opts, { userId });

  // Load & optionally transform
  const isDataUrl = "dataUrl" in source;
  const desiredCT = opts.contentType ?? inferredCT;

  let uploadBlob: Blob | null = null;
  let uploadCT: string | undefined = desiredCT;

  if (isDataUrl) {
    // If transform requested, write dataURL to a temp file → manipulate → read back as blob
    if (opts.transform) {
      const tempUri = await dataUrlToTempFile(
        source.dataUrl,
        opts.transform?.format
      );
      const { uri: outUri, mime: outCT } = await maybeTransformImage(
        tempUri,
        opts.transform
      );
      uploadCT =
        opts.contentType ?? outCT ?? desiredCT ?? "application/octet-stream";
      uploadBlob = await fetchAsBlob(outUri);
    } else {
      // No transform: upload data URL as-is
      const ctFromData = extractContentTypeFromDataUrl(source.dataUrl);
      const ct =
        opts.contentType ??
        ctFromData ??
        desiredCT ??
        "application/octet-stream";
      await uploadString(ref(fbStorage, path), source.dataUrl, "data_url", {
        contentType: ct,
        cacheControl,
        customMetadata: withDefaultMetadata(opts.customMetadata, {
          userId,
          kind: opts.kind,
        }),
      });
      const url = await getDownloadURL(ref(fbStorage, path));
      return { url, path };
    }
  } else {
    // localUri path
    if (
      opts.transform &&
      mightBeImage(desiredCT ?? extractExtFromUri(source.localUri))
    ) {
      const { uri: outUri, mime: outCT } = await maybeTransformImage(
        source.localUri,
        opts.transform
      );
      uploadCT =
        opts.contentType ?? outCT ?? desiredCT ?? "application/octet-stream";
      uploadBlob = await fetchAsBlob(outUri);
    } else {
      // No transform (or not an image) → raw blob
      const blob = await fetchAsBlob(source.localUri);
      uploadCT =
        opts.contentType ??
        (blob.type || desiredCT || guessContentTypeFromExt(path));
      uploadBlob = blob;
    }
  }

  // Upload the blob (resumable, handles larger files too)
  const storageRef = ref(fbStorage, path);
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, uploadBlob!, {
      contentType: uploadCT,
      cacheControl,
      customMetadata: withDefaultMetadata(opts.customMetadata, {
        userId,
        kind: opts.kind,
      }),
    });
    task.on(
      "state_changed",
      () => {},
      reject,
      () => resolve()
    );
  });

  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function getFileUrl(opts: GetUrlOptions): Promise<string> {
  const authUid = fbAuth.currentUser?.uid;
  const userId = opts.ids?.userId ?? authUid;
  const path = resolvePathOnly(opts, { userId });
  return getDownloadURL(ref(fbStorage, path));
}

/* ================================
   Path/Metadata resolution
=================================== */

function resolvePathAndMeta(
  opts: UploadOptions,
  ctx: { userId?: string }
): { path: string; contentType?: string; cacheControl: string } {
  const { path, ext } = _resolvePathCore(
    {
      kind: opts.kind,
      ids: opts.ids,
      fileName: opts.fileName,
      ext: opts.ext,
      overwrite: opts.overwrite,
    },
    ctx
  );

  const defaultCache =
    opts.kind === StorageKind.AVATAR && (opts.overwrite ?? true)
      ? "public, max-age=60" // overwrite targets refresh quickly
      : "public, max-age=31536000, immutable";

  return {
    path,
    contentType:
      opts.contentType ?? guessContentTypeFromExt(ext ? `x.${ext}` : path),
    cacheControl: opts.cacheControl ?? defaultCache,
  };
}

function resolvePathOnly(
  opts: GetUrlOptions,
  ctx: { userId?: string }
): string {
  const { path } = _resolvePathCore(
    {
      kind: opts.kind,
      ids: opts.ids,
      fileName: opts.fileName,
      ext: opts.ext,
      overwrite: true,
    },
    ctx
  );
  return path;
}

function _resolvePathCore(
  opts: {
    kind: StorageKind;
    ids?: { userId?: string; secretId?: string; replyId?: string };
    fileName?: string;
    ext?: string;
    overwrite?: boolean;
  },
  ctx: { userId?: string }
): { path: string; ext?: string } {
  const userId = opts.ids?.userId ?? ctx.userId;
  const secretId = opts.ids?.secretId;
  const replyId = opts.ids?.replyId;

  const overwrite = opts.overwrite ?? opts.kind === StorageKind.AVATAR;
  const ext = (opts.ext ?? guessExtFromName(opts.fileName)).toLowerCase();

  switch (opts.kind) {
    case StorageKind.AVATAR: {
      const uid = ensure(userId, "userId required for AVATAR");
      const resolvedExt = ext || "jpg";
      const name = overwrite
        ? `avatar.${resolvedExt}`
        : `${uuidv4()}.${resolvedExt}`;
      return { path: `users/${uid}/${name}`, ext: resolvedExt };
    }
    case StorageKind.SECRET_IMAGE: {
      const sid = ensure(secretId, "secretId required for SECRET_IMAGE");
      const resolvedExt = ext || "jpg";
      const name = opts.fileName
        ? sanitizeName(opts.fileName)
        : `${uuidv4()}.${resolvedExt}`;
      return { path: `secrets/${sid}/images/${name}`, ext: resolvedExt };
    }
    case StorageKind.REPLY_IMAGE: {
      const rid = ensure(replyId, "replyId required for REPLY_IMAGE");
      const resolvedExt = ext || "jpg";
      const name = opts.fileName
        ? sanitizeName(opts.fileName)
        : `${uuidv4()}.${resolvedExt}`;
      return { path: `replies/${rid}/images/${name}`, ext: resolvedExt };
    }
    case StorageKind.PUBLIC_ASSET: {
      const resolvedExt = ext || "jpg";
      const name = opts.fileName
        ? sanitizeName(opts.fileName)
        : `${uuidv4()}.${resolvedExt}`;
      return { path: `public/assets/${name}`, ext: resolvedExt };
    }
    case StorageKind.USER_FILE: {
      const uid = ensure(userId, "userId required for USER_FILE");
      const resolvedExt = ext || "dat";
      const name = opts.fileName
        ? sanitizeName(opts.fileName)
        : `${uuidv4()}.${resolvedExt}`;
      return { path: `users/${uid}/files/${name}`, ext: resolvedExt };
    }
    case StorageKind.CHAT_IMAGE: {
      const uid = ensure(userId, "userId required for CHAT_IMAGE");
      const resolvedExt = ext || "jpg";
      const name = opts.fileName
        ? sanitizeName(opts.fileName)
        : `${uuidv4()}.${resolvedExt}`;
      return { path: `chats/${uid}/images/${name}`, ext: resolvedExt };
    }
    default:
      throw new Error("Unsupported StorageKind");
  }
}

/* ================================
   Image manipulation helpers
=================================== */

function mightBeImage(hint?: string): boolean {
  if (!hint) return true; // best guess
  if (hint.startsWith("image/")) return true;
  const ext = hint.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].some((e) =>
    ext.includes(e)
  );
}

/** Transform with expo-image-manipulator if options provided. */
async function maybeTransformImage(
  inputUri: string,
  t: ImageTransformOptions
): Promise<{ uri: string; mime?: string }> {
  const actions: ImageManipulator.Action[] = [];

  if (t.crop) {
    actions.push({ crop: t.crop });
  }

  if (t.rotate) {
    actions.push({ rotate: t.rotate });
  }

  if (t.maxWidth || t.maxHeight) {
    actions.push({
      resize: {
        width: t.maxWidth,
        height: t.maxHeight,
      },
    });
  }

  const saveFormat = toManipulatorFormat(t.format); // defaults chosen below
  const compress = typeof t.quality === "number" ? clamp01(t.quality) : 0.85;

  // If no actions and no explicit format change, just return original
  if (actions.length === 0 && !saveFormat) {
    return { uri: inputUri, mime: undefined };
  }

  const result = await ImageManipulator.manipulateAsync(inputUri, actions, {
    format: saveFormat ?? ImageManipulator.SaveFormat.JPEG,
    compress,
    base64: false,
  });

  const outMime =
    saveFormat === ImageManipulator.SaveFormat.PNG
      ? "image/png"
      : saveFormat === ImageManipulator.SaveFormat.WEBP
        ? "image/webp"
        : "image/jpeg";

  return { uri: result.uri, mime: outMime };
}

function toManipulatorFormat(
  fmt?: "jpeg" | "png" | "webp"
): ImageManipulator.SaveFormat | undefined {
  if (!fmt) return undefined;
  switch (fmt) {
    case "jpeg":
      return ImageManipulator.SaveFormat.JPEG;
    case "png":
      return ImageManipulator.SaveFormat.PNG;
    case "webp":
      return ImageManipulator.SaveFormat.WEBP;
    default:
      return undefined;
  }
}

/** For data URLs + transform: write to a temp file so we can manipulate. */
async function dataUrlToTempFile(
  dataUrl: string,
  targetFmt?: "jpeg" | "png" | "webp"
) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const ext =
    targetFmt === "png" ? "png" : targetFmt === "webp" ? "webp" : "jpg";
  const filePath = `${FileSystem.cacheDirectory}upload_src_${uuidv4()}.${ext}`;
  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return filePath;
}

/* ================================
   Small utilities
=================================== */

function withDefaultMetadata(
  meta: Record<string, string> | undefined,
  add: Record<string, string | undefined>
) {
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(add)) {
    if (v != null) base[k] = String(v);
  }
  return { ...base, ...(meta ?? {}) };
}

function sanitizeName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_").slice(0, 120);
}

function extractExtFromUri(uri: string): string | undefined {
  const qless = uri.split("?")[0];
  const idx = qless.lastIndexOf(".");
  if (idx === -1) return undefined;
  return qless.slice(idx + 1).toLowerCase();
}

async function fetchAsBlob(uri: string): Promise<Blob> {
  const resp = await fetch(uri);
  if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
  return resp.blob();
}

function extractContentTypeFromDataUrl(dataUrl: string): string | undefined {
  const m = /^data:([^;]+);/.exec(dataUrl);
  return m?.[1];
}

function guessContentTypeFromExt(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "pdf") return "application/pdf";
  return undefined;
}

function ensure<T>(val: T | undefined | null, msg: string): T {
  if (val == null) throw new Error(msg);
  return val;
}

function guessExtFromName(name?: string): string {
  if (!name) return "";
  const m = /\.([A-Za-z0-9]+)$/.exec(name);
  return (m?.[1] || "").toLowerCase();
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
