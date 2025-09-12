import { Alert } from "react-native";
import { api } from "../api/client";
import { useGlobalModal } from "../components/modal/GlobalModalProvider";

const REASONS = [
  { label: "Spam", value: "spam" },
  { label: "Inappropriate", value: "inappropriate" },
  { label: "Harassment", value: "harassment" },
  { label: "Other", value: "other" },
];

export function useReport(secretId: string) {
  const { show } = useGlobalModal();

  const report = () => {
    show({
      title: "Report Secret",
      options: REASONS.map((r) => ({
        label: r.label,
        onPress: async () => {
          try {
            await api.post(`/secrets/${secretId}/report`, { reason: r.value });
            Alert.alert("Reported", "Thank you for your feedback.");
          } catch (err: any) {
            console.error(err);
            Alert.alert("Error", "Could not submit report.");
          }
        },
      })),
      cancelText: "Cancel",
    });
  };

  // Backward compatibility: legacy API returned a component to render; now it's empty
  const ReportModal = () => null;

  return { report, ReportModal };
}
// Styles removed: now handled by global modal
