// ===========================
// script.js - UBT App (WebView Submit Fix - Beacon + Keepalive + Delay)
// ===========================

let questions = [];
let answered = JSON.parse(localStorage.getItem("answered") || "{}");
let currentIndex = 0;

const paket = localStorage.getItem("paket") || "1";
const soalURL = `https://airnetcso.github.io/ubt/soal/soal${paket}.json?v=13`;

// Google Sheet UBT
const SPREADSHEET_URL = "https://script.google.com/macros/s/AKfycbzxyVIlsyLswlfnQG618eeUZgN83dd2jfCjU0r7LsNHM3A6NNiibuCIb5e3CNs9J1vVhQ/exec";

// ===========================
// Kirim skor (sendBeacon utama + fetch keepalive fallback)
// ===========================
function sendScoreToSheet(username, paket, score) {
    console.log("🔥 Kirim skor UBT...");

    const totalSoal = questions.length || 40;
    const maxScore = totalSoal * 2.5;
    const persentase = Math.round((score / maxScore) * 100);

    const key = "ubt_sent_" + username + "_p" + paket + "_s" + score;
    if (localStorage.getItem(key) === "sent") {
        console.log("✅ Sudah dikirim, skip.");
        return true;
    }

    const data = new URLSearchParams({
        waktu: new Date().toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'}),
        namaSiswa: username || "Anonymous",
        code: "UBT TRYOUT " + paket,
        kosaKata: "-",
        ubt: `${score}/${maxScore} (${persentase}%)`,
        latihanSoal: "-",
        keterangan: score >= 80 ? "Lulus P" + paket : "Gagal <80"
    });

    let queued = false;

    // 1. Priority: sendBeacon (best for unload/background)
    if (navigator.sendBeacon) {
        const sent = navigator.sendBeacon(SPREADSHEET_URL, data);
        if (sent) {
            console.log("✅ sendBeacon queued (return true) → browser tanggung jawab kirim");
            queued = true;
        } else {
            console.warn("⚠️ sendBeacon return false");
        }
    }

    // 2. Fallback: fetch dengan keepalive (untuk WebView yang support)
    if (!queued) {
        fetch(SPREADSHEET_URL, {
            method: "POST",
            body: data,
            keepalive: true,
            mode: "no-cors",          // Hindari CORS block di WebView
            credentials: "omit"
        }).then(response => {
            console.log("✅ fetch keepalive dipanggil");
            queued = true;
        }).catch(e => {
            console.error("❌ fetch keepalive error:", e);
        });
    }

    if (queued) {
        localStorage.setItem(key, "sent");
    }

    return queued;
}

// ... (loadSoal, buildGrid, loadQuestionPage, next/prev/back, timer, manualSubmit, calculateScore tetap sama seperti versi sebelumnya)

// ===========================
// Finish Exam (loading lama + beacon + visibility listener)
// ===========================
function finish() {
    console.log("🎉 SUBMIT UBT!");

    const score = calculateScore();
    console.log("🏆 SKOR AKHIR:", score);

    const user = localStorage.getItem("user") || "Anonymous";
    const results = JSON.parse(localStorage.getItem("results") || "[]");
    results.push({ name: user, paket, score, time: document.getElementById("timerBox")?.innerText || "00:00", date: new Date().toLocaleString("id-ID") });
    localStorage.setItem("results", JSON.stringify(results));

    // Ganti body jadi loading screen
    document.body.innerHTML = `
        <div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#000; color:#fff; text-align:center; padding:20px;">
            <h2>Sedang Mengirim Skor...</h2>
            <p>Jangan tutup aplikasi atau matikan HP selama proses ini!<br>(Tunggu 5-10 detik)</p>
            <div id="status" style="margin:20px; font-size:18px;">Mengirim data ke pusat...</div>
            <progress style="width:80%;"></progress>
        </div>
    `;

    const status = document.getElementById("status");

    // Kirim sekarang
    const queued = sendScoreToSheet(user, paket, score);
    status.textContent = queued ? "Data di-queue (akan terkirim otomatis)..." : "Mengirim via fallback...";

    // Listener: kirim ulang kalau app di-background (penting di Android)
    const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            sendScoreToSheet(user, paket, score);
            console.log("App background → kirim ulang beacon/fetch");
        }
    };
    document.addEventListener('visibilitychange', onVisibilityChange, {once: true});

    // Delay panjang biar WebView punya waktu kirim (5 detik minimal, bisa naik ke 8000 kalau masih gagal)
    setTimeout(() => {
        // Simpan sent keys dulu
        const sentKeys = {};
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith("ubt_sent_")) sentKeys[k] = localStorage.getItem(k);
        });
        localStorage.clear();
        Object.keys(sentKeys).forEach(k => localStorage.setItem(k, sentKeys[k]));

        alert(`Ujian selesai!\nNilai Anda: ${score.toFixed(1)}\nData telah/akan dikirim ke pusat! 🎉`);
        location.href = "index.html";
    }, 6000);  // 6 detik - aman di kebanyakan WebView
}

// ===========================
// Init
// ===========================
window.onload = async () => {
    console.log("🚀 UBT App mulai...");
    await loadSoal();

    const userEl = document.getElementById("user");
    if (userEl) {
        userEl.innerText = (localStorage.getItem("user") || "User") + " - TRYOUT " + paket;
    }
};
