"use strict";

// ======================================
// KONFIGURASI
// ======================================

// Ganti dengan nomor WhatsApp toko kamu.
// Gunakan kode negara tanpa tanda +, spasi, atau strip.
const WHATSAPP_NUMBER = "6281234567890";

// ======================================
// NAVIGASI MOBILE
// ======================================

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Tutup menu" : "Buka menu"
  );
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka menu");
    menuToggle.textContent = "☰";
  });
});

// Tandai navigasi sesuai bagian yang terlihat.
const sections = document.querySelectorAll("main section[id]");
const navItems = document.querySelectorAll(".nav-links a");

if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navItems.forEach((link) => {
        const active = link.getAttribute("href") ===
          `#${entry.target.id}`;

        if (active) {
          link.classList.add("active");
          link.setAttribute("aria-current", "location");
        } else {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
        }
      });
    });
  }, {
    rootMargin: "-25% 0px -60% 0px"
  });

  sections.forEach((section) => navObserver.observe(section));
}

// ======================================
// FILTER MENU
// ======================================

const filterButtons = document.querySelectorAll(".filter");
const productCards = document.querySelectorAll(".product-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.filter;

    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    productCards.forEach((card) => {
      const shouldShow =
        selectedCategory === "semua" ||
        card.dataset.category === selectedCategory;

      card.classList.toggle("hidden", !shouldShow);
    });
  });

  button.setAttribute(
    "aria-pressed",
    String(button.classList.contains("active"))
  );
});

// ======================================
// KERANJANG BELANJA
// ======================================

const cart = new Map();

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const toast = document.getElementById("toast");

let toastTimeout;

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function renderCart() {
  const items = Array.from(cart.values());

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  cartTotal.textContent = formatRupiah(totalPrice);

  if (items.length === 0) {
    cartItems.textContent = "Belum ada menu yang dipilih.";
    checkoutBtn.textContent = "Pesan via WhatsApp ↗";
    return;
  }

  cartItems.replaceChildren();

  items.forEach((item) => {
    const line = document.createElement("div");
    line.className = "cart-line";
    line.style.marginTop = "8px";
    line.style.color = "#e5d8cc";
    line.style.fontSize = "12px";

    const label = document.createElement("span");
    label.textContent =
      `${item.name} × ${item.quantity} — ` +
      formatRupiah(item.price * item.quantity);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = " − ";
    removeButton.setAttribute(
      "aria-label",
      `Kurangi ${item.name} dari keranjang`
    );
    removeButton.style.marginLeft = "10px";
    removeButton.style.padding = "2px 9px";
    removeButton.style.borderRadius = "8px";
    removeButton.style.border = "1px solid #e99a52";
    removeButton.style.background = "transparent";
    removeButton.style.color = "#ffc17d";
    removeButton.style.cursor = "pointer";

    removeButton.addEventListener("click", () => {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        cart.delete(item.name);
      }

      renderCart();
      showToast(`${item.name} diperbarui.`);
    });

    line.append(label, removeButton);
    cartItems.append(line);
  });

  const summary = document.createElement("p");
  summary.textContent = `Jumlah seluruh item: ${totalQuantity}`;
  cartItems.append(summary);

  checkoutBtn.textContent = `Checkout (${totalQuantity} item) ↗`;
}

// Tambahkan produk ke keranjang.
document.querySelectorAll(".add-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);

    if (!name || !Number.isFinite(price) || price <= 0) {
      showToast("Maaf, data menu tidak valid.");
      return;
    }

    if (cart.has(name)) {
      cart.get(name).quantity += 1;
    } else {
      cart.set(name, {
        name,
        price,
        quantity: 1
      });
    }

    renderCart();
    showToast(`${name} ditambahkan ke keranjang.`);
  });
});

// ======================================
// CHECKOUT WHATSAPP
// ======================================

checkoutBtn.addEventListener("click", () => {
  const items = Array.from(cart.values());

  if (items.length === 0) {
    showToast("Pilih menu terlebih dahulu.");
    return;
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const lines = [
    "Halo KOPI SENJA! Saya ingin memesan:",
    "",
    ...items.map((item) =>
      `- ${item.name} x${item.quantity} = ` +
      formatRupiah(item.price * item.quantity)
    ),
    "",
    `Total pesanan: ${formatRupiah(total)}`,
    "",
    "Mohon konfirmasi pesanan saya. Terima kasih!"
  ];

  const message = encodeURIComponent(lines.join("\n"));
  const whatsappURL =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  window.open(whatsappURL, "_blank", "noopener,noreferrer");
});

// ======================================
// TOMBOL WHATSAPP KONTAK
// ======================================

document.getElementById("contactWhatsApp").href =
  `https://wa.me/${WHATSAPP_NUMBER}`;

// ======================================
// ANIMASI SAAT SCROLL
// ======================================

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12
  });

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("visible");
  });
}

// ======================================
// TAHUN FOOTER
// ======================================

document.getElementById("year").textContent =
  new Date().getFullYear();

// Inisialisasi keranjang.
renderCart();