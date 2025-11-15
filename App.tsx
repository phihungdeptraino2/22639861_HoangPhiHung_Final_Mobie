// App.tsx
import { useEffect } from "react";
import { db } from "./db";
import ContactList from "./screens/ContactList";

export default function App() {
  useEffect(() => {
    const setupDatabase = async () => {
      // Tạo bảng
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          favorite INTEGER DEFAULT 0,
          created_at INTEGER
        );
      `);

      // Kiểm tra dữ liệu có hay chưa
      const row = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM contacts"
      );

      if (!row) return;

      // Seed mẫu nếu trống
      if (row.count === 0) {
        await db.runAsync(
          "INSERT INTO contacts (name, phone, created_at) VALUES (?, ?, ?)",
          "Alice", "0123456789", Date.now()
        );
        await db.runAsync(
          "INSERT INTO contacts (name, phone, created_at) VALUES (?, ?, ?)",
          "Bob", "0987654321", Date.now()
        );
      }
    };

    setupDatabase();
  }, []);

  return <ContactList />;
}
