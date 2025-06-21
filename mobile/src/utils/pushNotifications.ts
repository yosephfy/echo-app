// mobile/src/utils/pushNotifications.ts
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // Only for physical devices
  if (!Constants.isDevice) {
    console.warn("Must use physical device for Push Notifications");
    return null;
  }

  // Get existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If still not granted, exit
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notifications!");
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}
