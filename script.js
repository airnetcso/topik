let questions=[];
let answered=JSON.parse(localStorage.getItem("answered")||"{}");
let currentIndex=0;
let time=Number(localStorage.getItem("time"))||50*60;

/* ===== LOAD SOAL SESUAI PAKET ===== */
async function loadSoal(){
  const paket=localStorage.getItem("paket");
  const url=`https://airnetcso.github.io/ubt/soal/soal${paket}.json`;
  const res=await fetch(url);
  questions=await res.json();
  buildGrid();
}

/* ===== DASHBOARD GRID ===== */
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

/* ===== QUESTION PAGE ===== */
function loadQuestionPage(){
  const qBox=document.getElementById("questionBox");
  const ans=document.getElementById("answers");
  if(!qBox||!ans) return;

  const id=Number(localStorage.getItem("current"));
  const idx=questions.findIndex(q=>q.id===id);
  const q=questions[idx];
  currentIndex=idx;

  qBox.innerHTML=`<h3>${q.id}. ${q.question}</h3>`;
  ans.innerHTML="";

  if(q.audio){
    qBox.innerHTML+=`<audio src="${q.audio}" controls></audio>`;
  }
  if(q.image){
    qBox.innerHTML+=`<img src="${q.image}">`;
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
    row.appendChild(document.createTextNode(o));
    ans.appendChild(row);
  });
}

/* ===== NAV ===== */
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
function back(){location.href="dashboard.html";}

/* ===== TIMER ===== */
setInterval(()=>{
  time--;
  localStorage.setItem("time",time);
  const t=document.getElementById("timerBox");
  if(t){
    const m=String(Math.floor(time/60)).padStart(2,"0");
    const s=String(time%60).padStart(2,"0");
    t.textContent=`${m}:${s}`;
  }
  if(time<=0) finish();
},1000);

/* ===== SCORE ===== */
function calculateScore(){
  let score=0;
  questions.forEach(q=>{
    if(answered[q.id]===q.answer) score+=2.5;
  });
  return score;
}

function manualSubmit(){
  if(confirm("Submit sekarang?")) finish();
}

function finish(){
  const results=JSON.parse(localStorage.getItem("results")||"[]");
  results.push({
    name:localStorage.getItem("user"),
    paket:localStorage.getItem("paket"),
    score:calculateScore(),
    time:document.getElementById("timerBox").innerText,
    date:new Date().toLocaleString()
  });
  localStorage.setItem("results",JSON.stringify(results));
  localStorage.removeItem("answered");
  localStorage.removeItem("current");
  localStorage.removeItem("time");
  location.href="index.html";
}

/* ===== INIT ===== */
window.onload=()=>{
  loadSoal();
  loadQuestionPage();
};
