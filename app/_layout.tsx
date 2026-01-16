import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* StatusBar agar icon baterai/jam di HP terlihat cantik (hitam di layar putih) */}
      <StatusBar style="dark" />

      <Stack
        initialRouteName="Auth-screen/Login"
        screenOptions={{
          headerShown: false,
          // Background saat transisi agar tidak terlihat putih/hitam kosong
          contentStyle: { backgroundColor: "#fff" },
          // Animasi default untuk seluruh halaman (Slide halus)
          animation: "slide_from_right",
          animationDuration: 400,
          // Optimalisasi performa navigasi
          freezeOnBlur: true,
        }}
      >
        {/* Halaman Login - Menggunakan efek Fade agar muncul perlahan */}
        <Stack.Screen 
          name="Auth-screen/Login" 
          options={{ 
            animation: "fade" 
          }} 
        />

        {/* Halaman Register - Mengikuti arus default (Slide Right) */}
        <Stack.Screen 
          name="Auth-screen/Register" 
          options={{ 
            animation: "slide_from_right" 
          }} 
        />

        {/* Halaman Forgot Password - Bergaya Modal (Muncul dari Bawah) */}
        <Stack.Screen 
          name="Auth-screen/ForgotPassword" 
          options={{ 
            presentation: "modal", // Gaya iOS Pop up
            animation: "slide_from_bottom", // Gaya Android naik ke atas
          }} 
        />

        {/* Halaman Utama (Index) - Muncul dengan efek Zoom halus atau Fade */}
        <Stack.Screen 
          name="index" 
          options={{ 
            animation: "fade_from_bottom",
            // Gesture tutup halaman dimatikan agar user tidak sengaja swipe back ke login
            gestureEnabled: false 
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}