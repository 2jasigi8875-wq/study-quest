/* ====== 저장 키 ====== */
const KEY='sq1';

/* ====== 날짜 도우미 ====== */
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const shift=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return ymd(d);};
const TODAY=ymd(new Date());
const YOIL=['일','월','화','수','목','금','토'];

/* ====== 저장 데이터 ====== */
let D=JSON.parse(localStorage.getItem(KEY)||'{}');
if(!D.log)D.log={};
if(!D.coupons)D.coupons=[];
if(!D.given)D.given=[];
if(!D.sgiven)D.sgiven=[];
if(D.bones===undefined)D.bones=0;
if(D.shields===undefined)D.shields=0;
if(D.best===undefined)D.best=0;
if(!D.rec)D.rec={};
if(!D.dex)D.dex=[];
if(!D.wrong)D.wrong=[];
const save=()=>localStorage.setItem(KEY,JSON.stringify(D));

let sel=TODAY;
let view=TODAY.slice(0,7);

function rec(d){if(!D.log[d])D.log[d]={};return D.log[d];}
function R(d){return D.log[d]||{};}

/* ====== 성공 판정 ====== */
function dow(d){return parseD(d).getDay();}
function isSun(d){return dow(d)===0;}
function isSat(d){return dow(d)===6;}
function ok(d){
  const r=R(d);
  if(r.s)return true;
  if(isSun(d))return false;
  if(isSat(d))return !!r.b;
  return !!r.w&&!!r.b;
}

/* ====== 연속일 ====== */
function runTo(date){
  let c=0,cur=date,g=0;
  while(g++<400){
    if(isSun(cur)){cur=shift(cur,-1);continue;}
    if(ok(cur))c++;else break;
    cur=shift(cur,-1);
  }
  return c;
}
function streakNow(){
  let cur=TODAY;
  while(isSun(cur))cur=shift(cur,-1);
  return ok(cur)?runTo(cur):runTo(shift(cur,-1));
}
function bestStreak(){
  let b=0;
  Object.keys(D.log).forEach(d=>{if(ok(d)){const r=runTo(d);if(r>b)b=r;}});
  return b;
}

/* ====== 실드 자동 사용 ====== */
function autoShield(){
  for(let i=7;i>=1;i--){
    const d=shift(TODAY,-i);
    if(isSun(d))continue;
    const r=R(d);
    if(r.s)continue;
    if(ok(d))continue;
    if(!Object.keys(D.log).length)continue;
    if(d<firstDay())continue;
    if(D.shields>0){D.shields--;rec(d).s=true;}
  }
}
function firstDay(){
  const ks=Object.keys(D.log).sort();
  return ks.length?ks[0]:TODAY;
}

/* ====== 콩이 ====== */
function stage(s){
  let st=STAGES[0];
  STAGES.forEach(x=>{if(s>=x.d)st=x;});
  return st;
}
function pick(a){return a[Math.floor(Math.random()*a.length)];}

function drawDog(){
  const s=streakNow();
  const st=stage(s);
  const el=document.getElementById('dog');
  el.textContent=st.em;
  el.style.fontSize=st.sz+'px';
  document.getElementById('dogname').textContent=DOGNAME+' · '+st.t;

  let nx=null;
  STAGES.forEach(x=>{if(x.d>s&&nx===null)nx=x;});
  const bar=document.getElementById('lvfill');
  const tx=document.getElementById('lvtx');
  if(nx){
    let prev=0;STAGES.forEach(x=>{if(x.d<=s)prev=x.d;});
    const p=Math.round((s-prev)/(nx.d-prev)*100);
    bar.style.width=p+'%';
    tx.textContent='다음 단계까지 '+(nx.d-s)+'일 · '+nx.t;
  }else{
    bar.style.width='100%';
    tx.textContent='최고 단계 달성!';
  }

  const r=R(TODAY);
  const b=document.getElementById('bubble');
  if(ok(TODAY))b.textContent=pick(MSG_DONE);
  else if(r.w||r.b)b.textContent=pick(MSG_HALF);
  else{
    const y=shift(TODAY,-1);
    b.textContent=(!isSun(y)&&Object.keys(D.log).length&&!ok(y))?pick(MSG_MISS):pick(MSG_IDLE);
  }
}
function hop(){
  const el=document.getElementById('dog');
  el.classList.remove('happy');void el.offsetWidth;el.classList.add('happy');
}

/* ====== 달력 ====== */
function drawCal(){
  const y=+view.slice(0,4),m=+view.slice(5,7);
  const first=new Date(y,m-1,1),last=new Date(y,m,0).getDate();
  let h='<div class="ch"><button class="cn" id="pv">‹</button><b>'+y+'년 '+m+'월</b><button class="cn" id="nx">›</button></div><div class="cg">';
  ['일','월','화','수','목','금','토'].forEach((d,i)=>{
    h+='<div class="cd'+(i===0?' s':'')+'">'+d+'</div>';
  });
  for(let i=0;i<first.getDay();i++)h+='<div class="cc e"></div>';
  for(let i=1;i<=last;i++){
    const ds=y+'-'+pad(m)+'-'+pad(i);
    const r=R(ds);
    let c='cc';
    if(r.s)c+=' shield';
    else if(ok(ds))c+=' done';
    if(ds===TODAY)c+=' t';
    if(ds===sel)c+=' sel';
    if(ds>TODAY)c+=' f';
    let mk='';
    if(r.s)mk='🛡️';
    else if(isSun(ds))mk='💤';
    else{
      if(r.w)mk+='📖';
      if(r.b)mk+='✏️';
    }
    h+='<button class="'+c+'" data-d="'+ds+'">'+i+'<span class="mk">'+mk+'</span></button>';
  }
  h+='</div><div class="lg">📖 단어 · ✏️ 문제집 · 🛡️ 실드 · 💤 일요일 쉬는 날<br>초록색 = 그날 미션 전부 완료</div>';
  const box=document.getElementById('calCard');
  box.innerHTML=h;
  box.querySelectorAll('.cc[data-d]').forEach(b=>{
    b.onclick=()=>{sel=b.dataset.d;draw();};
  });
  document.getElementById('pv').onclick=()=>mv(-1);
  document.getElementById('nx').onclick=()=>mv(1);
}
function mv(n){
  let y=+view.slice(0,4),m=+view.slice(5,7)+n;
  if(m<1){m=12;y--;}if(m>12){m=1;y++;}
  view=y+'-'+pad(m);drawCal();
}

/* ====== 뽑기 ====== */
function isMile(n){return MILESTONES.indexOf(n)>=0||(n>30&&n%10===0);}
function pickReward(){
  const t=REWARDS.reduce((a,b)=>a+b.w,0);
  let r=Math.random()*t;
  for(let i=0;i<REWARDS.length;i++){r-=REWARDS[i].w;if(r<0)return REWARDS[i].n;}
  return REWARDS[0].n;
}
function pickDex(){
  const lock=DEX.filter(x=>D.dex.indexOf(x.id)<0);
  if(!lock.length)return null;
  const t=lock.reduce((a,b)=>a+1/b.r,0);
  let r=Math.random()*t;
  for(let i=0;i<lock.length;i++){r-=1/lock[i].r;if(r<0)return lock[i];}
  return lock[0];
}

function drawGacha(){
  const box=document.getElementById('gachaCard');
  if(D.bones<=0&&!D.coupons.length){box.style.display='none';return;}
  box.style.display='';
  let h='';
  if(D.bones>0){
    h+='<div class="ttl">🦴 간식 뽑기</div>'
      +'<div class="gname" id="gn">뼈다귀 '+D.bones+'개 있어요!</div>'
      +'<button class="btn" id="sp">뽑기 돌리기 🎲</button>';
  }
  if(D.coupons.length){
    h+='<div class="ttl" style="margin-top:'+(D.bones>0?14:0)+'px">🎟️ 내 쿠폰</div>';
    h+=D.coupons.map((c,i)=>'<div class="cp"><span>'+c+'</span><button data-i="'+i+'">사용</button></div>').join('');
  }
  box.innerHTML=h;
  const sp=document.getElementById('sp');
  if(sp)sp.onclick=spin;
  box.querySelectorAll('.cp button').forEach(b=>{
    b.onclick=()=>{
      const i=+b.dataset.i;
      if(confirm('"'+D.coupons[i]+'"\n\n지금 사용할까요? (부모님 확인)')){
        D.coupons.splice(i,1);save();draw();
      }
    };
  });
}
function spin(){
  if(D.bones<=0)return;
  D.bones--;
  const el=document.getElementById('gn');
  document.getElementById('sp').disabled=true;
  const win=pickReward();
  let i=0;
  const t=setInterval(()=>{
    el.textContent=REWARDS[Math.floor(Math.random()*REWARDS.length)].n;
    if(++i>13){
      clearInterval(t);
      el.textContent='🎉 '+win;
      D.coupons.push(win);
      let extra='';
      if(Math.random()<0.3){
        const nd=pickDex();
        if(nd){D.dex.push(nd.id);extra='\n\n'+nd.em+' 새 친구 「'+nd.nm+'」 등장!';}
      }
      save();hop();
      setTimeout(()=>{alert('🎁 '+win+extra);draw();},900);
    }
  },90);
}

/* ====== 타이머 ====== */
let T={steps:[],i:0,left:0,tid:null,paused:false};
function beep(){
  try{
    const c=new (window.AudioContext||window.webkitAudioContext)();
    const o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.frequency.value=880;g.gain.value=.15;
    o.start();setTimeout(()=>{o.stop();c.close();},220);
  }catch(e){}
  if(navigator.vibrate)navigator.vibrate(180);
}
function startTimer(rt){
  T.steps=rt.list;T.i=0;T.paused=false;
  document.getElementById('tm').classList.add('on');
  loadStep();
}
function loadStep(){
  const s=T.steps[T.i];
  T.left=s.s;
  document.getElementById('tname').textContent=s.n;
  document.getElementById('tcue').textContent=s.cue||'';
  document.getElementById('tstep').textContent=(T.i+1)+' / '+T.steps.length;
  tick();
  clearInterval(T.tid);
  T.tid=setInterval(()=>{
    if(T.paused)return;
    T.left--;
    if(T.left<=0){
      beep();
      if(T.i<T.steps.length-1){T.i++;loadStep();}
      else{clearInterval(T.tid);endTimer(true);}
      return;
    }
    tick();
  },1000);
}
function tick(){
  const s=T.steps[T.i];
  const m=Math.floor(T.left/60),sec=T.left%60;
  document.getElementById('tnum').textContent=m>0?(m+':'+pad(sec)):sec;
  const deg=360*(1-T.left/s.s);
  document.getElementById('tring').style.background=
    'conic-gradient(var(--gold) '+deg+'deg,#e5d5c0 '+deg+'deg)';
}
function endTimer(done){
  clearInterval(T.tid);
  document.getElementById('tm').classList.remove('on');
  if(done){hop();alert('⏰ 다 끝났어요! 잘했어요 👏');}
}
document.getElementById('tpause').onclick=function(){
  T.paused=!T.paused;this.textContent=T.paused?'계속하기':'일시정지';
};
document.getElementById('tskip').onclick=()=>{
  if(T.i<T.steps.length-1){T.i++;loadStep();}else endTimer(true);
};
document.getElementById('texit').onclick=()=>endTimer(false);

/* ====== 단어 카드 ====== */
function weekWords(){
  const d=parseD(sel);
  const mon=shift(sel,-((d.getDay()+6)%7));
  let out=[];
  for(let i=0;i<5;i++){
    const r=R(shift(mon,i));
    if(r.words)out=out.concat(r.words);
  }
  return out;
}

function drawWord(){
  const box=document.getElementById('wordCard');
  const dw=dow(sel);
  const r=R(sel);
  const past=sel<TODAY, future=sel>TODAY;

  if(dw===0){
    box.innerHTML='<div class="rest">💤 일요일은 쉬는 날!<br><span class="sub">콩이랑 푹 쉬어요</span></div>';
    return;
  }
  if(dw===6){
    const ws=weekWords();
    let h='<div class="ttl">🐾 토요일 복습 데이<span class="eq">'+ws.length+'개</span></div>'
      +'<div class="sub" style="margin-top:6px">이번 주에 외운 단어를 다시 확인해요.</div>';
    if(ws.length){
      h+='<div style="margin-top:10px">'+ws.map(w=>
        '<div class="w"><span class="en">'+w.e+'</span><span class="ko">'+w.k+'</span></div>').join('')+'</div>';
      h+='<button class="btn tm" id="tmS">▶ 타이머 따라하기 (20분)</button>';
    }else{
      h+='<div class="sub" style="margin-top:8px">이번 주에 입력한 단어가 없어요.</div>';
    }
    h+='<button class="btn" id="dB"'+(r.b?' disabled':'')+(future?' disabled':'')+'>'
      +(r.b?'오늘 완료했어요 👍':'복습 완료! ✅')+'</button>';
    if(r.b)h+='<button class="btn gray sm" id="uB">완료 취소</button>';
    box.innerHTML=h;
    const t=document.getElementById('tmS');
    if(t)t.onclick=()=>startTimer(TM_SAT);
    bindB();
    return;
  }

  /* 평일 */
  let h='<div class="ttl">📖 오늘의 영단어<span class="eq">'+WPD+'개</span></div>';
  if(!r.words||!r.words.length){
    h+='<div class="sub" style="margin-top:8px">단어장에서 오늘 외울 '+WPD+'개를 입력하세요.<br>'
      +'한 줄에 하나씩, 영어 뒤에 한 칸 띄고 뜻을 적어요.</div>'
      +'<textarea id="wIn" rows="6" placeholder="apple 사과&#10;brave 용감한&#10;..." '
      +'style="width:100%;margin-top:10px;padding:10px;border:1px solid var(--line);'
      +'border-radius:10px;font-family:inherit;font-size:14px;background:#fff;color:var(--txt)"></textarea>'
      +'<button class="btn" id="wSave">단어 저장</button>';
    box.innerHTML=h;
    const b=document.getElementById('wSave');
    if(b)b.onclick=()=>{
      const v=document.getElementById('wIn').value.trim();
      if(!v)return;
      const ws=v.split('\n').map(l=>{
        const t=l.trim();if(!t)return null;
        const i=t.indexOf(' ');
        if(i<0)return {e:t,k:'',ok:false};
        return {e:t.slice(0,i),k:t.slice(i+1).trim(),ok:false};
      }).filter(Boolean);
      if(!ws.length)return;
      rec(sel).words=ws;save();draw();
    };
    return;
  }

  h+='<div style="margin-top:8px">'+r.words.map((w,i)=>
    '<div class="w"><span class="en">'+w.e+'</span><span class="ko">'+w.k+'</span>'
    +'<button class="ck'+(w.ok?' on':'')+'" data-i="'+i+'">✓</button></div>').join('')+'</div>';
  h+='<button class="btn tm" id="tmW">▶ 타이머 따라하기 (10분)</button>';
  h+='<button class="btn" id="dW"'+(r.w?' disabled':'')+(future?' disabled':'')+'>'
    +(r.w?'단어 완료했어요 👍':'단어 완료! ✅')+'</button>';
  if(r.w)h+='<button class="btn gray sm" id="uW">완료 취소</button>';
  h+='<button class="btn gray sm" id="wReset">단어 다시 입력</button>';
  box.innerHTML=h;

  box.querySelectorAll('.ck').forEach(b=>{
    b.onclick=()=>{
      const i=+b.dataset.i;
      r.words[i].ok=!r.words[i].ok;save();draw();
    };
  });
  document.getElementById('tmW').onclick=()=>startTimer(TM_WORD);
  document.getElementById('wReset').onclick=()=>{
    if(!confirm('오늘 단어를 지우고 다시 입력할까요?'))return;
    rec(sel).words=null;rec(sel).w=false;save();draw();
  };
  const a=document.getElementById('dW');
  if(a)a.onclick=()=>{rec(sel).w=true;afterDone();};
  const u=document.getElementById('uW');
  if(u)u.onclick=()=>{if(!confirm('완료를 취소할까요?'))return;rec(sel).w=false;save();draw();};
}

function bindB(){
  const r=rec(sel);
  const a=document.getElementById('dB');
  if(a)a.onclick=()=>{r.b=true;afterDone();};
  const u=document.getElementById('uB');
  if(u)u.onclick=()=>{if(!confirm('완료를 취소할까요?'))return;r.b=false;save();draw();};
}

/* ====== 문제집 카드 ====== */
function drawBook(){
  const box=document.getElementById('bookCard');
  const dw=dow(sel);
  if(dw===0||dw===6){box.style.display='none';return;}
  box.style.display='';
  const bk=BOOKS[dw];
  const r=R(sel);
  const future=sel>TODAY;
  let h='<div class="ttl">'+bk.em+' 오늘의 문제집<span class="eq">'+bk.s+' 1장</span></div>'
    +'<div class="sub" style="margin-top:6px">모르는 문제는 별표만 치고 넘어가요. 끝까지 푸는 게 먼저!</div>'
    +'<button class="btn tm" id="tmB">▶ 타이머 따라하기 (20분)</button>'
    +'<button class="btn" id="dB"'+(r.b?' disabled':'')+(future?' disabled':'')+'>'
    +(r.b?'문제집 완료했어요 👍':'문제집 완료! ✅')+'</button>';
  if(r.b)h+='<button class="btn gray sm" id="uB">완료 취소</button>';
  box.innerHTML=h;
  document.getElementById('tmB').onclick=()=>startTimer(TM_BOOK);
  bindB();
}

/* ====== 기록실 ====== */
function drawRec(){
  const box=document.getElementById('recCard');
  let h='<div class="ttl">🏆 기록실</div>';
  h+=RECORDS.map(r=>{
    const v=D.rec[r.k];
    return '<div class="rc"><span class="ic">'+r.ic+'</span><span class="nm">'+r.n+'</span>'
      +'<span class="vl">'+(v!==undefined?v+r.u:'-')+'</span>'
      +'<button data-k="'+r.k+'">기록</button></div>';
  }).join('');
  box.innerHTML=h;
  box.querySelectorAll('.rc button').forEach(b=>{
    b.onclick=()=>{
      const k=b.dataset.k;
      const r=RECORDS.filter(x=>x.k===k)[0];
      const v=prompt(r.n+' ('+r.u+')\n'+(r.hint||''),D.rec[k]||'');
      if(v===null)return;
      const n=parseFloat(v);
      if(isNaN(n))return;
      const old=D.rec[k];
      const isNew=(old===undefined)||(n>old);
      if(isNew){D.rec[k]=n;save();hop();alert('🏆 신기록!\n\n'+(old!==undefined?old+r.u+' → ':'')+n+r.u);}
      else alert('아쉽다! 최고 기록은 '+old+r.u+'\n다음엔 넘어보자 💪');
      draw();
    };
  });
}

/* ====== 도감 ====== */
function drawDex(){
  const box=document.getElementById('dexCard');
  let h='<div class="ttl">🐾 친구 도감<span class="eq">'+D.dex.length+' / '+DEX.length+'</span></div>';
  h+='<div class="dex">'+DEX.map(d=>{
    const got=D.dex.indexOf(d.id)>=0;
    return '<div class="dx'+(got?'':' lock')+'"><span class="em">'+(got?d.em:'❔')+'</span>'
      +'<span class="nm">'+(got?d.nm:'???')+'</span></div>';
  }).join('')+'</div>';
  h+='<div class="lg">뽑기를 돌리면 가끔 새 친구가 찾아와요</div>';
  box.innerHTML=h;
}

/* ====== 완료 처리 ====== */
function afterDone(){
  save();
  const was=ok(sel);
  if(was){
    const s=streakNow();
    if(s>D.best)D.best=s;
    let msg='🐾 '+s+'일 연속 성공!';
    if(isMile(s)&&D.given.indexOf(sel)<0){
      D.given.push(sel);D.bones++;
      msg+='\n\n🦴 뼈다귀 1개 획득!';
    }
    if(s>0&&s%7===0&&D.sgiven.indexOf(s)<0&&D.shields<SHIELD_MAX){
      D.sgiven.push(s);D.shields++;
      msg+='\n\n🛡️ 실드 1개 획득! (하루 빠져도 연속이 안 끊겨요)';
    }
    save();hop();draw();
    alert(msg);
  }else{
    save();draw();
  }
}

/* ====== 전체 그리기 ====== */
function draw(){
  autoShield();
  const d=parseD(sel);
  document.getElementById('today').textContent=
    (d.getMonth()+1)+'월 '+d.getDate()+'일 ('+YOIL[d.getDay()]+')'
    +(sel===TODAY?' · 오늘':' · 지난 기록');

  const s=streakNow();
  const b=bestStreak();
  if(b>D.best)D.best=b;
  document.getElementById('streak').textContent=s;
  document.getElementById('best').textContent=D.best;
  document.getElementById('shield').textContent=D.shields;

  drawDog();
  drawCal();
  drawGacha();
  drawWord();
  drawBook();
  drawRec();
  drawDex();
  save();
}
draw();
