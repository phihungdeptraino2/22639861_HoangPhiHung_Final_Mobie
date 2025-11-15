import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
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

  // 🔹 Xóa contact với xác nhận
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingContact(null); setOpenModal(true); }}>
        <Text style={styles.addText}>＋</Text>
      </TouchableOpacity>

      {contacts.length === 0 ? (
        <Text style={styles.empty}>Chưa có liên hệ nào.</Text>
      ) : (
        <FlatList
          data={contacts}
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
  container: { flex: 1, padding: 20 },
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
