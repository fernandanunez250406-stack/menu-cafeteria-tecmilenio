import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAdmin } from "../../context/AdminContext";

type AdminLoginModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AdminLoginModal({
  visible,
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const { login } = useAdmin();

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleLogin = () => {
    const success = login(password);

    if (!success) {
      setError("Contraseña incorrecta");
      return;
    }

    setPassword("");
    setError("");

    onSuccess?.();
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Administrador</Text>

          <Text style={styles.subtitle}>
            Ingresa la contraseña para continuar.
          </Text>

          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
            onSubmitEditing={handleLogin}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.loginButton]}
              onPress={handleLogin}
            >
              <Text style={styles.loginText}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#222222",
  },

  error: {
    color: "#C62828",
    fontSize: 13,
    marginTop: 8,
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  button: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#EEEEEE",
  },

  loginButton: {
    backgroundColor: "#222222",
  },

  cancelText: {
    color: "#333333",
    fontWeight: "600",
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
