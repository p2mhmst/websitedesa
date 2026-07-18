import { supabase } from "./supabaseClient.js";

export async function tambahAdmin(email, name, role = "admin") {
  const { data, error } = await supabase
    .from("admins")
    .insert([
      {
        email,
        name,
        role,
      },
    ])
    .select();

  if (error) {
    console.error("❌ Gagal menambah admin:", error.message);
    return {
      success: false,
      error,
    };
  }

  console.log("✅ Admin berhasil ditambahkan:", data);
  return {
    success: true,
    data,
  };
}

export async function ambilSemuaAdmin() {
  const { data, error } = await supabase.from("admins").select("*");

  if (error) {
    console.error("❌ Gagal mengambil data:", error.message);
    return {
      success: false,
      error,
    };
  }

  return {
    success: true,
    data,
  };
}

export async function hapusAdmin(adminId) {
  const { error } = await supabase.from("admins").delete().eq("id", adminId);

  if (error) {
    console.error("❌ Gagal menghapus admin:", error.message);
    return {
      success: false,
      error,
    };
  }

  console.log(`🗑️ Admin dengan ID ${adminId} berhasil dihapus.`);
  return {
    success: true,
  };
}
