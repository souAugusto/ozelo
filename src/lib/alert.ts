import { Alert, Platform } from 'react-native';

/**
 * react-native-web's Alert.alert is a no-op — calling it silently does
 * nothing, which makes every error path invisible on the web build. This
 * falls back to window.alert there so errors are never swallowed.
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
