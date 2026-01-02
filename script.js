let questions=[];
let answered=JSON.parse(localStorage.getItem("answered")||"{}");
let currentIndex=0;
let time=Number(localStorage.getItem("time"))||50*60;

/* LOAD SOAL */
async function loadSoal(){
  const paket=localStorage.getItem("paket");
  const url=`https://airnetcso.github.io/ubt/soal/soal${paket}.json`;
  const res=await fetch(url);
  questions=await res.json();
  buildGrid();
}

/* GRID */
function buildGrid(){
  const L=document.getElementById("listen");
  const R=document.getElementById("read");
  if(!L||!R)return;
  L.innerHTML=R.innerHTML="";
  questions.forEach((q,i)=>{
    const d=document.createElement("div");
    d.className="qbox";
    d.textContent=q.id;
    if(answered[q.id])d.classList.add("done");
    d.onclick=()=>{
      localStorage.setItem("current",q.id);
      location.href="question.html";
    };
    (q.type==="listening"?L:R).appendChild(d);
  });
}

/* HALAMAN SOAL */
async function loadQuestionPage(){
  const qBox=document.getElementById("questionBox");
  const ans=document.getElementById("answers");
  if(!qBox||!ans)return;

  const id=Number(localStorage.getItem("current"));
  currentIndex=questions.findIndex(q=>q.id===id);
  if(currentIndex<0){alert("Soal tidak ditemukan");return;}

  const q=questions[currentIndex];
  qBox.innerHTML="";
  ans.innerHTML="";

  qBox.innerHTML+=`<h3>${q.id}. ${q.question}</h3>`;

  if(q.audio){
    const a=document.createElement("audio");
    a.controls=true;
    a.src=q.audio;
    a.load();
    qBox.appendChild(a);
  }

  if(q.image){
    const img=document.createElement("img");
    img.src=q.image;
    qBox.appendChild(img);
  }

  q.options.forEach((o,i)=>{
    const b=document.createElement("button");
    b.textContent=i+1;
    if(answered[q.id]==i+1)b.classList.add("selected");
    b.onclick=()=>{
      answered[q.id]=i+1;
      localStorage.setItem("answered",JSON.stringify(answered));
      loadQuestionPage();
    };
    ans.appendChild(b);
    ans.append(o);
  });
}

/* NAV */
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

/* TIMER */
setInterval(()=>{
  time--;
  localStorage.setItem("time",time);
  const t=document.getElementById("timerBox");
  if(t)t.textContent=`${Math.floor(time/60)}:${String(time%60).padStart(2,"0")}`;
  if(time<=0)finish();
},1000);

/* SUBMIT */
function calculateScore(){
  let s=0;
  questions.forEach(q=>{
    if(answered[q.id]==q.answer)s+=2.5;
  });
  return s;
}

function finish(){
  const results=JSON.parse(localStorage.getItem("results")||"[]");
  results.push({
    name:localStorage.getItem("user"),
    paket:localStorage.getItem("paket"),
    score:calculateScore(),
    date:new Date().toLocaleString()
  });
  localStorage.setItem("results",JSON.stringify(results));
  localStorage.removeItem("answered");
  localStorage.removeItem("current");
  localStorage.removeItem("time");
  location.href="index.html";
}

/* INIT */
window.onload=async()=>{
  await loadSoal();
  if(document.getElementById("questionBox"))loadQuestionPage();
};
