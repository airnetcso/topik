let questions = [];
let answered = JSON.parse(localStorage.getItem("answered") || "{}");
let currentIndex = 0;

const paket = localStorage.getItem("paket") || "1";
const soalURL = `https://airnetcso.github.io/ubt/soal/soal${paket}.json`;

/* ================= LOAD SOAL ================= */
async function loadSoal() {
  try {
    const res = await fetch(soalURL);
    if (!res.ok) throw new Error("Gagal memuat soal");
    questions = await res.json();
    buildGrid();
  } catch (e) {
    console.error(e);
    alert("Gagal memuat soal. Periksa koneksi internet Anda.");
  }
}

/* ================= DASHBOARD GRID ================= */
function buildGrid() {
  const L = document.getElementById("listen");
  const R = document.getElementById("read");
  if (!L || !R) return;

  L.innerHTML = "";
  R.innerHTML = "";

  questions.forEach(q => {
    const box = document.createElement("div");
    box.className = "qbox";
    box.textContent = q.id;
    if (answered[q.id]) box.classList.add("done");
    box.onclick = () => {
      localStorage.setItem("current", q.id);
      location.href = "question.html";
    };
    (q.type === "listening" ? L : R).appendChild(box);
  });
}

/* ================= QUESTION PAGE ================= */
function loadQuestionPage() {
  const box = document.getElementById("questionBox");
  const ans = document.getElementById("answers");
  if (!box || !ans) return;

  const id = Number(localStorage.getItem("current"));
  const idx = questions.findIndex(q => q.id === id);
  currentIndex = idx < 0 ? 0 : idx;
  const q = questions[currentIndex];

  box.innerHTML = "";
  ans.innerHTML = "";

  // Judul soal
  const h = document.createElement("h3");
  h.textContent = `${q.id}. ${q.question.split("\n\n")[0]}`;
  box.appendChild(h);

  // Dialog / teks tambahan
  if (q.question.includes("\n\n")) {
    const d = document.createElement("div");
    d.className = "dialog-box";
    if (q.id === 37 || q.id === 38) d.classList.add("dialog-center");
    d.textContent = q.question.split("\n\n").slice(1).join("\n\n");
    box.appendChild(d);
  }

  // AUDIO PLAYER – HANYA PLAYER STANDAR DENGAN CONTROLS (USER KLIK ▶ SENDIRI)
  if (q.audio) {
    const container = document.createElement("div");
    container.style.margin = "25px 0";
    container.style.textAlign = "center";

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "auto";
    audio.src = q.audio;
    audio.style.width = "100%";
    audio.style.maxWidth = "420px";
    audio.style.display = "block";
    audio.style.margin = "0 auto";

    container.appendChild(audio);
    box.appendChild(container);
  }

  // Gambar
  if (q.image) {
    const i = document.createElement("img");
    i.src = q.image;
    i.style.maxWidth = "100%";
    i.style.height = "auto";
    i.style.display = "block";
    i.style.margin = "20px auto";
    box.appendChild(i);
  }

  // Pilihan jawaban
  q.options.forEach((option, i) => {
    const b = document.createElement("button");
    b.textContent = i + 1;
    if (answered[q.id] === i + 1) b.classList.add("selected");

    b.onclick = () => {
      answered[q.id] = i + 1;
      localStorage.setItem("answered", JSON.stringify(answered));
      buildGrid(); // update grid kalau balik ke dashboard
      loadQuestionPage(); // refresh tampilan
    };

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "12px";
    row.style.margin = "12px 0";

    row.appendChild(b);
    const text = document.createElement("span");
    text.textContent = option;
    row.appendChild(text);
    ans.appendChild(row);
  });
}

/* ================= NAVIGASI ================= */
function nextQuestion() {
  if (currentIndex + 1 < questions.length) {
    localStorage.setItem("current", questions[currentIndex + 1].id);
    loadQuestionPage();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    localStorage.setItem("current", questions[currentIndex - 1].id);
    loadQuestionPage();
  }
}

function back() {
  localStorage.removeItem("time");
  location.href = "dashboard.html";
}

/* ================= TIMER ================= */
let time = Number(localStorage.getItem("time")) || 50 * 60;
setInterval(() => {
  if (time <= 0) {
    finish();
    return;
  }
  time--;
  localStorage.setItem("time", time);
  const t = document.getElementById("timerBox");
  if (t) {
    const m = String(Math.floor(time / 60)).padStart(2, "0");
    const s = String(time % 60).padStart(2, "0");
    t.textContent = `${m}:${s}`;
  }
}, 1000);

/* ================= SUBMIT ================= */
function manualSubmit() {
  if (confirm("Yakin ingin submit sekarang?")) {
    finish();
  }
}

function calculateScore() {
  let correct = 0;
  questions.forEach(q => {
    if (answered[q.id] === q.answer) correct++;
  });
  return correct * 2.5;
}

function finish() {
  const score = calculateScore();

  const results = JSON.parse(localStorage.getItem("results") || "[]");
  results.push({
    name: localStorage.getItem("user"),
    paket: `Paket ${paket}`,
    score: score,
    time: document.getElementById("timerBox")?.innerText || "00:00",
    date: new Date().toLocaleString("id-ID")
  });
  localStorage.setItem("results", JSON.stringify(results));

  // Bersihkan data sementara
  localStorage.removeItem("login");
  localStorage.removeItem("user");
  localStorage.removeItem("paket");
  localStorage.removeItem("answered");
  localStorage.removeItem("time");
  localStorage.removeItem("current");

  alert(`Ujian selesai!\nNilai Anda: ${score}`);
  location.href = "index.html";
}

/* ================= INIT ================= */
window.onload = async () => {
  await loadSoal();

  // Dashboard
  if (document.getElementById("listen")) {
    buildGrid();
  }

  // Halaman soal
  if (document.getElementById("questionBox")) {
    loadQuestionPage();
  }
};
