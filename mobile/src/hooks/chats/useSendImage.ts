// mobile/src/hooks/chat/useSendImage.ts
import * as ImagePicker from "expo-image-picker";
import { uploadFile, StorageKind } from "../../utils/storage";

export async function pickAndUploadChatImage(myUserId?: string) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") throw new Error("Permission denied");

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });
  if (result.canceled) return null;

  const uri = result.assets?.[0]?.uri;
  if (!uri) return null;

  const { url } = await uploadFile(
    { localUri: uri },
    {
      kind: StorageKind.CHAT_IMAGE,
      ids: { userId: myUserId },
      transform: { quality: 0.65 },
    }
  );
  return url;
}
