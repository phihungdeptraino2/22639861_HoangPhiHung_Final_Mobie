import { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Switch, ActivityIndicator } from "react-native";
import { db } from "../db";
import ContactModal from "../components/ContactModal";

type Contact = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  favorite?: number;
};

export default function ContactList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [searchText, setSearchText] = useState("");
  const [showFavoriteOnly, setShowFavoriteOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    const rows = await db.getAllAsync<Contact>("SELECT * FROM contacts ORDER BY id DESC");
    setContacts(rows);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Toggle favorite
  const toggleFavorite = async (id: number, current: number = 0) => {
    const newValue = current === 1 ? 0 : 1;
    await db.runAsync("UPDATE contacts SET favorite = ? WHERE id = ?", newValue, id);
    loadContacts();
  };

  // Delete contact
  const deleteContact = (contact: Contact) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa liên hệ "${contact.name}"?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            await db.runAsync("DELETE FROM contacts WHERE id=?", contact.id);
            loadContacts();
          }
        },
      ]
    );
  };

  // 🔹 Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.phone.includes(searchText);
      const matchesFavorite = showFavoriteOnly ? c.favorite === 1 : true;
      return matchesSearch && matchesFavorite;
    });
  }, [contacts, searchText, showFavoriteOnly]);

  // 🔹 Import contacts từ API
  const importContactsFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://6918486921a96359486f90aa.mockapi.io/dt"); // Thay bằng API thật
      if (!response.ok) throw new Error("Network response was not ok");
      const data: { name: string; phone: string; email?: string }[] = await response.json();

      for (const item of data) {
        // Kiểm tra trùng phone
        const exists = contacts.find(c => c.phone === item.phone);
        if (!exists) {
          await db.runAsync(
            "INSERT INTO contacts (name, phone, email, created_at) VALUES (?, ?, ?, ?)",
            item.name,
            item.phone,
            item.email || "",
            Date.now()
          );
        }
      }

      await loadContacts();
    } catch (err: any) {
      setError(err.message || "Lỗi import contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm theo tên hoặc số điện thoại..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Favorite Filter */}
      <View style={styles.favoriteFilter}>
        <Text>Chỉ hiển thị favorite</Text>
        <Switch value={showFavoriteOnly} onValueChange={setShowFavoriteOnly} />
      </View>

      {/* Import Button */}
      <TouchableOpacity style={styles.importBtn} onPress={importContactsFromAPI} disabled={loading}>
        <Text style={{ color: "white", fontWeight: "bold" }}>Import từ API</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#2196f3" style={{ marginVertical: 10 }} />}
      {error && <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>}

      <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingContact(null); setOpenModal(true); }}>
        <Text style={styles.addText}>＋</Text>
      </TouchableOpacity>

      {filteredContacts.length === 0 ? (
        <Text style={styles.empty}>Chưa có liên hệ nào.</Text>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>

              <TouchableOpacity onPress={() => toggleFavorite(item.id, item.favorite)}>
                <Text style={styles.star}>{item.favorite === 1 ? "⭐" : "☆"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setEditingContact(item); setOpenModal(true); }}>
                <Text style={{ marginLeft: 10, color: "#2196f3" }}>Sửa</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteContact(item)}>
                <Text style={{ marginLeft: 10, color: "red" }}>Xóa</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <ContactModal
        visible={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={loadContacts}
        contact={editingContact || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  favoriteFilter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between"
  },
  importBtn: {
    backgroundColor: "#4caf50",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10
  },
  empty: { textAlign: "center", marginTop: 40, fontSize: 16 },
  item: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center"
  },
  name: { fontSize: 18, fontWeight: "bold" },
  phone: { fontSize: 14, color: "#555" },
  star: { fontSize: 28, marginLeft: 10 },
  addBtn: {
    position: "absolute",
    right: 15,
    bottom: 15,
    backgroundColor: "#2196f3",
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  addText: { color: "white", fontSize: 30, marginTop: -3 },
});
