import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Modal,
  ScrollView, ActivityIndicator, LayoutAnimation, Platform, UIManager, Animated, Dimensions, Pressable, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { Note } from "../types/Note";
import * as authService from "./services/authService";
import * as noteService from "./services/noteService";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const COLORS: string[] = [
  "#ffffff", "#f28b82", "#fbbc04", "#fff475", "#ccff90", "#a7ffeb", "#cbf0f8", "#aecbfa", "#d7aefb", "#fdcfe8"
];

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ZenithUltimateApp() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // NAVIGATION VIEW STATE
  const [currentView, setCurrentView] = useState<"Catatan" | "Arsip" | "Sampah">("Catatan");

  // Editor States
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [color, setColor] = useState("#ffffff");
  const [isPinned, setIsPinned] = useState(false);
  const [isList, setIsList] = useState(false); 
  const [saving, setSaving] = useState(false);

  // UI States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!authLoading && !user) router.replace("/Auth-screen/Login");
    if (user) fetchNotes();
  }, [user, authLoading]);

  const fetchNotes = async () => {
    try {
      setFetching(true);
      const data = await noteService.fetchNotes();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setNotes(data);
    } catch (e) { console.error(e); } finally { setFetching(false); }
  };

  const formatDetailedTime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })} • ${time}`;
  };

  const getFilteredData = () => {
    const base = notes.filter(n => 
        n.text?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (currentView === "Catatan") return base.filter(n => !n.isArchived && !n.isDeleted);
    if (currentView === "Arsip") return base.filter(n => n.isArchived && !n.isDeleted);
    if (currentView === "Sampah") return base.filter(n => n.isDeleted);
    return base;
  };

  const handleAction = async (id: string, action: "archive" | "unarchive" | "trash" | "restore" | "delete_forever") => {
    try {
      if (action === "archive") await noteService.updateNote(id, { isArchived: true, isPinned: false });
      else if (action === "unarchive") await noteService.updateNote(id, { isArchived: false });
      else if (action === "trash") await noteService.updateNote(id, { isDeleted: true, isPinned: false, isArchived: false });
      else if (action === "restore") await noteService.updateNote(id, { isDeleted: false });
      else if (action === "delete_forever") {
        Alert.alert("Hapus Permanen", "Tindakan ini tidak bisa dibatalkan.", [
            { text: "Batal" },
            { text: "Hapus", style: 'destructive', onPress: async () => {
                await noteService.deleteNote(id);
                fetchNotes();
            }}
        ]);
        return;
      }
      fetchNotes();
    } catch (e) { Alert.alert("Error", "Gagal memperbarui status"); }
  };

  const handleSave = async () => {
    if (!text.trim() && !title.trim() && !image) return setModalVisible(false);
    setSaving(true);
    try {
      let finalImageUrl = image;
      if (image && (image.startsWith('file') || image.startsWith('content'))) {
        const formData = new FormData();
        formData.append("file", { uri: image, type: "image/jpeg", name: "img.jpg" } as any);
        formData.append("upload_preset", "todo_upload");
        const res = await fetch("https://api.cloudinary.com/v1_1/dpfnzxood/image/upload", { method: "POST", body: formData });
        const uploadData = await res.json();
        finalImageUrl = uploadData.secure_url;
      }

      if (isEditing && currentNote) {
        await noteService.updateNote(currentNote.id, { title, text, imageUrl: finalImageUrl, color, isPinned, isList });
      } else {
        await noteService.addNote(title, text, finalImageUrl || undefined, color, isList);
      }
      setModalVisible(false);
      fetchNotes();
    } catch (e) { Alert.alert("Error", "Gagal menyimpan"); } finally { setSaving(false); }
  };

  const openNote = (note?: Note) => {
    if (currentView === "Sampah") return; 
    if (note) {
      setCurrentNote(note); setTitle(note.title || ""); setText(note.text);
      setImage(note.imageUrl); setColor(note.color || "#ffffff"); setIsPinned(note.isPinned);
      setIsList(note.isList || false); setIsEditing(true);
    } else {
      setCurrentNote(null); setTitle(""); setText("");
      setImage(null); setColor("#ffffff"); setIsPinned(false); setIsList(false); setIsEditing(false);
    }
    setModalVisible(true);
  };

  if (authLoading || !user) return <View style={styles.center}><ActivityIndicator size="large" color="#4285F4"/></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* NAVBAR (Urutan: Menu [Kiri] - Search [Tengah] - Profil [Kanan]) */}
      <View style={styles.topNavbar}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setIsDrawerOpen(true)}>
            <Ionicons name="menu-outline" size={30} color="#5f6368" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <TextInput 
              placeholder={`Cari di ${currentView}...`} 
              style={styles.searchInp} 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
          </View>

          <TouchableOpacity onPress={() => setIsProfileOpen(true)}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>{user?.email?.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST NOTES GRID */}
      <FlatList
        data={getFilteredData()}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.85}
            onPress={() => openNote(item)}
            style={[styles.noteCard, { backgroundColor: item.color || "#fff" }]}
          >
            {item.isPinned && <View style={styles.pinIcon}><Ionicons name="pin" size={14} color="#5f6368" /></View>}
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />}
            <View style={styles.cardBody}>
              {item.title ? <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text> : null}
              <Text numberOfLines={8} style={[styles.cardText, item.completed && styles.strike]}>
                {item.isList ? "• " + item.text.replace(/\n/g, "\n• ") : item.text}
              </Text>
              
              {item.completed && item.completedAt && (
                <View style={styles.timestampBadge}>
                  <Ionicons name="time-outline" size={12} color="#34a853" />
                  <Text style={styles.timestampText}>{formatDetailedTime(item.completedAt)}</Text>
                </View>
              )}
            </View>

            {/* CARD QUICK ACTIONS */}
            <View style={styles.cardActions}>
               {currentView === "Sampah" ? (
                 <>
                   <TouchableOpacity onPress={() => handleAction(item.id, "restore")}><Ionicons name="refresh-circle" size={24} color="#5f6368" /></TouchableOpacity>
                   <TouchableOpacity onPress={() => handleAction(item.id, "delete_forever")}><Ionicons name="trash" size={22} color="#d93025" /></TouchableOpacity>
                 </>
               ) : (
                 <>
                   <TouchableOpacity onPress={() => noteService.toggleNoteStatus(item.id, item.completed).then(fetchNotes)}>
                      <Ionicons name={item.completed ? "checkmark-circle" : "ellipse-outline"} size={22} color={item.completed ? "#34a853" : "#5f6368"} />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => handleAction(item.id, currentView === "Arsip" ? "unarchive" : "archive")}>
                      <Ionicons name={currentView === "Arsip" ? "cloud-upload-outline" : "archive-outline"} size={20} color="#5f6368" />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => handleAction(item.id, "trash")}><Ionicons name="trash-outline" size={20} color="#5f6368" /></TouchableOpacity>
                 </>
               )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="bulb-outline" size={100} color="#f1f3f4"/><Text style={styles.emptyText}>{currentView} Kosong</Text></View>}
      />

      {currentView === "Catatan" && (
        <TouchableOpacity style={styles.fab} onPress={() => openNote()}>
            <Ionicons name="add" size={38} color="#4285F4" />
        </TouchableOpacity>
      )}

      {/* SIDEBAR KANAN INSTAN */}
      <Modal visible={isDrawerOpen} transparent onRequestClose={() => setIsDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setIsDrawerOpen(false)} />
          <View style={styles.drawerBody}>
            <Text style={styles.drawerBrand}>Leo Keep</Text>
            <DrawerItem icon="bulb" label="Notes" active={currentView === "Catatan"} onPress={() => {setCurrentView("Catatan"); setIsDrawerOpen(false);}} />
            <DrawerItem icon="archive-outline" label="Archive" active={currentView === "Arsip"} onPress={() => {setCurrentView("Arsip"); setIsDrawerOpen(false);}} />
            <DrawerItem icon="trash-outline" label="Trash" active={currentView === "Sampah"} onPress={() => {setCurrentView("Sampah"); setIsDrawerOpen(false);}} />
          </View>
        </View>
      </Modal>

      {/* PROFILE MODAL */}
      <Modal visible={isProfileOpen} transparent animationType="fade">
        <Pressable style={styles.profileBackdrop} onPress={() => setIsProfileOpen(false)}>
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{user?.email?.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <TouchableOpacity style={styles.manageBtn}><Text style={styles.manageBtnText}>Kelola Akun</Text></TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.logoutBtn} onPress={() => authService.signOut()}>
              <Ionicons name="log-out-outline" size={22} color="#d93025" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* EDITOR MODAL */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[styles.modalLayout, { backgroundColor: color }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleSave}><Ionicons name="chevron-back" size={30} color="#5f6368" /></TouchableOpacity>
            <View style={styles.modalHeaderRight}>
              <TouchableOpacity onPress={() => setIsPinned(!isPinned)}><Ionicons name={isPinned ? "pin" : "pin-outline"} size={24} color="#5f6368" /></TouchableOpacity>
              <TouchableOpacity onPress={() => setIsList(!isList)}><Ionicons name={isList ? "list-outline" : "text-outline"} size={24} color="#5f6368" /></TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                  const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
                  if(!res.canceled) setImage(res.assets[0].uri);
              }}><Ionicons name="image-outline" size={24} color="#5f6368" /></TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving}><Text style={styles.saveBtn}>Simpan</Text></TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.editorScroll}>
            {image && <View style={styles.imgBox}><Image source={{ uri: image }} style={styles.fullImg}/><TouchableOpacity style={styles.imgRemove} onPress={()=>setImage(null)}><Ionicons name="close-circle" size={32} color="rgba(0,0,0,0.5)" /></TouchableOpacity></View>}
            <TextInput placeholder="Judul" style={styles.titleInp} value={title} onChangeText={setTitle} placeholderTextColor="#80868b" />
            <TextInput placeholder={isList ? "Daftar..." : "Catatan"} multiline style={styles.textInp} value={text} onChangeText={setText} placeholderTextColor="#80868b" autoFocus />
          </ScrollView>
          <View style={styles.colorArea}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {COLORS.map((c: string) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 2 : 1, borderColor: '#dadce0' }]} />
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const DrawerItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.drawerItem, active && styles.drawerItemActive]}>
    <Ionicons name={icon} size={24} color={active ? "#1967d2" : "#5f6368"} />
    <Text style={[styles.drawerLabel, { color: active ? "#1967d2" : "#202124" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topNavbar: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', elevation: 4, zIndex: 10 },
  navRow: { flexDirection: "row", alignItems: "center", height: 50, justifyContent: 'space-between' },
  searchBar: { flex: 1, backgroundColor: '#f1f3f4', height: 46, borderRadius: 23, marginHorizontal: 15, justifyContent: 'center', paddingHorizontal: 15 },
  searchInp: { fontSize: 16, color: '#3c4043' },
  avatarMini: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#4285F4", justifyContent: "center", alignItems: "center" },
  avatarMiniText: { color: "#fff", fontWeight: "bold" },
  listContent: { padding: 10, paddingBottom: 100 },
  gridRow: { justifyContent: 'space-between' },
  noteCard: { width: '48.5%', marginBottom: 12, borderRadius: 28, borderWidth: 1, borderColor: "#dadce0", backgroundColor: '#fff', overflow: 'hidden', elevation: 2 },
  pinIcon: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  cardImage: { width: "100%", height: 140, resizeMode: 'cover' },
  cardBody: { padding: 16 },
  cardTitle: { fontWeight: "bold", fontSize: 16, color: '#202124', marginBottom: 6 },
  cardText: { fontSize: 14, color: '#3c4043', lineHeight: 20 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 12, borderTopWidth: 0.5, borderColor: '#f1f3f4' },
  strike: { textDecorationLine: 'line-through', opacity: 0.5 },
  timestampBadge: { marginTop: 10, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#f1f3f4', borderRadius: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  timestampText: { fontSize: 9, color: '#5f6368', fontWeight: '800', marginLeft: 4 },
  fab: { position: "absolute", bottom: 35, right: 25, backgroundColor: "#fff", width: 66, height: 66, borderRadius: 22, justifyContent: "center", alignItems: "center", elevation: 10 },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row-reverse' },
  drawerBackdrop: { flex: 1 },
  drawerBody: { width: width * 0.8, backgroundColor: '#fff', height: '100%', padding: 25, paddingTop: 60 },
  drawerBrand: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, color: '#5f6368' },
  drawerItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderTopLeftRadius: 35, borderBottomLeftRadius: 35 },
  drawerItemActive: { backgroundColor: '#feefc3' },
  drawerLabel: { marginLeft: 20, fontSize: 16, fontWeight: '700' },
  profileBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: '#fff', width: '85%', borderRadius: 32, padding: 30, elevation: 25, alignItems: 'center' },
  profileInfo: { alignItems: 'center', marginBottom: 25 },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4285F4', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarLargeText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  profileEmail: { fontSize: 16, fontWeight: '700', color: '#202124', marginBottom: 15 },
  manageBtn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 25, borderWidth: 1, borderColor: '#dadce0' },
  manageBtnText: { fontSize: 14, fontWeight: '700', color: '#5f6368' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingTop: 15, width: '100%', justifyContent: 'center' },
  logoutText: { marginLeft: 10, color: '#d93025', fontWeight: 'bold', fontSize: 16 },
  modalLayout: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", padding: 15, alignItems: 'center' },
  modalHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  saveBtn: { fontSize: 16, fontWeight: 'bold', color: '#202124', paddingRight: 10 },
  editorScroll: { flex: 1, paddingHorizontal: 25 },
  imgBox: { width: '100%', position: 'relative', marginBottom: 20 },
  fullImg: { width: '100%', height: 350, borderRadius: 24, resizeMode: 'contain' },
  imgRemove: { position: 'absolute', top: 15, right: 15 },
  titleInp: { fontSize: 26, fontWeight: "bold", color: '#202124', marginBottom: 15 },
  textInp: { fontSize: 18, color: '#3c4043', textAlignVertical: 'top', minHeight: 300 },
  colorArea: { paddingVertical: 25, borderTopWidth: 0.5, borderColor: '#f1f3f4' },
  colorDot: { width: 48, height: 48, borderRadius: 24, marginRight: 15 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15, width: '100%' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 150 },
  emptyText: { color: '#80868b', fontSize: 18, marginTop: 15, fontWeight: '800' }
});