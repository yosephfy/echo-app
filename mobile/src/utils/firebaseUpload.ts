import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { fbStorage } from "../lib/firebase";

/**
 * Upload a local file (ImagePicker URI) to Firebase Storage.
 * Returns { url, fullPath } on success.
 */
export async function uploadFileFromUri(
  localUri: string,
  destPath: string,
  opts?: {
    contentType?: string;
    cacheControl?: string;
    customMetadata?: Record<string, string>;
  }
) {
  const resp = await fetch(localUri);
  const blob = await resp.blob();

  const storageRef = ref(fbStorage, destPath);
  const task = uploadBytesResumable(storageRef, blob, {
    contentType: opts?.contentType,
    cacheControl: opts?.cacheControl ?? "public, max-age=31536000, immutable",
    customMetadata: opts?.customMetadata,
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      () => {},
      reject,
      () => resolve()
    );
  });

  const url = await getDownloadURL(storageRef);
  return { url, fullPath: destPath };
}
