import { Alert, Platform } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel: string = 'Confirmar'
) {
  if (Platform.OS === 'web') {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}