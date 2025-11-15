import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { db } from "../db";

type Contact = {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  favorite?: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  contact?: Contact; // optional, dùng để edit
};

export default function ContactModal({ visible, onClose, onSaved, contact }: Props) {
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [email, setEmail] = useState(contact?.email || "");

  // Khi contact thay đổi, update state
  useEffect(() => {
    setName(contact?.name || "");
    setPhone(contact?.phone || "");
    setEmail(contact?.email || "");
  }, [contact]);

  const saveContact = async () => {
    if (!name.trim()) {
      alert("Tên không được để trống");
      return;
    }
    if (email && !email.includes("@")) {
      alert("Email không hợp lệ");
      return;
    }

    if (contact?.id) {
      // Update contact
      await db.runAsync(
        "UPDATE contacts SET name=?, phone=?, email=? WHERE id=?",
        name, phone, email, contact.id
      );
    } else {
      // Insert mới
      await db.runAsync(
        "INSERT INTO contacts (name, phone, email, created_at) VALUES (?, ?, ?, ?)",
        name, phone, email, Date.now()
      );
    }

    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>{contact?.id ? "Sửa liên hệ" : "Thêm liên hệ"}</Text>

        <TextInput style={styles.input} placeholder="Tên" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Số điện thoại" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />

        <TouchableOpacity style={styles.btn} onPress={saveContact}>
          <Text style={styles.btnText}>Lưu</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancel}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 48 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: "#ccc", padding: 12,
    borderRadius: 8, marginBottom: 15,
  },
  btn: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "white", fontSize: 16 },
  cancel: { marginTop: 15, textAlign: "center", color: "red" },
});
