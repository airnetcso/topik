let questions=[];
let answered=JSON.parse(localStorage.getItem("answered")||"{}");
let currentIndex=0;

const paket=localStorage.getItem("paket")||"1";
const soalURL=`https://airnetcso.github.io/ubt/soal/soal${paket}.json`;

/* ================= LOAD SOAL ================= */
async function loadSoal(){
  const res=await fetch(soalURL);
  questions=await res.json();
  buildGrid();
}

/* ================= DASHBOARD GRID ================= */
function buildGrid(){
  const L=document.getElementById("listen");
  const R=document.getElementById("read");
  if(!L||!R) return;

  L.innerHTML=""; R.innerHTML="";
  questions.forEach(q=>{
    const box=document.createElement("div");
    box.className="qbox";
    box.textContent=q.id;
    if(answered[q.id]) box.classList.add("done");
    box.onclick=()=>{
      localStorage.setItem("current",q.id);
      location.href="question.html";
    };
    (q.type==="listening"?L:R).appendChild(box);
  });
}

/* ================= QUESTION PAGE ================= */
function loadQuestionPage(){
  const box=document.getElementById("questionBox");
  const ans=document.getElementById("answers");
  if(!box||!ans) return;

  const id=Number(localStorage.getItem("current"));
  const idx=questions.findIndex(q=>q.id===id);
  currentIndex=idx<0?0:idx;
  const q=questions[currentIndex];

  box.innerHTML=""; ans.innerHTML="";

  const h=document.createElement("h3");
  h.textContent=q.id+". "+q.question.split("\n\n")[0];
  box.appendChild(h);

  if(q.question.includes("\n\n")){
    const d=document.createElement("div");
    d.className="dialog-box";
    if(q.id===37||q.id===38) d.classList.add("dialog-center");
    d.textContent=q.question.split("\n\n").slice(1).join("\n\n");
    box.appendChild(d);
  }

  if(q.audio){
    const a=document.createElement("audio");
    a.controls=true;
    a.src=q.audio;
    a.preload="auto";
    box.appendChild(a);
  }

  if(q.image){
    const i=document.createElement("img");
    i.src=q.image;
    box.appendChild(i);
  }

  q.options.forEach((o,i)=>{
    const b=document.createElement("button");
    b.textContent=i+1;
    if(answered[q.id]===i+1) b.classList.add("selected");
    b.onclick=()=>{
      answered[q.id]=i+1;
      localStorage.setItem("answered",JSON.stringify(answered));
      loadQuestionPage();
    };
    const row=document.createElement("div");
    row.appendChild(b);
    row.append(o);
    ans.appendChild(row);
  });
}

/* ================= NAV ================= */
function nextQuestion(){
  if(currentIndex+1<questions.length){
    localStorage.setItem("current",questions[currentIndex+1].id);
    loadQuestionPage();
  }
}
function prevQuestion(){
  if(currentIndex>0){
    localStorage.setItem("current",questions[currentIndex-1].id);
    loadQuestionPage();
  }
}
function back(){ location.href="dashboard.html"; }

/* ================= TIMER ================= */
let time=Number(localStorage.getItem("time"))||50*60;
setInterval(()=>{
  time--; localStorage.setItem("time",time);
  const t=document.getElementById("timerBox");
  if(t){
    const m=String(Math.floor(time/60)).padStart(2,"0");
    const s=String(time%60).padStart(2,"0");
    t.textContent=`${m}:${s}`;
  }
  if(time<=0) finish();
},1000);

/* ================= SUBMIT ================= */
function calculateScore(){
  let s=0;
  questions.forEach(q=>{
    if(answered[q.id]===q.answer) s+=2.5;
  });
  return s;
}

function finish(){
  const score=calculateScore();
  const history=JSON.parse(localStorage.getItem("history")||"{}");
  history[`paket${paket}`]={score};
  localStorage.setItem("history",JSON.stringify(history));

  const results=JSON.parse(localStorage.getItem("results")||"[]");
  results.push({
    name:localStorage.getItem("user"),
    paket:`Paket ${paket}`,
    score,
    time:document.getElementById("timerBox")?.innerText,
    date:new Date().toLocaleString()
  });
  localStorage.setItem("results",JSON.stringify(results));

  location.href="index.html";
}

/* ================= INIT ================= */
window.onload=async()=>{
  await loadSoal();
  loadQuestionPage(); // 🔥 FIX SOAL KOSONG
};
