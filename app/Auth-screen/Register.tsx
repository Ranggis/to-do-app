import { auth } from "@/config/firebase";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
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
    ScrollView,
    Modal,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
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
                        size={40} 
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
                    <Text style={styles.alertBtnText}>Mengerti</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

export default function RegisterScreen() {
    const router = useRouter();
    const { user } = useAuth();
    
    // States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    // Alert State
    const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "error" });

    useEffect(() => {
        if (user) router.replace("/");
    }, [user]);

    const showAlert = (title: string, message: string, type = "error") => {
        setAlert({ visible: true, title, message, type });
    };

    const handleRegister = async () => {
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            showAlert("Opps!", "Tolong lengkapi semua kolom pendaftaran.");
            return;
        }
        if (password !== confirmPassword) {
            showAlert("Password Salah", "Konfirmasi password tidak cocok.");
            return;
        }
        if (password.length < 6) {
            showAlert("Terlalu Pendek", "Password minimal harus 6 karakter.");
            return;
        }

        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            let msg = "Gagal membuat akun. Silakan coba lagi.";
            if (error.code === 'auth/email-already-in-use') msg = "Email ini sudah terdaftar.";
            if (error.code === 'auth/invalid-email') msg = "Format email tidak valid.";
            if (error.code === 'auth/weak-password') msg = "Password terlalu lemah.";
            showAlert("Registrasi Gagal", msg);
        } finally {
            setLoading(false);
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
                onClose={() => setAlert({ ...alert, visible: false })}
            />

            {/* Back Button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <View style={styles.backIconCircle}>
                    <Ionicons name="chevron-back" size={22} color="#1E293B" />
                </View>
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="person-add" size={32} color="#fff" />
                        </View>
                        <Text style={styles.title}>Daftar Akun</Text>
                        <Text style={styles.subtitle}>Buat akun untuk mulai menyimpan catatan Anda</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* Email */}
                        <Text style={styles.label}>Email</Text>
                        <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
                            <Ionicons name="mail-outline" size={18} color={focusedInput === 'email' ? "#4285F4" : "#94A3B8"} />
                            <TextInput
                                style={styles.input}
                                placeholder="nama@email.com"
                                placeholderTextColor="#94A3B8"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password */}
                        <Text style={styles.label}>Password</Text>
                        <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputFocused]}>
                            <Ionicons name="lock-closed-outline" size={18} color={focusedInput === 'password' ? "#4285F4" : "#94A3B8"} />
                            <TextInput
                                style={styles.input}
                                placeholder="Min. 6 karakter"
                                placeholderTextColor="#94A3B8"
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password */}
                        <Text style={styles.label}>Konfirmasi Password</Text>
                        <View style={[styles.inputWrapper, focusedInput === 'confirm' && styles.inputFocused]}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={focusedInput === 'confirm' ? "#4285F4" : "#94A3B8"} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ulangi password"
                                placeholderTextColor="#94A3B8"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                onFocus={() => setFocusedInput('confirm')}
                                onBlur={() => setFocusedInput(null)}
                                secureTextEntry={!showPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.registerBtn, loading && styles.btnDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Daftar Sekarang</Text>}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.footer} onPress={() => router.back()} activeOpacity={0.6}>
                        <Text style={styles.footerText}>Sudah memiliki akun? <Text style={styles.loginLink}>Masuk</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    keyboardView: { flex: 1 },
    scrollContent: { paddingHorizontal: 25, paddingVertical: 20, flexGrow: 1, justifyContent: "center" },

    // Tombol Kembali
    backBtn: { position: 'absolute', top: 45, left: 20, zIndex: 10 },
    backIconCircle: { 
        width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", 
        justifyContent: 'center', alignItems: 'center', elevation: 2, 
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 
    },

    // Header
    header: { alignItems: "center", marginBottom: 25 },
    iconContainer: { 
        width: 65, height: 65, backgroundColor: "#4285F4", borderRadius: 20, 
        justifyContent: "center", alignItems: "center", marginBottom: 15,
        elevation: 6, shadowColor: "#4285F4", shadowOpacity: 0.2, shadowRadius: 10
    },
    title: { fontSize: 26, fontWeight: "800", color: "#1E293B", marginBottom: 5 },
    subtitle: { fontSize: 14, color: "#64748B", textAlign: "center", paddingHorizontal: 30, lineHeight: 20 },

    // Kartu Form
    formCard: { 
        backgroundColor: "#fff", borderRadius: 28, padding: 20,
        elevation: 4, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12
    },
    label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 6, marginLeft: 4, marginTop: 12 },
    inputWrapper: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9",
        borderRadius: 16, paddingHorizontal: 16, height: 54, marginBottom: 5,
        borderWidth: 1.5, borderColor: "transparent"
    },
    inputFocused: { borderColor: "#4285F4", backgroundColor: "#fff" },
    input: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1E293B" },

    // Tombol Daftar
    registerBtn: { 
        backgroundColor: "#1E293B", height: 56, borderRadius: 16, 
        justifyContent: "center", alignItems: "center", marginTop: 25,
        elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8
    },
    btnDisabled: { backgroundColor: "#94A3B8" },
    registerBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

    // Footer
    footer: { alignItems: "center", marginTop: 25, paddingBottom: 10 },
    footerText: { fontSize: 14, color: "#64748B" },
    loginLink: { color: "#4285F4", fontWeight: "800" },

    // Styles Alert Premium
    alertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
    alertCard: { width: width * 0.8, backgroundColor: '#fff', borderRadius: 28, padding: 25, alignItems: 'center' },
    alertIconHeader: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    alertTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    alertMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    alertBtn: { width: '100%', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    alertBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});