const SUPABASE_URL = "https://kbsyguibbilcwvguzhly.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtic3lndWliYmlsY3d2Z3V6aGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTEyNDksImV4cCI6MjA5Nzk4NzI0OX0.sAHNWQorrAIWepnPIANx273ERDWzC4ljydXr0JvKj9c";

var supabaseClient = null;

function initSupabase() {
  if (supabaseClient) return true;
  if (typeof supabase === "undefined") {
    console.error(
      "Supabase SDK belum dimuat. Pastikan CDN CDN sudah terpasang.",
    );
    return false;
  }
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

function formatText(text) {
  if (!text) return "";
  return text.replace(/\n/g, "<br>");
}

function formatList(text) {
  if (!text) return "";
  return text
    .split("\n")
    .map((item) => (item.trim() ? `<li>${item.trim()}</li>` : ""))
    .join("");
}

async function getProfil() {
  if (!initSupabase()) return {};
  try {
    const { data, error } = await supabaseClient
      .from("profil_desa")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;
    return data || {};
  } catch (err) {
    console.error("Gagal mengambil data profil dari Supabase:", err);
    return {};
  }
}

async function getUMKM() {
  if (!initSupabase()) return [];
  try {
    const { data, error } = await supabaseClient
      .from("umkm")
      .select("*")
      .order("id", {
        ascending: false,
      });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Gagal mengambil data UMKM dari Supabase:", err);
    return [];
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const elProfilTeaserText = document.getElementById("profil-teaser-text");
  if (elProfilTeaserText) {
    const profilData = await getProfil();
    const firstSentence = profilData.sejarah
      ? profilData.sejarah.split(".")[0] + "."
      : "";
    elProfilTeaserText.textContent = firstSentence;
  }

  const elSejarah = document.getElementById("detail-sejarah");
  const elVisi = document.getElementById("detail-visi");
  const elMisi = document.getElementById("detail-misi");

  if (elSejarah || elVisi || elMisi) {
    const profilData = await getProfil();
    if (elSejarah)
      elSejarah.innerHTML = `<p>${formatText(profilData.sejarah)}</p>`;
    if (elVisi) elVisi.innerHTML = formatText(profilData.visi);
    if (elMisi) elMisi.innerHTML = formatList(profilData.misi);
  }

  const renderUmkmCards = async (
    containerId,
    limit = null,
    categoryFilter = "semua",
  ) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let umkmList = await getUMKM();

    if (categoryFilter !== "semua") {
      umkmList = umkmList.filter(
        (item) =>
          item.kategori &&
          item.kategori.toLowerCase() === categoryFilter.toLowerCase(),
      );
    }

    const displayList = limit ? umkmList.slice(0, limit) : umkmList;

    container.innerHTML = "";

    if (displayList.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">
        <p><i class='bx bx-info-circle' style="font-size: 2rem;"></i><br>Belum ada produk untuk kategori ini.</p>
      </div>`;
      return;
    }

    displayList.forEach((item) => {
      const badgeHtml = item.badge
        ? `<span class="umkm-badge">${item.badge}</span>`
        : "";

      const waNumber = item.whatsapp || "6281234567890";
      const card = document.createElement("div");
      card.className = "umkm-card";
      card.innerHTML = `
                <div class="umkm-img-wrapper">
                    <a href="detail-produk.html?id=${item.id}">
                        <img src="${item.gambar}" alt="${item.nama}" class="umkm-img">
                    </a>
                    ${badgeHtml}
                </div>
                <div class="umkm-content">
                    <p class="umkm-category">${item.kategori}</p>
                    <h3 class="umkm-title">
                        <a href="detail-produk.html?id=${item.id}" style="transition: var(--transition);" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color=''">
                            ${item.nama}
                        </a>
                    </h3>
                    <p class="umkm-seller"><i class='bx bx-user'></i> ${item.penjual}</p>
                    
                    <div class="umkm-footer">
                        <span class="umkm-price">${item.harga}</span>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <a href="detail-produk.html?id=${item.id}" style="font-size: 0.9rem; font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 2px;" title="Lihat Detail">
                                Detail <i class='bx bx-chevron-right' style="font-size: 1.1rem;"></i>
                            </a>
                            <a href="https://wa.me/${waNumber}?text=Halo,%20saya%20tertarik%20membeli%20${encodeURIComponent(item.nama)}" class="btn-icon-round" target="_blank" title="Beli via WhatsApp">
                                <i class='bx bxl-whatsapp'></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
      container.appendChild(card);
    });
  };

  renderUmkmCards("index-umkm-grid", 3); // Untuk Beranda
  renderUmkmCards("umkm-grid", null, "semua"); // Untuk Halaman UMKM

  const filterButtons = document.querySelectorAll(".filter-btn");
  if (filterButtons.length > 0) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        filterButtons.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        const kategoriTeks = this.textContent.trim().toLowerCase();

        renderUmkmCards("umkm-grid", null, kategoriTeks);
      });
    });
  }

  renderUmkmCards("index-umkm-grid", 3);
  renderUmkmCards("umkm-grid");

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("show-menu");
    });
  }

  const header = document.getElementById("header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY >= 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }
});

let currentHeroSlide = 0;
let heroSlideInterval;

function updateHeroCarousel() {
  const heroCarousel = document.getElementById("hero-carousel");
  const heroDots = document.querySelectorAll("#hero-dots .carousel-dot");

  if (!heroCarousel) return;

  const slides = heroCarousel.children.length;

  if (currentHeroSlide >= slides) currentHeroSlide = 0;
  if (currentHeroSlide < 0) currentHeroSlide = slides - 1;

  heroCarousel.style.transform = `translateX(-${currentHeroSlide * 100}%)`;

  heroDots.forEach((dot, index) => {
    if (index === currentHeroSlide) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

window.nextHeroSlide = function () {
  currentHeroSlide++;
  updateHeroCarousel();
  resetHeroInterval();
};

window.prevHeroSlide = function () {
  currentHeroSlide--;
  updateHeroCarousel();
  resetHeroInterval();
};

window.goToHeroSlide = function (index) {
  currentHeroSlide = index;
  updateHeroCarousel();
  resetHeroInterval();
};

function resetHeroInterval() {
  clearInterval(heroSlideInterval);
  if (document.getElementById("hero-carousel")) {
    heroSlideInterval = setInterval(window.nextHeroSlide, 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("hero-carousel")) {
    heroSlideInterval = setInterval(window.nextHeroSlide, 5000);
  }
});
