let questions = [];
let answered = JSON.parse(localStorage.getItem("answered") || "{}");
let currentIndex = 0;

const paket = localStorage.getItem("paket") || "1";
const soalURL = `https://airnetcso.github.io/ubt/soal/soal${paket}.json?v=13`;

// URL Google Sheet UBT (WA baru yang kamu kasih)
const SPREADSHEET_URL = "https://script.google.com/macros/s/AKfycbzxyVIlsyLswlfnQG618eeUZgN83dd2jfCjU0r7LsNHM3A6NNiibuCIb5e3CNs9J1vVhQ/exec";

// FUNGSI KIRIM SKOR UBT (FINAL - POST no-cors tanpa fallback biar nggak double)
function sendScoreToSheet(username, paket, score) {
  console.log("🔥 Kirim skor UBT - POST no-cors SAFE FINAL");

  const totalSoal = questions.length || 40;
  const maxScore = totalSoal * 2.5;
  const persentase = Math.round((score / maxScore) * 100);

  // Anti duplicate
  const key = "ubt_sent_" + username + "_p" + paket + "_s" + score;
  if (localStorage.getItem(key) === "sent") {
    console.log("✅ Skor sudah dikirim.");
    return;
  }
  localStorage.setItem(key, "sent");

  const dataToSend = {
    waktu: new Date().toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'}),
    namaSiswa: username || "Anonymous",
    code: "UBT TRYOUT " + paket,
    kosaKata: "-",
    ubt: `${score}/${maxScore} (${persentase}%)`,
    latihanSoal: "-",
    keterangan: score >= 80 ? "Lulus P" + paket : "Gagal <80"
  };

  console.log("Data kirim:", dataToSend);

  const formData = new URLSearchParams(dataToSend);

  // POST no-cors + keepalive (request tetep jalan meski redirect)
  fetch(SPREADSHEET_URL, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    body: formData,
    redirect: "follow"
  })
  .then(() => {
    console.log("✅ POST sukses (no-cors - opaque OK)");
  })
  .catch(err => {
    console.error("Gagal POST:", err);
    // TIDAK ADA fallback beacon atau window.open lagi → nggak double Anonymous
  });
}

// SEMUA FUNGSI LAIN TETAP SAMA PERSIS
async function loadSoal() {
  try {
    const res = await fetch(soalURL);
    if (!res.ok) throw new Error("Gagal load soal");
    questions = await res.json();
    console.log("✅ Soal loaded:", questions.length, "soal");

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";

    buildGrid();
  } catch (e) {
    console.error("❌ Error load soal:", e);
    alert("Gagal memuat soal. Refresh halaman.");
  }
}

function buildGrid() {
  const L = document.getElementById("listen");
  const R = document.getElementById("read");
  if (!L || !R) return;
  L.innerHTML = ""; R.innerHTML = "";

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

function loadQuestionPage() {
  const box = document.getElementById("questionBox");
  const ans = document.getElementById("answers");
  if (!box || !ans || questions.length === 0) return;

  const id = Number(localStorage.getItem("current")) || questions[0].id;
  const idx = questions.findIndex(q => q.id === id);
  currentIndex = idx < 0 ? 0 : idx;
  const q = questions[currentIndex];

  box.innerHTML = ""; ans.innerHTML = "";

  const h = document.createElement("h3");
  h.textContent = `${q.id}. ${q.question.split("\n\n")[0]}`;
  box.appendChild(h);

  if (q.question.includes("\n\n")) {
    const d = document.createElement("div");
    d.className = "dialog-box" + (q.id === 37 || q.id === 38 ? " dialog-center" : "");
    d.textContent = q.question.split("\n\n").slice(1).join("\n\n");
    box.appendChild(d);
  }

  if (q.audio) {
    const container = document.createElement("div");
    container.style.margin = "25px 0"; container.style.textAlign = "center";
    const audio = document.createElement("audio");
    audio.controls = true; audio.preload = "auto"; audio.src = q.audio;
    audio.style.width = "100%"; audio.style.maxWidth = "420px"; audio.style.margin = "0 auto";
    container.appendChild(audio); box.appendChild(container);
  }

  if (q.image) {
    const i = document.createElement("img");
    i.src = q.image; i.style.maxWidth = "100%"; i.style.margin = "20px auto"; i.style.display = "block";
    box.appendChild(i);
  }

  q.options.forEach((option, i) => {
    const b = document.createElement("button");
    b.textContent = i + 1;
    if (answered[q.id] === i + 1) b.classList.add("selected");
    b.onclick = () => {
      answered[q.id] = i + 1;
      localStorage.setItem("answered", JSON.stringify(answered));
      buildGrid(); loadQuestionPage();
    };

    const row = document.createElement("div");
    row.style.display = "flex"; row.style.alignItems = "center"; row.style.gap = "12px"; row.style.margin = "12px 0";
    row.appendChild(b);
    const text = document.createElement("span"); text.textContent = option;
    row.appendChild(text); ans.appendChild(row);
  });
}

function nextQuestion() { if (currentIndex + 1 < questions.length) { localStorage.setItem("current", questions[currentIndex + 1].id); loadQuestionPage(); } }
function prevQuestion() { if (currentIndex > 0) { localStorage.setItem("current", questions[currentIndex - 1].id); loadQuestionPage(); } }
function back() { localStorage.removeItem("time"); location.href = "dashboard.html"; }

let time = Number(localStorage.getItem("time")) || 50 * 60;
setInterval(() => {
  if (time <= 0) { finish(); return; }
  time--;
  localStorage.setItem("time", time);
  const t = document.getElementById("timerBox");
  if (t) t.textContent = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}, 1000);

function manualSubmit() {
  if (questions.length === 0) {
    alert("Soal belum dimuat! Tunggu grid muncul dulu.");
    return;
  }
  if (confirm("Yakin submit sekarang?")) finish();
}

function calculateScore() {
  if (questions.length === 0) return 0;
  let correct = 0;
  questions.forEach(q => { if (answered[q.id] === q.answer) correct++; });
  console.log(`Jawaban benar: ${correct} dari ${questions.length}`);
  return correct * 2.5;
}

function finish() {
  console.log("🎉 SUBMIT! Hitung skor...");

  if (questions.length === 0) {
    alert("Error: Soal tidak terload. Refresh halaman.");
    return;
  }

  const score = calculateScore();
  console.log("🏆 SKOR AKHIR:", score);

  const user = localStorage.getItem("user");
  const results = JSON.parse(localStorage.getItem("results") || "[]");
  results.push({ name: user, paket, score, time: document.getElementById("timerBox")?.innerText || "00:00", date: new Date().toLocaleString("id-ID") });
  localStorage.setItem("results", JSON.stringify(results));

  sendScoreToSheet(user, paket, score);

  localStorage.clear();

  alert(`Ujian selesai!\nNilai Anda: ${score}\nData sudah dikirim ke pusat! 🎉`);
  location.href = "index.html";
}

window.onload = async () => {
  console.log("🚀 UBT App mulai...");
  await loadSoal();
  if (document.getElementById("listen")) buildGrid();
  if (document.getElementById("questionBox")) loadQuestionPage();
};
