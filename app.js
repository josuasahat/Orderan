/* ============================================================
   TAHU WALIK — Order App logic (vanilla JS, no build step)
   ============================================================ */
(() => {
  "use strict";

  // ---------- Config (ubah di sini kalau harga/menu berubah) ----------
  const CONFIG = {
    waNumber: "6281282397512",       // nomor WA penerima pesanan (format 62…)
    readyDay: 4,                      // 0=Minggu … 4=Kamis
    readyHour: 8,                     // jam mulai ready
    closeHour: 17,                    // setelah jam ini dianggap minggu depan
    pickupPlace: "Telkom University Jakarta – Kampus Minangkabau (C)",
    slots: ["08.00–10.00", "10.00–12.00", "12.00–14.00", "14.00–16.00"],
  };

  const FLAVORS = [
    { id: "bojot",  name: "Bojot",        emoji: "🌶️", desc: "Pedas gurih nampol", spice: 4, color: "#d6361f" },
    { id: "balado", name: "Balado",       emoji: "🔥", desc: "Pedas manis cabai",  spice: 3, color: "#e2502a" },
    { id: "bbq",    name: "BBQ",          emoji: "🍖", desc: "Smoky manis gurih",  spice: 1, color: "#7a3b1c" },
    { id: "jagung", name: "Jagung Bakar", emoji: "🌽", desc: "Manis wangi bakaran", spice: 0, color: "#e0a100" },
  ];

  const PACKS = [
    { id: "reg", name: "Tahu Walik Box",      sub: "Tahu Walik + Basreng + Otak-otak", emoji: "📦", price: 15000 },
    { id: "air", name: "Paket + Air Mineral", sub: "Box + air mineral dingin",         emoji: "💧", price: 17000, extra: "💧" },
    { id: "teh", name: "Paket + Teh Pucuk",   sub: "Box + Teh Pucuk Harum",            emoji: "🍵", price: 19000, extra: "🍵" },
  ];

  const MASCOT_LINES = [
    "Haii! Laper ya? 🤤", "Aku renyah lho~ ✨", "Coba yang Bojot! 🌶️", "Kamis jangan lupa! 📅",
    "Mix rasa boleh banget!", "Kriuk kriuk kriuk 🎶", "15 ribu doang! 💸", "Jangan dibalik lagi ya 🙃",
    "Cocok buat nemenin kuliah 📚", "Pesan sebelum kehabisan! 🏃",
  ];

  // ---------- Helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rp = (n) => "Rp" + new Intl.NumberFormat("id-ID").format(n);
  const num = (n) => new Intl.NumberFormat("id-ID").format(n);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* ignore */ } };
  const flavorById = (id) => FLAVORS.find((f) => f.id === id) || FLAVORS[0];
  const packById = (id) => PACKS.find((p) => p.id === id) || PACKS[0];
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // ---------- State ----------
  const state = {
    flavor: "bojot",
    pack: "reg",
    qty: 1,
    cart: store.get("tw-cart", []),
    history: store.get("tw-history", []),
  };

  /* ============================================================
     THEME
     ============================================================ */
  const root = document.documentElement;
  const savedTheme = store.get("tw-theme", null);
  if (savedTheme) root.dataset.theme = savedTheme;
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const syncThemeIcon = () => { if (!root.dataset.theme) root.dataset.theme = isDark() ? "dark" : "light"; };
  syncThemeIcon();
  $("#themeBtn").addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    store.set("tw-theme", next);
    $('meta[name="theme-color"]').setAttribute("content", next === "dark" ? "#160a05" : "#8f3412");
  });

  /* ============================================================
     HERO EFFECTS
     ============================================================ */
  // split big letters for playful hover
  $$(".mega-line").forEach((line) => {
    line.innerHTML = [...line.textContent].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join("");
  });

  // falling seasoning sprinkles
  if (!reduceMotion) {
    const sp = $("#sprinkles");
    const cols = ["#ffc61a", "#f26b1d", "#d6361f", "#5a8f2b", "#8f3412"];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.background = cols[i % cols.length];
      s.style.animationDuration = 9 + Math.random() * 10 + "s";
      s.style.animationDelay = -Math.random() * 15 + "s";
      s.style.transform = `scale(${0.6 + Math.random()})`;
      sp.appendChild(s);
    }
  }

  // tilt on hero box
  const heroArt = $(".hero-art");
  const heroBox = $("#heroBox");
  if (!reduceMotion && matchMedia("(pointer:fine)").matches) {
    heroArt.addEventListener("pointermove", (e) => {
      const r = heroArt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      heroBox.style.transform = `perspective(900px) rotateY(${x * 16}deg) rotateX(${-y * 12}deg) rotate(4deg) scale(1.02)`;
    });
    heroArt.addEventListener("pointerleave", () => { heroBox.style.transform = ""; });

    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  // mascot talks
  const mascot = $("#mascot"), bubble = $("#bubble");
  let lineIdx = 0, bubbleTimer;
  mascot.addEventListener("click", (e) => {
    lineIdx = (lineIdx + 1 + Math.floor(Math.random() * (MASCOT_LINES.length - 1))) % MASCOT_LINES.length;
    bubble.textContent = MASCOT_LINES[lineIdx];
    bubble.style.animation = "none"; void bubble.offsetWidth; bubble.style.animation = "";
    restart(bubble, "show");
    restart(mascot, "jump");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("show"), 2600);
    const r = mascot.getBoundingClientRect();
    confetti.burst(e.clientX || r.left + r.width / 2, e.clientY || r.top, 26);
    vibrate(15);
  });

  /* ============================================================
     COUNTDOWN to Kamis
     ============================================================ */
  function nextReady(now = new Date()) {
    const d = new Date(now);
    const isToday = d.getDay() === CONFIG.readyDay && d.getHours() < CONFIG.closeHour;
    if (isToday) { d.setHours(CONFIG.readyHour, 0, 0, 0); return { date: d, today: true }; }
    let add = (CONFIG.readyDay - d.getDay() + 7) % 7;
    if (add === 0) add = 7;
    d.setDate(d.getDate() + add);
    d.setHours(CONFIG.readyHour, 0, 0, 0);
    return { date: d, today: false };
  }
  const fmtDate = (d) => d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const cd = $("#countdown");
  function tickCountdown() {
    const { date, today } = nextReady();
    if (today) {
      cd.classList.add("today");
      $("#cdTitle").textContent = "🔥 Ready HARI INI! Buruan pesan";
      return;
    }
    cd.classList.remove("today");
    $("#cdTitle").textContent = "Ready " + date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
    let s = Math.max(0, Math.floor((date - new Date()) / 1000));
    const D = Math.floor(s / 86400); s %= 86400;
    const H = Math.floor(s / 3600); s %= 3600;
    const M = Math.floor(s / 60); const S = s % 60;
    $("#cdD").textContent = D;
    $("#cdH").textContent = String(H).padStart(2, "0");
    $("#cdM").textContent = String(M).padStart(2, "0");
    $("#cdS").textContent = String(S).padStart(2, "0");
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ============================================================
     BUILDER
     ============================================================ */
  const flavorsEl = $("#flavors"), packsEl = $("#packs");

  flavorsEl.innerHTML = FLAVORS.map((f) => `
    <button type="button" class="flavor" role="radio" data-id="${f.id}" style="--c:${f.color}" aria-checked="false">
      <span class="check" aria-hidden="true">✓</span>
      <span class="f-emoji" aria-hidden="true">${f.emoji}</span>
      <span class="f-name">${f.name}</span>
      <span class="f-desc">${f.desc}</span>
    </button>`).join("");

  packsEl.innerHTML = PACKS.map((p) => {
    const save = p.id !== "reg" ? `<span class="save">Paket hemat</span>` : "";
    return `
    <button type="button" class="pack" role="radio" data-id="${p.id}" aria-checked="false">
      <span class="p-ico" aria-hidden="true">${p.emoji}</span>
      <span class="p-txt"><b>${p.name}${save}</b><small>${p.sub}</small></span>
      <span class="p-price">${num(p.price)}</span>
      <span class="p-radio" aria-hidden="true"></span>
    </button>`;
  }).join("");

  function setRadio(group, id) {
    $$("[role=radio]", group).forEach((b) => {
      const on = b.dataset.id === id;
      b.setAttribute("aria-checked", on);
      b.tabIndex = on ? 0 : -1;
    });
  }
  // keyboard arrows for radio groups
  [flavorsEl, packsEl].forEach((group) => {
    group.addEventListener("keydown", (e) => {
      const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const items = $$("[role=radio]", group);
      const i = items.indexOf(document.activeElement);
      const n = items[(i + (keys.indexOf(e.key) < 2 ? 1 : -1) + items.length) % items.length];
      n.focus(); n.click();
    });
  });

  const preview = $("#preview"), stage = $(".preview-stage"), seasoning = $("#seasoning");

  function sprinkle(color) {
    if (reduceMotion) return;
    const cols = [color, "#ffc61a", "#5a8f2b", "#fff"];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement("i");
      p.style.left = 10 + Math.random() * 80 + "%";
      p.style.background = cols[i % cols.length];
      p.style.setProperty("--dx", (Math.random() - 0.5) * 80 + "px");
      p.style.animationDelay = Math.random() * 0.35 + "s";
      p.style.animationDuration = 0.8 + Math.random() * 0.6 + "s";
      seasoning.appendChild(p);
      setTimeout(() => p.remove(), 1800);
    }
  }

  function renderBuilder(animate = false) {
    const f = flavorById(state.flavor), p = packById(state.pack);
    setRadio(flavorsEl, f.id);
    setRadio(packsEl, p.id);
    preview.style.setProperty("--flavor", f.color);
    $("#ptEmoji").textContent = f.emoji;
    $("#ptName").textContent = f.name;
    $$("#spiceMeter i").forEach((el, i) => el.classList.toggle("on", i < f.spice));
    $("#spiceMeter").setAttribute("aria-label", `Level pedas ${f.spice} dari 4`);
    const ex = $("#previewExtra");
    if (p.extra) {
      if (ex.hidden || $("#peEmoji").textContent !== p.extra) { ex.hidden = false; $("#peEmoji").textContent = p.extra; ex.style.animation = "none"; void ex.offsetWidth; ex.style.animation = ""; }
    } else ex.hidden = true;
    $("#qty").textContent = state.qty;
    $("#lineTotal").textContent = rp(p.price * state.qty);
    if (animate) {
      restart($("#previewTag"), "swap");
      restart(stage, "shake");
      sprinkle(f.color);
    }
  }

  flavorsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".flavor"); if (!b) return;
    if (state.flavor === b.dataset.id) return;
    state.flavor = b.dataset.id; renderBuilder(true); vibrate(10);
  });
  packsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".pack"); if (!b) return;
    state.pack = b.dataset.id; renderBuilder(false); vibrate(10);
  });
  $("#qtyBox").addEventListener("click", (e) => {
    const b = e.target.closest(".qty-btn"); if (!b) return;
    state.qty = Math.min(50, Math.max(1, state.qty + Number(b.dataset.q)));
    renderBuilder(); restart($("#qty"), "tick"); vibrate(8);
  });

  $("#addBtn").addEventListener("click", (e) => {
    addToCart(state.flavor, state.pack, state.qty);
    flyToCart(e.currentTarget);
    const f = flavorById(state.flavor);
    toast(`${state.qty}× ${f.name} masuk keranjang! ${f.emoji}`);
    state.qty = 1; renderBuilder();
    vibrate([10, 40, 20]);
  });

  /* ============================================================
     CART
     ============================================================ */
  const saveCart = () => store.set("tw-cart", state.cart);
  const cartCount = () => state.cart.reduce((a, i) => a + i.qty, 0);
  const cartTotal = () => state.cart.reduce((a, i) => a + packById(i.pack).price * i.qty, 0);

  function addToCart(flavor, pack, qty) {
    const ex = state.cart.find((i) => i.flavor === flavor && i.pack === pack);
    if (ex) ex.qty = Math.min(99, ex.qty + qty);
    else state.cart.push({ flavor, pack, qty });
    saveCart(); renderCart(true);
  }

  function renderCart(bump = false) {
    const count = cartCount(), total = cartTotal();
    $("#cartCount").textContent = count;
    $("#bnCount").textContent = count;
    $("#bnTotal").textContent = count ? rp(total).replace("Rp", "") : "Keranjang";
    $("#drawerCount").textContent = count ? `(${count} boks)` : "";
    $("#subtotal").textContent = rp(total);
    if (bump) { restart($("#cartCount"), "bump"); restart($("#bnCart"), "bump"); }

    const list = $("#cartList");
    list.innerHTML = state.cart.map((it, idx) => {
      const f = flavorById(it.flavor), p = packById(it.pack);
      return `
      <li class="c-item" data-idx="${idx}">
        <div class="c-thumb" style="background:${f.color}"><img src="assets/img/box.webp" alt="" loading="lazy" /><span>${f.emoji}</span></div>
        <div class="c-info">
          <b>${f.name}</b>
          <small>${p.name}</small>
          <span class="c-price">${rp(p.price * it.qty)}</span>
        </div>
        <div class="c-ctrl">
          <div class="mini-qty">
            <button type="button" data-act="dec" aria-label="Kurangi ${f.name}">−</button>
            <span>${it.qty}</span>
            <button type="button" data-act="inc" aria-label="Tambah ${f.name}">+</button>
          </div>
          <button type="button" class="c-del" data-act="del">Hapus</button>
        </div>
      </li>`;
    }).join("");
    $("#cartEmpty").hidden = state.cart.length > 0;
    $("#drawerFoot").hidden = state.cart.length === 0 && currentView !== "done";

    const hint = $("#sumHint");
    const regCount = state.cart.filter((i) => i.pack === "reg").reduce((a, i) => a + i.qty, 0);
    hint.textContent = !count ? "" :
      regCount ? `💡 Tambah minum cuma +Rp2.000 per boks, upgrade ke paket!` :
      count >= 3 ? `🔥 Mantap, ${count} boks! Ajak temen sekelas sekalian.` : `📅 Pesanan diambil ${nextReady().today ? "hari ini" : "Kamis"}.`;
  }

  $("#cartList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const li = b.closest(".c-item"); const idx = Number(li.dataset.idx); const it = state.cart[idx];
    const act = b.dataset.act;
    if (act === "inc") it.qty = Math.min(99, it.qty + 1);
    if (act === "dec") it.qty -= 1;
    if (act === "del" || it.qty <= 0) {
      li.classList.add("out");
      setTimeout(() => { state.cart.splice(idx, 1); saveCart(); renderCart(true); }, reduceMotion ? 0 : 320);
      vibrate(20);
      return;
    }
    saveCart(); renderCart(true);
  });

  function flyToCart(fromEl) {
    if (reduceMotion) return;
    const target = getComputedStyle($(".bottomnav")).display !== "none" ? $("#bnCart") : $("#cartBtn");
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "flyer-dot";
    dot.innerHTML = `<img src="assets/img/box.webp" alt="">`;
    dot.style.left = a.left + a.width / 2 - 27 + "px";
    dot.style.top = a.top + a.height / 2 - 27 + "px";
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    dot.animate([
      { transform: "translate(0,0) scale(1) rotate(0)" },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 140}px) scale(1.3) rotate(180deg)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.3) rotate(360deg)`, opacity: 0.6 },
    ], { duration: 800, easing: "cubic-bezier(.5,0,.5,1)" }).onfinish = () => dot.remove();
  }

  /* ============================================================
     DRAWER + CHECKOUT
     ============================================================ */
  const drawer = $("#drawer"), scrim = $("#scrim");
  let currentView = "cart", lastFocus = null, lastWaUrl = "";

  function setView(v) {
    currentView = v;
    $("#viewCart").hidden = v !== "cart";
    $("#checkoutForm").hidden = v !== "checkout";
    $("#viewDone").hidden = v !== "done";
    $("#checkoutBtn").hidden = v !== "cart";
    $("#sendBtn").hidden = v !== "checkout";
    $("#drawerFoot").hidden = v === "done" || (v === "cart" && state.cart.length === 0);
    $(".drawer-head h2").firstChild.textContent = v === "checkout" ? "Checkout " : v === "done" ? "Berhasil " : "Keranjang ";
    $(".drawer-body").scrollTop = 0;
  }

  function openDrawer(view = "cart") {
    lastFocus = document.activeElement;
    setView(view);
    scrim.hidden = false;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => drawer.focus(), 50);
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    scrim.hidden = true;
    document.body.style.overflow = "";
    if (currentView === "done") setView("cart");
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  $("#cartBtn").addEventListener("click", () => openDrawer());
  $("#bnCart").addEventListener("click", () => openDrawer());
  $("#closeDrawer").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer(); });
  drawer.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeDrawer(); });

  // swipe down to close (mobile)
  let startY = null;
  drawer.addEventListener("touchstart", (e) => { if ($(".drawer-body").scrollTop <= 0) startY = e.touches[0].clientY; }, { passive: true });
  drawer.addEventListener("touchmove", (e) => {
    if (startY == null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0 && innerWidth < 900) drawer.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  drawer.addEventListener("touchend", (e) => {
    if (startY == null) return;
    const dy = e.changedTouches[0].clientY - startY;
    drawer.style.transform = "";
    startY = null;
    if (dy > 120 && innerWidth < 900) closeDrawer();
  });

  // slots
  $("#slots").innerHTML = CONFIG.slots.map((s, i) =>
    `<label><input type="radio" name="slot" value="${s}" ${i === 1 ? "checked" : ""} /><span>${s}</span></label>`).join("");

  const form = $("#checkoutForm");
  const F = form.elements;
  const profile = store.get("tw-profile", {});
  if (profile.name) F.cname.value = profile.name;
  if (profile.phone) F.phone.value = profile.phone;

  form.addEventListener("change", (e) => {
    if (e.target.name === "cmethod") $("#roomField").hidden = F.cmethod.value !== "deliver";
  });
  form.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("invalid"));
  form.addEventListener("submit", (e) => { e.preventDefault(); submitOrder(); });

  $("#checkoutBtn").addEventListener("click", () => setView("checkout"));
  $("#backToCart").addEventListener("click", () => setView("cart"));
  $("#sendBtn").addEventListener("click", submitOrder);
  $("#doneClose").addEventListener("click", closeDrawer);

  function validate() {
    let ok = true;
    const mark = (input, bad) => { input.closest(".field").classList.toggle("invalid", bad); if (bad && ok) input.focus(); if (bad) ok = false; };
    mark(F.cname, F.cname.value.trim().length < 2);
    const digits = F.phone.value.replace(/\D/g, "");
    mark(F.phone, digits.length < 9 || digits.length > 15);
    if (F.cmethod.value === "deliver") mark(F.room, F.room.value.trim().length < 2);
    return ok;
  }

  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = ""; for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return "TW-" + c;
  }

  function buildMessage(o) {
    const lines = o.items.map((it, i) => {
      const f = flavorById(it.flavor), p = packById(it.pack);
      return `${i + 1}. ${it.qty}× *${f.name}* — ${p.name} (@${num(p.price)}) = ${num(p.price * it.qty)}`;
    });
    const method = o.method === "deliver" ? `Antar ke kelas: ${o.room}` : `Ambil di kampus (${CONFIG.pickupPlace})`;
    return [
      `Halo kak Anarta! Saya mau pesan *Tahu Walik* 🔥`,
      ``,
      `🧾 *Kode:* ${o.code}`,
      `👤 *Nama:* ${o.name}`,
      `📱 *WA:* ${o.phone}`,
      `📅 *Tanggal:* ${o.dateLabel}`,
      `⏰ *Jam:* ${o.slot}`,
      `📍 *Metode:* ${method}`,
      `💳 *Bayar:* ${o.pay}`,
      ``,
      `*Pesanan:*`,
      ...lines,
      ``,
      `*Total: ${rp(o.total)}* (${o.count} boks)`,
      o.note ? `\n📝 Catatan: ${o.note}` : ``,
      `Terima kasih! 🙏`,
    ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
  }

  function submitOrder() {
    if (!state.cart.length) { setView("cart"); return; }
    if (!validate()) { vibrate([30, 30, 30]); toast("Cek lagi datanya ya 🙏"); return; }
    const { date } = nextReady();
    const order = {
      code: makeCode(),
      createdAt: Date.now(),
      name: F.cname.value.trim(),
      phone: F.phone.value.trim(),
      method: F.cmethod.value,
      room: F.room.value.trim(),
      slot: F.slot.value,
      pay: F.pay.value,
      note: F.note.value.trim(),
      dateLabel: fmtDate(date),
      items: state.cart.map((i) => ({ ...i })),
      count: cartCount(),
      total: cartTotal(),
    };
    const msg = buildMessage(order);
    lastWaUrl = `https://wa.me/${CONFIG.waNumber}?text=${encodeURIComponent(msg)}`;

    store.set("tw-profile", { name: order.name, phone: order.phone });
    state.history.unshift(order);
    state.history = state.history.slice(0, 20);
    store.set("tw-history", state.history);
    state.cart = [];
    saveCart();

    $("#orderCode").textContent = order.code;
    $("#waAgain").href = lastWaUrl;
    renderCart();
    renderHistory();
    setView("done");
    F.note.value = "";

    window.open(lastWaUrl, "_blank", "noopener");
    confetti.rain();
    vibrate([20, 60, 20, 60, 40]);
  }

  /* ============================================================
     HISTORY
     ============================================================ */
  function renderHistory() {
    const el = $("#historyList");
    if (!state.history.length) {
      el.innerHTML = `<div class="h-empty"><span>🧾</span>Belum ada pesanan. Yuk, pesan boks pertamamu!</div>`;
      return;
    }
    el.innerHTML = state.history.map((o, idx) => `
      <article class="h-card">
        <div class="h-top">
          <span class="h-code">${o.code}</span>
          <span class="h-date">${new Date(o.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ambil ${o.slot}</span>
        </div>
        <ul class="h-items">${o.items.map((it) => {
          const f = flavorById(it.flavor), p = packById(it.pack);
          return `<li>${f.emoji} ${it.qty}× ${f.name} · ${p.name}</li>`;
        }).join("")}</ul>
        <div class="h-bottom">
          <span class="h-total">${rp(o.total)}</span>
          <button class="btn btn-primary btn-sm" data-reorder="${idx}">🔁 Pesan lagi</button>
        </div>
      </article>`).join("");
  }
  $("#historyList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-reorder]"); if (!b) return;
    const o = state.history[Number(b.dataset.reorder)];
    o.items.forEach((it) => addToCart(it.flavor, it.pack, it.qty));
    toast("Pesanan lama dimasukin lagi ke keranjang 🛒");
    openDrawer("cart");
  });

  /* ============================================================
     SPIN WHEEL
     ============================================================ */
  const modal = $("#spinModal"), wheel = $("#wheel");
  const seg = 360 / FLAVORS.length;
  wheel.style.background = `conic-gradient(${FLAVORS.map((f, i) => `${f.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(",")})`;
  wheel.innerHTML = FLAVORS.map((f, i) =>
    `<div class="slice" style="transform:rotate(${i * seg + seg / 2}deg)"><span><em>${f.emoji}</em>${f.name}</span></div>`).join("");
  let wheelRot = 0, spinPick = null;

  $("#spinOpen").addEventListener("click", () => {
    $("#spinResult").innerHTML = "&nbsp;"; $("#spinUse").hidden = true;
    if (modal.showModal) modal.showModal(); else modal.setAttribute("open", "");
  });
  $("#spinClose").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  $("#spinGo").addEventListener("click", (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    $("#spinUse").hidden = true; $("#spinResult").textContent = "Muter… 🌀";
    const k = Math.floor(Math.random() * FLAVORS.length);
    const center = k * seg + seg / 2;
    const jitter = (Math.random() - 0.5) * (seg * 0.6);
    const base = Math.ceil(wheelRot / 360) * 360;
    wheelRot = base + 360 * 5 + (360 - center) + jitter;
    wheel.style.transform = `rotate(${wheelRot}deg)`;
    const done = () => {
      spinPick = FLAVORS[k];
      const r = $("#spinResult");
      r.textContent = `${spinPick.emoji} ${spinPick.name}!`;
      restart(r, "win");
      $("#spinUse").hidden = false;
      btn.disabled = false;
      const wr = wheel.getBoundingClientRect();
      confetti.burst(wr.left + wr.width / 2, wr.top + wr.height / 2, 60);
      vibrate([20, 40, 60]);
    };
    if (reduceMotion) done(); else setTimeout(done, 4300);
  });
  $("#spinUse").addEventListener("click", () => {
    if (!spinPick) return;
    state.flavor = spinPick.id; modal.close();
    location.hash = "#order";
    $("#order").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    setTimeout(() => renderBuilder(true), 500);
  });

  /* ============================================================
     NAV, REVEAL, TOAST
     ============================================================ */
  const topbar = $("#topbar");
  addEventListener("scroll", () => topbar.classList.toggle("scrolled", scrollY > 10), { passive: true });

  const navLinks = $$("[data-nav]");
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.dataset.nav === en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["home", "order", "history", "info"].forEach((id) => sectionIO.observe(document.getElementById(id)));

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); } });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el) => revealIO.observe(el));

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* ============================================================
     CONFETTI (tiny canvas engine)
     ============================================================ */
  const confetti = (() => {
    const c = $("#confetti"), ctx = c.getContext("2d");
    let parts = [], raf = null;
    const cols = ["#ffc61a", "#f26b1d", "#d6361f", "#8f3412", "#1fa855", "#fff4db"];
    const shapes = ["rect", "circle", "emoji"];
    const emojis = ["🌶️", "🌽", "🔥", "🍖", "⭐"];
    const resize = () => { const d = devicePixelRatio || 1; c.width = innerWidth * d; c.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize(); addEventListener("resize", resize);
    function spawn(x, y, vx, vy) {
      const shape = shapes[Math.random() < 0.15 ? 2 : Math.floor(Math.random() * 2)];
      parts.push({ x, y, vx, vy, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        col: cols[Math.floor(Math.random() * cols.length)], shape, emoji: emojis[Math.floor(Math.random() * emojis.length)], life: 0 });
    }
    function loop() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.vy += 0.18; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - p.life / 220);
        if (p.shape === "emoji") { ctx.font = `${p.r * 3.2}px serif`; ctx.fillText(p.emoji, -p.r, p.r); }
        else { ctx.fillStyle = p.col; if (p.shape === "rect") ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.4, 0, 7); ctx.fill(); } }
        ctx.restore();
      });
      parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 220);
      if (parts.length) raf = requestAnimationFrame(loop); else { raf = null; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
    return {
      burst(x, y, n = 40) {
        if (reduceMotion) return;
        for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 7; spawn(x, y, Math.cos(a) * s, Math.sin(a) * s - 4); }
        start();
      },
      rain() {
        if (reduceMotion) return;
        for (let i = 0; i < 160; i++) spawn(Math.random() * innerWidth, -20 - Math.random() * innerHeight * 0.5, (Math.random() - 0.5) * 3, Math.random() * 3);
        start();
      },
    };
  })();

  /* ============================================================
     PWA
     ============================================================ */
  let deferredPrompt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; $("#installBtn").hidden = false; });
  $("#installBtn").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $("#installBtn").hidden = true;
  });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // ---------- Init ----------
  $("#year").textContent = new Date().getFullYear();
  renderBuilder();
  renderCart();
  renderHistory();
  if (location.hash === "#cart") openDrawer();
})();
