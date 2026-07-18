const navBtns = document.querySelectorAll(".nav-btn");
const panels = document.querySelectorAll(".panel");
const pageTitle = document.getElementById("page-title");

navBtns.forEach((btn) => {
  btn.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = btn.getAttribute("data-target");
    const targetPanel = document.getElementById(`panel-${targetId}`);

    if (!targetPanel) return;

    navBtns.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    targetPanel.classList.add("active");

    if (pageTitle) {
      if (targetId === "dashboard") pageTitle.textContent = "Dashboard";
      if (targetId === "profil") pageTitle.textContent = "Kelola Profil Desa";
      if (targetId === "umkm") pageTitle.textContent = "Kelola UMKM";
      if (targetId === "admins") pageTitle.textContent = "Kelola Akun Admin";
      if (targetId === "pesan") pageTitle.textContent = "Pesan Masuk";
    }

    setTimeout(async () => {
      try {
        if (targetId === "profil") await loadProfilSupabase();
        if (targetId === "umkm") await renderUmkmSupabase();
        if (targetId === "admins") await renderAdminsSupabase();
        if (targetId === "pesan") await renderPesanSupabase();
      } catch (err) {
        console.error(`Gagal sinkronisasi data panel ${targetId}:`, err);
      }
    }, 10);
  });
});

const SUPABASE_URL = "https://kbsyguibbilcwvguzhly.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtic3lndWliYmlsY3d2Z3V6aGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTEyNDksImV4cCI6MjA5Nzk4NzI0OX0.sAHNWQorrAIWepnPIANx273ERDWzC4ljydXr0JvKj9c";
let supabaseClient = null;

function initSupabase() {
  if (window.supabase && !supabaseClient) {
    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
      );
    } catch (e) {
      console.error("Gagal inisialisasi SDK Supabase:", e);
    }
  }
  return supabaseClient;
}

const formProfil = document.getElementById("form-profil");
const inSejarah = document.getElementById("input-sejarah");
const inVisi = document.getElementById("input-visi");
const inMisi = document.getElementById("input-misi");

async function loadProfilSupabase() {
  if (!initSupabase()) return;
  try {
    const { data, error } = await supabaseClient
      .from("profil_desa")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      if (inSejarah) inSejarah.value = data.sejarah || "";
      if (inVisi) inVisi.value = data.visi || "";
      if (inMisi) inMisi.value = data.misi || "";
    }
  } catch (err) {
    console.error("Gagal memuat data profil:", err);
  }
}

if (formProfil) {
  formProfil.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!initSupabase()) return;

    const newData = {
      sejarah: inSejarah.value,
      visi: inVisi.value,
      misi: inMisi.value,
    };

    try {
      const { error } = await supabaseClient.from("profil_desa").upsert({
        id: 1,
        ...newData,
      });

      if (error) throw error;
      alert("Profil desa berhasil disimpan ke database!");
    } catch (err) {
      alert("Gagal menyimpan profil: " + err.message);
    }
  });
}

const tableBody = document.getElementById("umkm-table-body");
const modal = document.getElementById("umkm-modal");
const btnCloseModal = document.getElementById("close-modal");
const btnAdd = document.getElementById("btn-add-umkm");
const formUmkm = document.getElementById("form-umkm");
const modalTitle = document.getElementById("modal-title");

const uId = document.getElementById("umkm-id");
const uNama = document.getElementById("u-nama");
const uKategori = document.getElementById("u-kategori");
const uPenjual = document.getElementById("u-penjual");
const uWhatsapp = document.getElementById("u-whatsapp");
const uHarga = document.getElementById("u-harga");
const uGambar = document.getElementById("u-gambar");
const uBadge = document.getElementById("u-badge");
const uDeskripsi = document.getElementById("u-deskripsi");

function formatWhatsAppNumber(num) {
  if (!num) return "";
  let cleaned = num.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  return cleaned;
}

async function renderUmkmSupabase() {
  if (!tableBody || !initSupabase()) return;
  tableBody.innerHTML =
    '<tr><td colspan="5" style="text-align:center;">Memuat data...</td></tr>';

  try {
    const { data: umkmList, error } = await supabaseClient
      .from("umkm")
      .select("*")
      .order("id", {
        ascending: false,
      });

    if (error) throw error;
    tableBody.innerHTML = "";

    if (!umkmList || umkmList.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;">Belum ada data UMKM.</td></tr>';
      return;
    }

    umkmList.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td><img src="${item.gambar || "css/no-image.jpg"}" alt="${item.nama}" style="max-width:80px;border-radius:6px;height:50px;object-fit:cover;"></td>
            <td><strong>${item.nama}</strong><br><small style="color:#64748b;">${item.penjual} (WA: ${item.whatsapp || ""})</small></td>
            <td>${item.kategori}</td>
            <td>${item.harga}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUmkm(${item.id})" style="padding:4px 8px;font-size:0.8rem;"><i class='bx bx-edit'></i> Edit</button>
                <button class="btn btn-danger" onclick="deleteUmkm(${item.id})" style="padding:4px 8px;font-size:0.8rem;"><i class='bx bx-trash'></i> Hapus</button>
            </td>
        `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    tableBody.innerHTML =
      '<tr><td colspan="5" style="color:red;text-align:center;">Gagal mengambil data dari database!</td></tr>';
  }
}

function openModal(isEdit = false) {
  if (!modal) return;
  modal.classList.add("show");
  if (!isEdit) {
    modalTitle.textContent = "Tambah Produk UMKM";
    formUmkm.reset();
    uId.value = "";
    uKategori.value = ""; //
    uGambar.required = true;
    const previewContainer = document.getElementById(
      "u-gambar-preview-container",
    );
    if (previewContainer) previewContainer.style.display = "none";
  } else {
    modalTitle.textContent = "Edit Produk UMKM";
  }
}

function closeModal() {
  if (modal) modal.classList.remove("show");
}

if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
if (btnAdd) btnAdd.addEventListener("click", () => openModal(false));

if (formUmkm) {
  formUmkm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!initSupabase()) return;

    const idVal = uId.value;
    let gambarDataUrl = "";
    const file = uGambar.files[0];

    if (file) {
      try {
        gambarDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Gagal membaca file."));
          reader.readAsDataURL(file);
        });
      } catch (error) {
        alert("Gagal mengunggah foto.");
        return;
      }
    } else if (idVal) {
      const { data } = await supabaseClient
        .from("umkm")
        .select("gambar")
        .eq("id", idVal)
        .maybeSingle();
      if (data) gambarDataUrl = data.gambar;
    }

    const payload = {
      nama: uNama.value,
      kategori: uKategori.value,
      penjual: uPenjual.value,
      whatsapp: formatWhatsAppNumber(uWhatsapp.value),
      harga: uHarga.value,
      gambar: gambarDataUrl,
      badge: uBadge.value,
      deskripsi: uDeskripsi.value,
    };

    try {
      if (idVal) {
        // Mode Edit Data
        const { error } = await supabaseClient
          .from("umkm")
          .update(payload)
          .eq("id", idVal);
        if (error) throw error;
      } else {
        // Mode Tambah Baru
        const { error } = await supabaseClient.from("umkm").insert([payload]);
        if (error) throw error;
      }

      await renderUmkmSupabase();
      closeModal();
      alert("Data UMKM berhasil disimpan ke database!");
    } catch (err) {
      alert("Gagal menyimpan data UMKM: " + err.message);
    }
  });
}

if (uGambar) {
  uGambar.addEventListener("change", () => {
    const file = uGambar.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewContainer = document.getElementById(
          "u-gambar-preview-container",
        );
        const previewImg = document.getElementById("u-gambar-preview");
        if (previewContainer && previewImg) {
          previewImg.src = e.target.result;
          previewContainer.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

window.editUmkm = async function (id) {
  if (!initSupabase()) return;
  try {
    const { data: item, error } = await supabaseClient
      .from("umkm")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;

    if (item) {
      uId.value = item.id;
      uNama.value = item.nama;
      uKategori.value = item.kategori;
      uPenjual.value = item.penjual;
      uWhatsapp.value = item.whatsapp || "";
      uHarga.value = item.harga;

      const previewContainer = document.getElementById(
        "u-gambar-preview-container",
      );
      const previewImg = document.getElementById("u-gambar-preview");
      if (previewContainer && previewImg) {
        previewImg.src = item.gambar || "";
        previewContainer.style.display = item.gambar ? "block" : "none";
      }

      uGambar.required = false;
      uBadge.value = item.badge || "";
      uDeskripsi.value = item.deskripsi || "";
      openModal(true);
    }
  } catch (err) {
    alert("Gagal mengambil data detail: " + err.message);
  }
};

window.deleteUmkm = async function (id) {
  if (!initSupabase()) return;
  if (
    confirm(
      "Yakin ingin menghapus produk UMKM ini secara permanen dari database?",
    )
  ) {
    try {
      const { error } = await supabaseClient.from("umkm").delete().eq("id", id);
      if (error) throw error;
      await renderUmkmSupabase();
      alert("Produk berhasil dihapus!");
    } catch (err) {
      alert("Gagal menghapus data: " + err.message);
    }
  }
};

const adminsTableBody = document.getElementById("admins-table-body");
const formAddAdmin = document.getElementById("form-add-admin");
const formChangePassword = document.getElementById("form-change-password");
const currentUserDisplay = document.getElementById("current-user-display");

async function renderAdminsSupabase() {
  if (!initSupabase() || !adminsTableBody) return;

  const currentUsername = sessionStorage.getItem("adminUsername") || "Admin";
  if (currentUserDisplay) {
    currentUserDisplay.textContent = currentUsername;
  }

  try {
    const { data: admins, error } = await supabaseClient
      .from("admins")
      .select("id, username")
      .order("id", {
        ascending: true,
      });

    if (error) throw error;
    adminsTableBody.innerHTML = "";

    if (!admins || admins.length === 0) {
      adminsTableBody.innerHTML =
        '<tr><td colspan="2" style="text-align:center;">Tidak ada data admin.</td></tr>';
      return;
    }

    admins.forEach((admin) => {
      const tr = document.createElement("tr");
      const deleteBtn =
        admin.username.toLowerCase() === currentUsername.toLowerCase()
          ? `<span style="color: #94a3b8; font-size: 0.85rem;">(Anda)</span>`
          : `<button class="btn btn-danger" onclick="deleteAdminSupabase(${admin.id}, '${admin.username}')" style="padding:4px 8px; font-size:0.8rem;"><i class='bx bx-trash'></i> Hapus</button>`;

      tr.innerHTML = `<td><strong>${admin.username}</strong></td><td>${deleteBtn}</td>`;
      adminsTableBody.appendChild(tr);
    });
  } catch (err) {
    adminsTableBody.innerHTML =
      '<tr><td colspan="2" style="color: red; text-align:center;">Gagal memuat data database!</td></tr>';
  }
}

if (formAddAdmin) {
  formAddAdmin.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!initSupabase()) return;

    const newUsername = document
      .getElementById("new-admin-username")
      .value.trim();
    const newPassword = document
      .getElementById("new-admin-password")
      .value.trim();

    try {
      const { data: existing } = await supabaseClient
        .from("admins")
        .select("username")
        .eq("username", newUsername)
        .maybeSingle();

      if (existing) {
        alert("Username sudah digunakan!");
        return;
      }

      const { error } = await supabaseClient.from("admins").insert([
        {
          username: newUsername,
          password: newPassword,
        },
      ]);

      if (error) throw error;

      formAddAdmin.reset();
      await renderAdminsSupabase();
      alert("Admin baru berhasil ditambahkan!");
    } catch (err) {
      alert("Gagal menambahkan admin: " + err.message);
    }
  });
}

if (formChangePassword) {
  formChangePassword.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!initSupabase()) return;

    const currentUsername = sessionStorage.getItem("adminUsername");
    const oldPassword = document.getElementById("old-password").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();

    try {
      const { data: adminData, error: checkError } = await supabaseClient
        .from("admins")
        .select("*")
        .eq("username", currentUsername)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!adminData || adminData.password.toString().trim() !== oldPassword) {
        alert("Password lama salah!");
        return;
      }

      const { error: updateError } = await supabaseClient
        .from("admins")
        .update({
          password: newPassword,
        })
        .eq("username", currentUsername);

      if (updateError) throw updateError;

      formChangePassword.reset();
      alert("Password berhasil diubah!");
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message);
    }
  });
}

window.deleteAdminSupabase = async function (id, username) {
  if (!initSupabase()) return;
  const currentUsername = sessionStorage.getItem("adminUsername") || "";
  if (username.toLowerCase() === currentUsername.toLowerCase()) return;

  if (confirm(`Yakin ingin menghapus admin "${username}"?`)) {
    try {
      const { error } = await supabaseClient
        .from("admins")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await renderAdminsSupabase();
      alert("Admin berhasil dihapus!");
    } catch (err) {
      alert("Gagal menghapus admin: " + err.message);
    }
  }
};

const pesanList = document.getElementById("pesan-list");
const pesanBadge = document.getElementById("pesan-badge");
const pesanCountLabel = document.getElementById("pesan-count-label");

async function updatePesanBadgeSupabase() {
  if (!initSupabase() || !pesanBadge) return;
  try {
    const { data, error } = await supabaseClient
      .from("pesan_masuk")
      .select("dibaca");
    if (error) throw error;

    const unread = data.filter((m) => !m.dibaca).length;
    if (unread > 0) {
      pesanBadge.textContent = unread;
      pesanBadge.style.display = "inline-block";
    } else {
      pesanBadge.style.display = "none";
    }
  } catch (e) {}
}

async function renderPesanSupabase() {
  if (!pesanList || !initSupabase()) return;
  pesanList.innerHTML =
    '<div style="text-align:center; padding:20px; color:#94a3b8;">Memuat pesan...</div>';

  try {
    const { data: messages, error } = await supabaseClient
      .from("pesan_masuk")
      .select("*")
      .order("id", {
        ascending: false,
      });

    if (error) throw error;
    pesanList.innerHTML = "";

    const unread = messages.filter((m) => !m.dibaca).length;
    if (pesanCountLabel) {
      pesanCountLabel.textContent =
        messages.length > 0
          ? `(${messages.length} pesan, ${unread} belum dibaca)`
          : "";
    }

    if (!messages || messages.length === 0) {
      pesanList.innerHTML =
        '<div style="text-align:center; padding: 40px; color: #94a3b8;"><p>Belum ada pesan masuk.</p></div>';
      if (pesanBadge) pesanBadge.style.display = "none";
      return;
    }

    messages.forEach((msg) => {
      const card = document.createElement("div");
      card.style.cssText = `background: ${msg.dibaca ? "#f8fafc" : "#f0fdf4"}; border: 1px solid ${msg.dibaca ? "#e2e8f0" : "#bbf7d0"}; padding: 15px; margin-bottom: 10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;`;
      card.innerHTML = `
            <div>
                <strong>${msg.nama}</strong> <small>&lt;${msg.email || "-"}&gt;</small><br>
                <strong>📋 ${msg.judul || "Tanpa Judul"}</strong><br>
                <p style="margin-top:5px; color:#334155;">${msg.pesan}</p>
            </div>
            <div>
                ${!msg.dibaca ? `<button class="btn btn-success" onclick="tandaiBacaPesan(${msg.id})" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;"><i class='bx bx-check'></i> Dibaca</button>` : ""}
                <button class="btn btn-danger" onclick="hapusPesan(${msg.id})" style="padding:4px 8px; font-size:0.8rem;"><i class='bx bx-trash'></i> Hapus</button>
            </div>
        `;
      pesanList.appendChild(card);
    });

    if (pesanBadge) {
      if (unread > 0) {
        pesanBadge.textContent = unread;
        pesanBadge.style.display = "inline-block";
      } else {
        pesanBadge.style.display = "none";
      }
    }
  } catch (err) {
    pesanList.innerHTML =
      '<div style="text-align:center; color:red; padding:20px;">Gagal mengambil daftar pesan.</div>';
  }
}

window.tandaiBacaPesan = async function (id) {
  if (!initSupabase()) return;
  try {
    const { error } = await supabaseClient
      .from("pesan_masuk")
      .update({
        dibaca: true,
      })
      .eq("id", id);
    if (error) throw error;
    await renderPesanSupabase();
  } catch (err) {
    alert("Gagal memperbarui status pesan: " + err.message);
  }
};

window.hapusPesan = async function (id) {
  if (!initSupabase()) return;
  if (confirm("Hapus pesan ini dari database?")) {
    try {
      const { error } = await supabaseClient
        .from("pesan_masuk")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await renderPesanSupabase();
    } catch (err) {
      alert("Gagal menghapus pesan: " + err.message);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const currentUsername = sessionStorage.getItem("adminUsername") || "Admin";
  const displayUser = document.getElementById("current-user-display");
  if (displayUser) displayUser.textContent = currentUsername;

  setTimeout(async () => {
    try {
      await loadProfilSupabase();
    } catch (e) {}
    try {
      await renderUmkmSupabase();
    } catch (e) {}
    try {
      await updatePesanBadgeSupabase();
    } catch (e) {}
  }, 50);
});
