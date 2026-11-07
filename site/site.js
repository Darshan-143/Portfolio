
(()=>{
"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine=matchMedia("(hover:hover) and (pointer:fine)").matches;
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const page=document.body.dataset.page||"home";

/* ---------- sound (tiny synthesized foley, off by default) ---------- */
let AC=null,soundOn=store.get("sd_sound",false);
function ctx(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}return AC}
function noise(dur,f1,f2,gain){const a=ctx();if(!a||!soundOn)return;const n=a.createBuffer(1,a.sampleRate*dur,a.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
 const s=a.createBufferSource();s.buffer=n;const f=a.createBiquadFilter();f.type="bandpass";f.frequency.setValueAtTime(f1,a.currentTime);f.frequency.exponentialRampToValueAtTime(f2,a.currentTime+dur);f.Q.value=.9;
 const g=a.createGain();g.gain.value=gain;s.connect(f);f.connect(g);g.connect(a.destination);s.start()}
function tone(f1,f2,dur,type,gain){const a=ctx();if(!a||!soundOn)return;const o=a.createOscillator(),g=a.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f1,a.currentTime);o.frequency.exponentialRampToValueAtTime(f2,a.currentTime+dur);g.gain.setValueAtTime(gain,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+dur)}
const snd={page:()=>noise(.5,2400,900,.18),creak:()=>{tone(150,70,.9,"sawtooth",.05);noise(.9,500,180,.12)},pop:()=>tone(520,880,.14,"triangle",.12),stamp:()=>{tone(180,60,.2,"square",.08);noise(.15,900,300,.12)},meow:()=>tone(620,420,.35,"sine",.1),hover:()=>noise(.12,3200,1800,.05)};
const sb=$("#sound");
function paintSound(){if(sb){sb.setAttribute("aria-pressed",String(soundOn));sb.setAttribute("aria-label",soundOn?"Sound on":"Sound off")}}
if(sb){paintSound();sb.addEventListener("click",()=>{soundOn=!soundOn;store.set("sd_sound",soundOn);paintSound();ctx();if(soundOn)snd.pop()})}

/* ---------- achievements ---------- */
const ACH={enter:["Door opener","You walked in through the front door."],gallery:["Gallery visitor","You stepped into the gallery."],inspect:["Sharp eye","You inspected a project up close."],studio:["Met the maker","You visited the studio."],harbor:["Found the harbor","You made it to the contact page."],cat:["Cat person","You petted the cat."],reveal:["Colour in","You brought the sketch to life."]};
let got=store.get("sd_ach",{});
const toast=$("#toast"),panel=$("#panel"),cnt=$("#cnt");
function paintAch(){if(cnt)cnt.textContent=Object.keys(got).length+"/"+Object.keys(ACH).length;
 if(panel){const ul=$("ul",panel);ul.innerHTML=Object.entries(ACH).map(([k,v])=>`<li class="${got[k]?"done":""}"><i></i><div>${v[0]}<small>${v[1]}</small></div></li>`).join("")}}
let tq=Promise.resolve();
function award(k){if(got[k]||!ACH[k])return;got[k]=1;store.set("sd_ach",got);paintAch();
 tq=tq.then(()=>new Promise(r=>{if(!toast)return r();$("b",toast).textContent="Stamp collected";$("span",toast).textContent=ACH[k][0]+" · "+ACH[k][1];toast.classList.add("on");snd.stamp();setTimeout(()=>{toast.classList.remove("on");setTimeout(r,500)},2600)}))}
paintAch();
const ab=$("#ach");
if(ab&&panel){ab.addEventListener("click",e=>{e.stopPropagation();const on=panel.classList.toggle("on");ab.setAttribute("aria-expanded",on)});
 document.addEventListener("click",e=>{if(!panel.contains(e.target)&&e.target!==ab)panel.classList.remove("on")});
 $(".x",panel).addEventListener("click",()=>panel.classList.remove("on"))}
window.__award=award;

/* ---------- page wipe ---------- */
const wipe=$("#wipe");
function goTo(url){if(RM||!wipe){location.href=url;return}snd.page();wipe.classList.add("on");setTimeout(()=>{location.href=url},700)}
window.__goTo=goTo;
document.addEventListener("click",e=>{const a=e.target.closest("a[href]");if(!a||a.target||e.metaKey||e.ctrlKey||e.shiftKey)return;
 const h=a.getAttribute("href");if(/^(https?:|mailto:|tel:|#)/.test(h)||a.hasAttribute("download"))return;e.preventDefault();goTo(h)});
addEventListener("pageshow",e=>{if(e.persisted&&wipe){wipe.classList.remove("on")}});
if(wipe&&!RM&&sessionStorage.getItem("sd_wipe")==="1"){sessionStorage.removeItem("sd_wipe")}
if(wipe&&!RM&&document.referrer.includes(location.host)&&page!=="home-first"){wipe.classList.add("in");requestAnimationFrame(()=>requestAnimationFrame(()=>wipe.classList.add("out")));setTimeout(()=>wipe.classList.remove("in","out"),900)}

/* ---------- progress ---------- */
const prog=$(".progress");
let ticking=false;
function onScroll(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;const h=document.documentElement.scrollHeight-innerHeight;if(prog)prog.style.transform="scaleX("+(h>0?scrollY/h:0)+")";fly();tlp()})}
addEventListener("scroll",onScroll,{passive:true});addEventListener("resize",onScroll);

/* ---------- reveals ---------- */
function splitWords(){$$(".words").forEach(el=>{if(el.dataset.s)return;el.dataset.s=1;let i=0;const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t)){f.append(" ");return}const w=document.createElement("span");w.className="w";const x=document.createElement("i");x.textContent=t;x.style.setProperty("--i",i++);w.append(x);f.append(w)});c.replaceWith(f)}else if(c.nodeType===1&&!c.classList.contains("w"))walk(c)})};walk(el)})}
splitWords();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);
  if(e.target.matches(".tl-item")){}
 }}),{threshold:.14,rootMargin:"0px 0px -6% 0px"});
$$(".rv,.words,.tl-item").forEach(el=>io.observe(el));
const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("play");io2.unobserve(e.target)}}),{threshold:.2});
$$(".sk").forEach(el=>{if(RM)el.classList.add("static");else if(!el.hasAttribute("data-auto"))io2.observe(el)});

/* counters */
const io3=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io3.unobserve(e.target);const el=e.target,to=+el.dataset.n,t0=performance.now();
 if(RM){el.textContent=String(to).padStart(2,"0");return}
 (function step(t){const p=Math.min(1,(t-t0)/1400),v=Math.round(to*(1-Math.pow(1-p,3)));el.textContent=String(v).padStart(2,"0");if(p<1)requestAnimationFrame(step)})(t0)}),{threshold:.6});
$$("[data-n]").forEach(el=>io3.observe(el));

/* timeline line */
const tlEl=$(".tl"),tlPath=$(".tl-line");
function tlp(){if(!tlEl||!tlPath)return;const r=tlEl.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight*.62-r.top)/r.height));tlPath.style.setProperty("--p",p.toFixed(3))}

/* ---------- cursor ---------- */
if(fine&&!RM){const c=$(".cur"),d=$(".cur-dot");let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y;
 addEventListener("pointermove",e=>{x=e.clientX;y=e.clientY;c.classList.add("show");d.classList.add("show");d.style.transform=`translate(${x}px,${y}px)`},{passive:true});
 (function loop(){cx+=(x-cx)*.18;cy+=(y-cy)*.18;c.style.transform=`translate(${cx}px,${cy}px)`;requestAnimationFrame(loop)})();
 document.addEventListener("pointerover",e=>{c.classList.toggle("big",!!e.target.closest("a,button,.work,.bal,.door-link,.cat,input,textarea"))});
 document.addEventListener("mouseleave",()=>{c.classList.remove("show");d.classList.remove("show")})}

/* magnetic buttons + tilt */
if(fine&&!RM){$$(".btn,.chip").forEach(b=>{b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.translate=((e.clientX-r.left-r.width/2)*.18)+"px "+((e.clientY-r.top-r.height/2)*.28)+"px"});b.addEventListener("pointerleave",()=>{b.style.translate=""})});
 $$(".polaroid").forEach(p=>{p.addEventListener("pointermove",e=>{const r=p.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;p.style.setProperty("--mx",px*100+"%");p.style.setProperty("--my",py*100+"%");p.style.transform=`rotate(${-3+px*4}deg) perspective(700px) rotateX(${(.5-py)*8}deg) rotateY(${(px-.5)*10}deg)`});p.addEventListener("pointerleave",()=>{p.style.transform=""})})}
if(!fine&&!RM)$$(".polaroid").forEach(p=>{const o=new IntersectionObserver(es=>{if(es[0].isIntersecting){setTimeout(()=>p.classList.add("rev"),1100);o.disconnect()}},{threshold:.6});o.observe(p)});
$$(".polaroid").forEach(p=>p.addEventListener("click",()=>{p.classList.toggle("rev");if(p.classList.contains("rev"))award("reveal")}));

/* ---------- HOME ---------- */
const house=$("#house"),stage=$("#stage");
let entered=false;
function enter(){if(entered)return;entered=true;award("enter");snd.creak();
 stage.classList.add("opened");
 const f=$("#fly");
 if(RM){setTimeout(()=>{f.scrollIntoView();stage.classList.remove("opened");entered=false},50);return}
 const hs=$(".door-hotspot"),r=hs.getBoundingClientRect(),hr=house.getBoundingClientRect();
 const ox=r.left+r.width/2-hr.left,oy=r.top+r.height*.5-hr.top;
 house.style.transformOrigin=ox+"px "+oy+"px";
 const s=Math.max(innerWidth/r.width,innerHeight/r.height)*1.25,dx=innerWidth/2-(r.left+r.width/2),dy=innerHeight/2-(r.top+r.height*.5);
 const fl=$("#hflash");
 setTimeout(()=>{house.style.transition="transform 1.7s cubic-bezier(.65,0,.25,1)";house.style.transform=`translate(${dx}px,${dy}px) scale(${s})`;fl&&fl.classList.add("on")},900);
 setTimeout(()=>{f.scrollIntoView({behavior:"instant"})},2700);
 setTimeout(()=>{house.style.transition="none";house.style.transform="";house.style.transformOrigin="";stage.classList.remove("opened");fl&&fl.classList.remove("on");entered=false;setTimeout(()=>{house.style.transition=""},50)},3400)}
if(house){const hs=$(".door-hotspot");hs&&hs.addEventListener("click",enter);hs&&hs.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();enter()}});
 $(".enter-btn")&&$(".enter-btn").addEventListener("click",enter);
 const cat=$(".cat");if(cat){const pet=()=>{cat.classList.remove("purr");void cat.offsetWidth;cat.classList.add("purr");snd.meow();award("cat")};cat.addEventListener("click",pet);cat.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pet()}})}
 const vb=()=>{const s=$("#house svg"),m=innerWidth<760;s.setAttribute("viewBox",m?"215 40 680 970":"-420 40 1460 920");s.setAttribute("preserveAspectRatio",m?"xMidYMax meet":"xMidYMax meet")};vb();addEventListener("resize",vb)}
const flyEl=$("#fly");
const world=$("#world"),caps=$$(".cap"),fh=$(".fly-hint");
function fly(){if(!flyEl||!world)return;const r=flyEl.getBoundingClientRect(),tot=r.height-innerHeight,p=Math.max(0,Math.min(1,-r.top/tot));
 const s=Math.pow(2.3,p*2.9);world.style.transform=`scale(${s.toFixed(4)})`;world.ownerSVGElement.style.setProperty("--sc",s.toFixed(3));
 const w=[[.0,.2],[.2,.45],[.45,.7],[.74,1.01]];caps.forEach((c,i)=>c.classList.toggle("on",p>=w[i][0]&&p<w[i][1]&&r.top<innerHeight*.5&&r.bottom>innerHeight*.5));
 if(fh)fh.style.opacity=p>.05&&p<.9?"0":"1"}
if(flyEl){const cs=$(".cor");const vbf=()=>{const m=innerWidth/innerHeight<.9;cs.setAttribute("viewBox",m?"0 0 1000 1000":"0 110 1000 720");cs.setAttribute("preserveAspectRatio","xMidYMid slice")};vbf();addEventListener("resize",vbf);fly();
 $$(".door-link").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();snd.creak();a.classList.add("go");const href=a.getAttribute("href");if(RM){location.href=href;return}
  world.style.transition="transform 1.1s cubic-bezier(.65,0,.25,1)";const m=a.getBoundingClientRect(),cx=m.left+m.width/2,cy=m.top+m.height/2;
  a.querySelector(".door-open").style.opacity=1;a.querySelector(".door-leaf").style.opacity=0;
  const cur=parseFloat(world.style.transform.replace(/[^0-9.]/g,""))||1;world.style.transform=`scale(${cur*2.6})`;setTimeout(()=>goTo(href),700)}))}

/* ---------- GALLERY ---------- */
const works=$$(".work");
if(works.length){
 $$(".chip").forEach(c=>c.addEventListener("click",()=>{$$(".chip").forEach(x=>x.setAttribute("aria-pressed","false"));c.setAttribute("aria-pressed","true");const f=c.dataset.f;works.forEach(w=>{const show=f==="all"||w.dataset.k.split(" ").includes(f);w.classList.toggle("hide",!show)});snd.pop()}));
 const modal=$("#modal"),mm=$(".modal-media",modal),mb=$(".modal-body",modal);let last=null;
 const closeM=()=>{modal.classList.remove("on");document.body.style.overflow="";const v=$("video",mm);v&&v.pause();setTimeout(()=>{mm.innerHTML="";mb.innerHTML=""},350);last&&last.focus()};
 works.forEach(w=>w.addEventListener("click",()=>{last=w;const t=$("template",w);
   mm.innerHTML=$(".m-media",t.content).innerHTML;mb.innerHTML=$(".m-body",t.content).innerHTML;
   modal.classList.add("on");document.body.style.overflow="hidden";snd.page();award("inspect");
   const v=$("video",mm);v&&v.play&&!RM&&v.play().catch(()=>{});$(".close",modal).focus()}));
 $(".close",modal).addEventListener("click",closeM);modal.addEventListener("click",e=>{if(e.target===modal)closeM()});
 addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("on"))closeM()})}

/* ---------- ABOUT ---------- */
$$(".bal").forEach(b=>b.addEventListener("click",()=>{b.classList.add("pop");snd.pop();setTimeout(()=>b.classList.remove("pop"),500)}));

/* ---------- CONTACT ---------- */
const form=$("#letter");
if(form){
 const txt=()=>{const n=$("#nm").value.trim(),m=$("#ms").value.trim();return{n,m,body:(m||"Hi Sudarshan,")+(n?"\n\n— "+n:"")}};
 $("#viaMail").addEventListener("click",e=>{e.preventDefault();const {body}=txt();location.href="mailto:"+form.dataset.mail+"?subject="+encodeURIComponent("Hello from your portfolio")+"&body="+encodeURIComponent(body)});
 $("#viaIG").addEventListener("click",async e=>{e.preventDefault();const {body}=txt();try{await navigator.clipboard.writeText(body)}catch(_){const t=document.createElement("textarea");t.value=body;document.body.append(t);t.select();try{document.execCommand("copy")}catch(_){}t.remove()}
  const s=$("#status");s.textContent="Message copied. Paste it in the DM that just opened.";window.open("https://ig.me/m/sudarshan.4u","_blank","noopener")});
 $$(".cp").forEach(b=>b.addEventListener("click",async()=>{const v=b.dataset.v;try{await navigator.clipboard.writeText(v)}catch(_){}const o=b.textContent;b.textContent="copied";snd.pop();setTimeout(()=>b.textContent=o,1400)}))}
if(page==="gallery")award("gallery");if(page==="about")award("studio");if(page==="contact")award("harbor");

/* ---------- PRELOADER ---------- */
const pre=$("#pre");
function finish(){document.documentElement.classList.add("ready");$$(".sk[data-auto]").forEach(el=>el.classList.add("play"));onScroll()}
if(pre){const first=!sessionStorage.getItem("sd_seen")&&page==="home";
 if(!first||RM){pre.remove();finish()}
 else{sessionStorage.setItem("sd_seen","1");const num=$(".pre-num",pre),bar=$(".pre-bar i",pre);let v=0;const t0=performance.now(),dur=2400;
  (function step(t){v=Math.min(100,Math.round((t-t0)/dur*100));num.textContent=String(v).padStart(2,"0");bar.style.width=v+"%";if(v<100)requestAnimationFrame(step);else{snd.page();pre.classList.add("open");setTimeout(()=>{pre.remove();},1100);finish()}})(t0);
  document.body.style.overflow="hidden";setTimeout(()=>{document.body.style.overflow=""},dur+400);
  pre.addEventListener("click",()=>{dur>0&&(pre.classList.add("open"),setTimeout(()=>pre.remove(),1100),finish(),document.body.style.overflow="")},{once:true})}}
else finish();
onScroll();
})();
