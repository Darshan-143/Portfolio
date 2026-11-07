// Run: node test/site.test.mjs   (from the project folder that holds site/ and test/)
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..','site');
const files=[];(function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);fs.statSync(p).isDirectory()?walk(p):files.push(p)}})(root);
const text=files.filter(f=>/\.(html|css|js|json|txt|svg)$/.test(f));
const all=text.map(f=>fs.readFileSync(f,'utf8')).join('\n');
let bad=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)bad++};
// 1. Referees (other people's data) and exact marks must never appear
for(const s of ['Manju','Perumbil','Venkanna','Muripiti','Radhamohan','Malik','Mallik','6282935001','9398237121','8280075562','8456802848','71%','64%','Distinction','Jagannathpur','Tejaswini'])ok(!all.includes(s),'no private/third-party string: '+s);
// 2. Contact details must match the resume exactly
ok(all.includes('sudarshandas891@gmail.com'),'email matches resume');
ok(/tel:\+918895479631/.test(all)&&all.includes('8895479631'),'phone matches resume (8895479631)');
ok(all.includes('https://www.linkedin.com/in/darshan4u-/'),'LinkedIn matches resume link');
ok(all.includes('https://scholar.google.com/citations?user=Y-5PltoAAAAJ'),'Scholar id matches resume');
ok(all.includes('https://github.com/Darshan-143'),'GitHub');ok(all.includes('https://www.instagram.com/sudarshan.4u/'),'Instagram');
// 3. Only the expected phone numbers / emails
const phones=new Set((all.match(/\d[\d\s-]{8,}\d/g)||[]).map(x=>x.replace(/\D/g,'')).filter(x=>x.length>=10&&!/^0+$/.test(x)));
const allowed=new Set(['8895479631','918895479631']);
const stray=[...phones].filter(p=>!allowed.has(p)&&!/^[0-9.\s-]*$/.test('')&&/^(91)?[6-9]\d{9}$/.test(p));
ok(stray.length===0,'no other phone-like numbers '+JSON.stringify(stray));
const emails=new Set(all.match(/[\w.+-]+@[\w-]+\.[\w.]+/g)||[]);
ok([...emails].every(e=>e==='sudarshandas891@gmail.com'),'only his own email '+JSON.stringify([...emails]));
// 4. Content rules
ok(!/youtube\.com|youtu\.be/i.test(all),'no YouTube link');
ok(/AI-assisted/.test(all)&&/Suno AI/.test(all),'Kerala song labelled AI-assisted');
ok(all.includes('Designed &amp; built with Tab'),'footer credit');
ok(all.includes('https://ye-baarish-ye-mausam.sites.tab.bot/'),'Kerala download link');
ok(all.includes('https://ig.me/m/sudarshan.4u'),'Instagram DM link');
ok(!/surge\.sh|kraft-portfolio|Alexander Sterling|KRAFT/i.test(all),'no reference brand/text copied');
ok(!/https?:\/\/[^"' )]*\.(png|jpg|jpeg|webp|mp4)/i.test(all.replace(/https:\/\/[^"' )]*instagram[^"' )]*/g,'')),'no hotlinked media');
ok(!/<script[^>]+src="https?:/i.test(all)&&!/<link[^>]+href="https?:\/\/fonts/i.test(all),'no external scripts/fonts');
// 5. Pages and nav
for(const p of ['index','gallery','about','contact'])ok(fs.existsSync(path.join(root,p+'.html')),'page '+p+'.html exists');
for(const f of files.filter(f=>f.endsWith('.html'))){const h=fs.readFileSync(f,'utf8');for(const m of h.matchAll(/(?:href|src)="([^"#:]+?)"/g)){const t=m[1];if(/^(https?|mailto|tel|data)/.test(t))continue;ok(fs.existsSync(path.join(root,t)),path.basename(f)+' -> '+t)}}
// 6. Size
const total=files.reduce((a,f)=>a+fs.statSync(f).size,0);ok(total<1.5*1024*1024,'total size '+(total/1024).toFixed(0)+' KB < 1.5 MB');
console.log(bad?`\n${bad} FAILED`:'\nALL PASSED');process.exit(bad?1:0);
