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
  const existingPermissions = await Notifications.getPermissionsAsync();
  let granted = existingPermissions.granted;

  // Ask if not already granted
  if (!granted) {
    const requestedPermissions =
      await Notifications.requestPermissionsAsync();
    granted = requestedPermissions.granted;
  }

  // If still not granted, exit
  if (!granted) {
    alert("Failed to get push token for push notifications!");
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}
