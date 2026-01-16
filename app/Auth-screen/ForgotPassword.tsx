import { auth } from "@/config/firebase";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { 
    KeyboardAvoidingView, 
    Platform, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    ActivityIndicator,
    StatusBar,
    Modal,
    ScrollView,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// --- KOMPONEN CUSTOM ALERT PREMIUM ---
const PremiumAlert = ({ visible, title, message, type, onClose }: any) => (
    <Modal visible={visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
                <View style={[styles.alertIconHeader, { backgroundColor: type === 'error' ? '#FFF1F0' : '#F0F9EB' }]}>
                    <Ionicons 
                        name={type === 'error' ? "close-circle" : "checkmark-circle"} 
                        size={44} 
                        color={type === 'error' ? "#FF4D4F" : "#52C41A"} 
                    />
                </View>
                <Text style={styles.alertTitle}>{title}</Text>
                <Text style={styles.alertMessage}>{message}</Text>
                <TouchableOpacity 
                    style={[styles.alertBtn, { backgroundColor: type === 'error' ? '#1E293B' : '#52C41A' }]} 
                    onPress={onClose}
                    activeOpacity={0.8}
                >
                    <Text style={styles.alertBtnText}>{type === 'error' ? 'Coba Lagi' : 'Kembali Ke Login'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Alert State
    const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "error" });

    const showAlert = (title: string, message: string, type = "error") => {
        setAlert({ visible: true, title, message, type });
    };

    const handleResetPassword = async () => {
        if (!email) {
            showAlert("Email Kosong", "Masukkan email Anda untuk menerima instruksi reset password.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            showAlert(
                "Email Terkirim!", 
                "Link reset password telah dikirim ke email Anda. Periksa kotak masuk atau folder spam.",
                "success"
            );
        } catch (error: any) {
            let msg = "Terjadi kesalahan. Silakan coba lagi.";
            if (error.code === 'auth/user-not-found') msg = "Email ini tidak terdaftar di sistem kami.";
            if (error.code === 'auth/invalid-email') msg = "Format email yang Anda masukkan salah.";
            showAlert("Gagal", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAlertClose = () => {
        setAlert({ ...alert, visible: false });
        if (alert.type === "success") {
            router.back(); // Kembali ke login jika sukses
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <PremiumAlert 
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={handleAlertClose}
            />

            {/* Tombol Kembali yang Estetik */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <View style={styles.backIconCircle}>
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </View>
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="key" size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>Lupa Password?</Text>
                        <Text style={styles.subtitle}>
                            Jangan khawatir! Masukkan email yang terdaftar dan kami akan mengirimkan link untuk mengatur ulang kata sandi Anda.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.label}>Email Terdaftar</Text>
                        <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
                            <Ionicons name="mail-outline" size={20} color={isFocused ? "#4285F4" : "#94A3B8"} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukkan email Anda"
                                placeholderTextColor="#94A3B8"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Kirim Instruksi</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.bottomLink} onPress={() => router.back()}>
                        <Text style={styles.bottomLinkText}>Ingat password? <Text style={{color: '#4285F4', fontWeight: '800'}}>Masuk</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    keyboardView: { flex: 1 },
    scrollContent: { padding: 30, flexGrow: 1, justifyContent: "center" },

    // Back Button
    backBtn: { position: 'absolute', top: 45, left: 20, zIndex: 10 },
    backIconCircle: { 
        width: 45, height: 45, borderRadius: 22.5, backgroundColor: "#fff", 
        justifyContent: 'center', alignItems: 'center', elevation: 4, 
        shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 
    },

    // Header
    header: { alignItems: "center", marginBottom: 40 },
    iconContainer: { 
        width: 80, height: 80, backgroundColor: "#4285F4", borderRadius: 24, 
        justifyContent: "center", alignItems: "center", marginBottom: 20,
        elevation: 8, shadowColor: "#4285F4", shadowOpacity: 0.3, shadowRadius: 12
    },
    title: { fontSize: 28, fontWeight: "800", color: "#1E293B", marginBottom: 12 },
    subtitle: { fontSize: 15, color: "#64748B", textAlign: "center", lineHeight: 22, paddingHorizontal: 10 },

    // Form
    formCard: { backgroundColor: "#fff", padding: 5, borderRadius: 30 },
    label: { fontSize: 14, fontWeight: "700", color: "#475569", marginBottom: 8, marginLeft: 5 },
    inputWrapper: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9",
        borderRadius: 18, paddingHorizontal: 16, height: 60, marginBottom: 25,
        borderWidth: 1.5, borderColor: "transparent"
    },
    inputFocused: { borderColor: "#4285F4", backgroundColor: "#fff" },
    input: { flex: 1, marginLeft: 12, fontSize: 16, color: "#1E293B" },

    button: {
        height: 60, borderRadius: 18, backgroundColor: "#1E293B",
        justifyContent: "center", alignItems: "center",
        elevation: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },

    bottomLink: { marginTop: 30, alignItems: 'center' },
    bottomLinkText: { fontSize: 15, color: "#64748B" },

    // Premium Alert Styles
    alertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
    alertCard: { width: width * 0.85, backgroundColor: '#fff', borderRadius: 32, padding: 30, alignItems: 'center' },
    alertIconHeader: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    alertTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
    alertMessage: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    alertBtn: { width: '100%', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    alertBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});