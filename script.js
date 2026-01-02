let questions = [];
let answered = JSON.parse(localStorage.getItem("answered") || "{}");
let currentIndex = 0;

const paket = localStorage.getItem("paket") || "1";
const SOAL_URL = `https://airnetcso.github.io/ubt/soal/soal${paket}.json`;

/* LOAD SOAL */
async function loadSoal(){
  const res = await fetch(SOAL_URL);
  questions = await res.json();
  buildGrid();
}

/* DASHBOARD GRID */
function buildGrid(){
  const L = document.getElementById("listen");
  const R = document.getElementById("read");
  if(!L || !R) return;

  L.innerHTML = "";
  R.innerHTML = "";

  questions.forEach((q,i)=>{
    const box = document.createElement("div");
    box.className="qbox";
    box.textContent=q.id;

    if(answered[q.id]) box.classList.add("done");

    box.onclick=()=>{
      localStorage.setItem("currentIndex",i);
      location.href="question.html";
    };

    q.type==="listening" ? L.appendChild(box) : R.appendChild(box);
  });
}

/* HALAMAN SOAL */
function loadQuestionPage(){
  const qBox=document.getElementById("questionBox");
  const ans=document.getElementById("answers");
  if(!qBox||!ans) return;

  currentIndex = Number(localStorage.getItem("currentIndex")||0);
  const q=questions[currentIndex];
  if(!q) return;

  qBox.innerHTML="";
  ans.innerHTML="";

  const h=document.createElement("h3");
  h.textContent=`${q.id}. ${q.question.split("\n")[0]}`;
  qBox.appendChild(h);

  if(q.audio){
    const a=document.createElement("audio");
    a.src=q.audio;
    a.controls=true;
    a.load(); // 🔥 FIX AUDIO
    qBox.appendChild(a);
  }

  if(q.image){
    const img=document.createElement("img");
    img.src=q.image;
    qBox.appendChild(img);
  }

  q.options.forEach((opt,i)=>{
    const row=document.createElement("div");
    const b=document.createElement("button");
    b.textContent=i+1;
    if(answered[q.id]==i+1) b.classList.add("selected");

    b.onclick=()=>{
      answered[q.id]=i+1;
      localStorage.setItem("answered",JSON.stringify(answered));
      ans.querySelectorAll("button").forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
    };

    row.append(b,opt);
    ans.appendChild(row);
  });
}

/* NAV */
function nextQuestion(){
  if(currentIndex<questions.length-1){
    localStorage.setItem("currentIndex",currentIndex+1);
    loadQuestionPage();
  }
}
function prevQuestion(){
  if(currentIndex>0){
    localStorage.setItem("currentIndex",currentIndex-1);
    loadQuestionPage();
  }
}
function back(){ location.href="dashboard.html"; }

/* SCORE */
function calculateScore(){
  let s=0;
  questions.forEach(q=>{
    if(answered[q.id]==q.answer) s+=2.5;
  });
  return s;
}

function finish(){
  const score=calculateScore();
  const results=JSON.parse(localStorage.getItem("results")||"[]");
  const progress=JSON.parse(localStorage.getItem("progress")||"{}");

  progress[paket]=score;

  results.push({
    name:localStorage.getItem("user"),
    paket:`Paket ${paket}`,
    score,
    time:document.getElementById("timerBox")?.innerText,
    date:new Date().toLocaleString()
  });

  localStorage.setItem("results",JSON.stringify(results));
  localStorage.setItem("progress",JSON.stringify(progress));

  localStorage.removeItem("answered");
  localStorage.removeItem("currentIndex");
  location.href="index.html";
}

window.onload=async()=>{
  await loadSoal();
  loadQuestionPage();
};
