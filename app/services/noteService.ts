import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Note } from "../../types/Note";

// ==========================================
// 1. FETCH NOTES (SORTING PIN & TANGGAL)
// ==========================================
export const fetchNotes = async (): Promise<Note[]> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const q = query(collection(db, "notes"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);

    const rawData = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Note[];

    // Logika Pengurutan: 
    // 1. Pinned Note selalu di atas.
    // 2. Di bawah Pinned, urutkan berdasarkan waktu buat terbaru.
    return rawData.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};

// ==========================================
// 2. UPLOAD IMAGE TO CLOUDINARY (HELPER)
// ==========================================
const uploadImage = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", { 
    uri, 
    type: "image/jpeg", 
    name: `note_${Date.now()}.jpg` 
  } as any);
  formData.append("upload_preset", "todo_upload");

  const res = await fetch("https://api.cloudinary.com/v1_1/dpfnzxood/image/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
};

// ==========================================
// 3. ADD NOTE (DENGAN FIELD LENGKAP)
// ==========================================
export const addNote = async (
  title: string,
  text: string,
  imageUri?: string,
  color: string = "#ffffff",
  isList: boolean = false
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    let imageUrl = null;
    if (imageUri) {
      imageUrl = await uploadImage(imageUri);
    }

    const docRef = await addDoc(collection(db, "notes"), {
      title: title || "",
      text: text || "",
      imageUrl,
      color,
      isList,
      isPinned: false,
      isArchived: false, // Default tidak masuk arsip
      isDeleted: false,  // Default tidak masuk sampah
      completed: false,
      completedAt: null,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Add Note Error:", error);
    throw error;
  }
};

// ==========================================
// 4. UPDATE NOTE (PARTIAL UPDATE & SMART IMAGE)
// ==========================================
export const updateNote = async (
  id: string,
  updates: Partial<Note>
): Promise<void> => {
  try {
    const dataToUpdate: any = { ...updates };

    // Jika imageUrl ada dan merupakan path lokal (baru diganti), upload dulu
    if (updates.imageUrl && (updates.imageUrl.startsWith("file") || updates.imageUrl.startsWith("content"))) {
      dataToUpdate.imageUrl = await uploadImage(updates.imageUrl);
    }

    await updateDoc(doc(db, "notes", id), dataToUpdate);
  } catch (error) {
    console.error("Update Note Error:", error);
    throw error;
  }
};

// ==========================================
// 5. TOGGLE STATUS (DONE/UNDONE + TIMESTAMP)
// ==========================================
export const toggleNoteStatus = async (
  id: string,
  currentStatus: boolean
): Promise<void> => {
  try {
    const newStatus = !currentStatus;
    await updateDoc(doc(db, "notes", id), {
      completed: newStatus,
      completedAt: newStatus ? new Date().toISOString() : null, // Catat waktu detail jika Selesai
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    throw error;
  }
};

// ==========================================
// 6. DELETE NOTE PERMANENT (SAMPAH -> HAPUS)
// ==========================================
export const deleteNote = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "notes", id));
  } catch (error) {
    console.error("Delete Error:", error);
    throw error;
  }
};