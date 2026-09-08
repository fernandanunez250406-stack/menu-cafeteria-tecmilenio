import { useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    menuColors,
    menuRadius,
    menuSpacing,
    menuTypography,
} from "../../constants/menuTheme";
import { useAdmin } from "../../context/AdminContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminLoginModal({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const { login } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const reset = () => {
    setPassword("");
    setError(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const success = login(password);
    if (success) {
      reset();
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Acceso de administrador</Text>
          <Text style={styles.subtitle}>
            Ingresa la contraseña del personal de cafetería para administrar el
            menú.
          </Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Contraseña"
            placeholderTextColor={menuColors.textSecondary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(false);
            }}
            secureTextEntry
            autoFocus
            onSubmitEditing={handleSubmit}
          />

          {error && (
            <Text style={styles.errorText}>
              Contraseña incorrecta. Intenta de nuevo.
            </Text>
          )}

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Entrar</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: menuColors.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: menuSpacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: menuColors.background,
    borderRadius: menuRadius.lg,
    padding: menuSpacing.xl,
    gap: menuSpacing.sm,
  },
  title: {
    ...menuTypography.title,
    fontSize: 20,
    color: menuColors.textPrimary,
    textAlign: "center",
    marginBottom: menuSpacing.xs,
  },
  subtitle: {
    ...menuTypography.body,
    color: menuColors.textSecondary,
    textAlign: "center",
    marginBottom: menuSpacing.md,
  },
  input: {
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.md,
    paddingHorizontal: menuSpacing.md,
    paddingVertical: menuSpacing.md,
    fontSize: 15,
    color: menuColors.textPrimary,
  },
  inputError: {
    borderColor: menuColors.danger,
  },
  errorText: {
    ...menuTypography.body,
    fontSize: 13,
    color: menuColors.danger,
  },
  submitButton: {
    backgroundColor: menuColors.accent,
    borderRadius: menuRadius.md,
    paddingVertical: menuSpacing.md,
    alignItems: "center",
    marginTop: menuSpacing.md,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: menuSpacing.sm,
  },
  cancelButtonText: {
    color: menuColors.textSecondary,
    fontWeight: "600",
  },
});
