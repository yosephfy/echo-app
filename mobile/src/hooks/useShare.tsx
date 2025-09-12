import { Share, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useGlobalModal } from "../components/modal/GlobalModalProvider";

export function useShare(secretId: string) {
  const { show } = useGlobalModal();
  const link = `https://yourapp.com/secret/${secretId}`;

  const share = () => {
    show({
      title: "Share Secret",
      options: [
        {
          label: "Native Share",
          onPress: async () => {
            await Share.share({ message: link });
          },
        },
        {
          label: "Copy Link",
          onPress: async () => {
            await Clipboard.setStringAsync(link);
            Alert.alert("Copied!", "Link copied to clipboard.");
          },
        },
      ],
      cancelText: "Cancel",
    });
  };

  const ShareModal = () => null; // backward compatibility no-op
  return { share, ShareModal };
}
