import { auth } from "@/config/firebase";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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
    Modal,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// --- KOMPONEN CUSTOM ALERT PREMIUM ---
const CustomAlert = ({ visible, title, message, type, onClose }: any) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.alertOverlay}>
                <View style={styles.alertContainer}>
                    <View style={[styles.alertIconBg, { backgroundColor: type === 'error' ? '#FFF1F0' : '#F0F7FF' }]}>
                        <Ionicons 
                            name={type === 'error' ? "close-circle" : "information-circle"} 
                            size={44} 
                            color={type === 'error' ? "#FF4D4F" : "#1890FF"} 
                        />
                    </View>
                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>
                    <TouchableOpacity 
                        style={[styles.alertButton, { backgroundColor: type === 'error' ? '#FF4D4F' : '#1890FF' }]} 
                        onPress={onClose}
                    >
                        <Text style={styles.alertButtonText}>Mengerti</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default function LoginScreen() {
    const router = useRouter();
    const { user } = useAuth();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "error"
    });

    useEffect(() => {
        if (user) router.replace("/");
    }, [user]);

    const showAlert = (title: string, message: string, type: string = "error") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert("Opps!", "Email dan password wajib diisi.", "error");
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            let msg = "Terjadi kesalahan sistem.";
            if (error.code === 'auth/user-not-found') msg = "Akun tidak terdaftar.";
            if (error.code === 'auth/wrong-password') msg = "Email atau password salah.";
            showAlert("Login Gagal", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <Ionicons name="book" size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>Selamat Datang</Text>
                        <Text style={styles.subtitle}>Kelola catatanmu dengan lebih cerdas</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* Email Input */}
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={[
                            styles.inputWrapper, 
                            focusedInput === 'email' && styles.inputWrapperFocused
                        ]}>
                            <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? "#4285F4" : "#999"} />
                            <TextInput
                                style={styles.input}
                                placeholder="nama@email.com"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password Input */}
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={[
                            styles.inputWrapper, 
                            focusedInput === 'password' && styles.inputWrapperFocused
                        ]}>
                            <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? "#4285F4" : "#999"} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color="#999" 
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={styles.forgotPassword}
                            onPress={() => router.push("/Auth-screen/ForgotPassword")}
                        >
                            <Text style={styles.forgotPasswordText}>Lupa password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.btnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginBtnText}>Masuk Sekarang</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>ATAU DAFTAR DENGAN</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.registerBtn}
                            onPress={() => router.push("/Auth-screen/Register")}
                        >
                            <Text style={styles.footerText}>
                                Belum punya akun? <Text style={styles.registerLink}>Daftar</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 25, justifyContent: "center" },
    
    header: { alignItems: "center", marginBottom: 35 },
    logoBadge: { 
        width: 80, height: 80, backgroundColor: "#4285F4", 
        borderRadius: 24, justifyContent: "center", alignItems: "center",
        elevation: 10, shadowColor: "#4285F4", shadowOpacity: 0.3, shadowRadius: 10,
        marginBottom: 20
    },
    title: { fontSize: 30, fontWeight: "800", color: "#1E293B", letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: "#64748B", marginTop: 5, textAlign: "center" },

    formCard: { 
        backgroundColor: "#fff", borderRadius: 30, padding: 20,
        elevation: 5, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15
    },
    inputLabel: { 
        fontSize: 14, fontWeight: "700", color: "#475569", 
        marginBottom: 8, marginLeft: 4, marginTop: 15 
    },
    inputWrapper: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9",
        borderRadius: 16, paddingHorizontal: 16, height: 60,
        borderWidth: 1.5, borderColor: "transparent"
    },
    inputWrapperFocused: {
        borderColor: "#4285F4", backgroundColor: "#fff"
    },
    input: { flex: 1, fontSize: 16, color: "#1E293B", marginLeft: 12 },
    forgotPassword: { alignSelf: "flex-end", marginTop: 12, marginBottom: 25 },
    forgotPasswordText: { color: "#4285F4", fontSize: 14, fontWeight: "700" },
    
    loginBtn: { 
        backgroundColor: "#1E293B", height: 60, borderRadius: 18, 
        justifyContent: "center", alignItems: "center",
        elevation: 8, shadowColor: "#1E293B", shadowOpacity: 0.3, shadowRadius: 12
    },
    btnDisabled: { backgroundColor: "#94A3B8" },
    loginBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },

    footer: { marginTop: 30 },
    divider: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
    dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
    dividerText: { marginHorizontal: 15, color: "#94A3B8", fontSize: 12, fontWeight: "800" },
    registerBtn: { alignItems: "center", paddingBottom: 20 },
    footerText: { fontSize: 15, color: "#64748B" },
    registerLink: { color: "#4285F4", fontWeight: "800" },

    alertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
    alertContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 32, padding: 30, alignItems: 'center' },
    alertIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    alertTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
    alertMessage: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    alertButton: { width: '100%', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    alertButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});