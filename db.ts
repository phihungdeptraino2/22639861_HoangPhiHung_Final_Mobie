import * as SQLite from "expo-sqlite";

export const openDB = () => {
  return SQLite.openDatabaseSync("contacts.db"); // v54 dùng openDatabaseSync
};

export const db = openDB();
