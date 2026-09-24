/* ============ utils ============ */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P={plus:'M12 5v14M5 12h14',search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',panel:'M3 5h18v14H3zM9 5v14',dl:'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',edit:'M4 20h4L19 9l-4-4L4 16z',gear:'M4 7h8m4 0h4M4 17h4m4 0h8M14 5v4M10 15v4',send:'M4 12l16-8-6 16-2-6z',spark:'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',table:'M3 5h18v14H3zM3 10h18M9 5v14',globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',doc:'M6 3h9l4 4v14H6zM9 12h7M9 16h7',deck:'M3 4h18v12H3zM8 21h8M12 16v5',code:'M8 8l-5 4 5 4M16 8l5 4-5 4',x:'M6 6l12 12M18 6L6 18',check:'M5 12l5 5 9-10',load:'M12 3a9 9 0 1 0 9 9',dot:'M12 12h.01',copy:'M9 9h11v11H9zM5 15V4h11'};
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const uid=()=>Math.random().toString(36).slice(2,10),cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const wait=ms=>new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion:reduce)').matches?60:ms));
const TYPES={auto:['Auto-detect','spark'],web:['Web app / website','globe'],sheet:['Spreadsheet','table'],doc:['Document','doc'],deck:['Presentation','deck'],code:['Code / other','code']};
const KIND_LABEL={web:'web page',sheet:'spreadsheet',doc:'document',deck:'presentation',code:'code starter'};

/* ============ state + local persistence ============ */
const KEY='aise.v1';let S={projects:[],cur:null,ui:{side:1,art:1,w:520}},sel='auto',busy=false,tab='view',q='',draft='',stT;
try{Object.assign(S.ui,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
let H={ai:false};
if(innerWidth<900)S.ui.side=0;
const cur=()=>S.projects.find(p=>p.id===S.cur);
function setStatus(t,bad){const e=$('#st');if(e){e.innerHTML=`<span class="dot ${bad?'bad':''}"></span>${esc(t)}`}}
const api=async(u,o={})=>{const r=await fetch(u,{headers:{'Content-Type':'application/json'},...o});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed ('+r.status+')');return j};
function save(){try{localStorage.setItem(KEY,JSON.stringify(S.ui))}catch(e){}clearTimeout(stT);setStatus('Saving…');stT=setTimeout(async()=>{try{await api('/api/projects',{method:'PUT',body:JSON.stringify({projects:S.projects})});setStatus('Saved')}catch(e){setStatus('Not saved: '+e.message,1)}},400)}
function toast(m){const t=$('#toast');t.textContent=m;clearTimeout(toast.t);toast.t=setTimeout(()=>t.textContent='',2600)}

/* ============ artifact renderers (UI-independent) ============ */
const shell=(t,css,body,fn)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t)}</title><style>*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,sans-serif;color:#1c1b22}${css}</style></head><body>${body}${fn?`<script>(${fn})()<\/script>`:''}</body></html>`;
const deckJS=()=>{const s=[...document.querySelectorAll('.s')],g=x=>document.getElementById(x);let i=0;const sh=()=>{s.forEach((e,k)=>e.hidden=k!==i);g('c').textContent=(i+1)+' / '+s.length};g('p').onclick=()=>{i=Math.max(0,i-1);sh()};g('n').onclick=()=>{i=Math.min(s.length-1,i+1);sh()};onkeydown=e=>{if(e.key==='ArrowRight')g('n').click();if(e.key==='ArrowLeft')g('p').click()};sh()};
const webHTML=a=>a.html||'';
const docHTML=a=>shell(a.title,'main{max-width:720px;margin:auto;padding:40px 20px}h1{font-size:2rem}h2{margin-top:2em}',`<main><h1>${esc(a.title)}</h1>${a.secs.map(s=>`<h2>${esc(s[0])}</h2><p>${esc(s[1])}</p>`).join('')}</main>`);
const docMD=a=>`# ${a.title}\n\n`+a.secs.map(s=>`## ${s[0]}\n\n${s[1]}\n`).join('\n');
const deckHTML=a=>shell(a.title,'body{background:#12102a;color:#fff;height:100vh;display:grid;grid-template-rows:1fr auto}.s{padding:8vh 8vw}.s h1{font-size:clamp(2rem,5vw,3.4rem);margin:0 0 20px}.s li{font-size:1.4rem;margin:8px 0}nav{display:flex;gap:10px;align-items:center;justify-content:center;padding:12px}nav button{padding:8px 16px;border-radius:8px;border:0;cursor:pointer}',a.slides.map(s=>`<div class="s"><h1>${esc(s[0])}</h1><ul>${s[1].map(b=>`<li>${esc(b)}</li>`).join('')}</ul></div>`).join('')+`<nav><button id="p">Previous</button><span id="c"></span><button id="n">Next</button></nav>`,deckJS);
const total=(a,i)=>a.rows.reduce((s,r)=>s+(+r[i]||0),0);
const sheetCSV=a=>[a.cols.map(c=>c[0]),...a.rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
const sheetHTML=a=>`<table><thead><tr>${a.cols.map(c=>`<th scope="col">${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${a.rows.map(r=>`<tr>${a.cols.map((c,i)=>`<td class="${c[1]}">${esc(r[i])}</td>`).join('')}</tr>`).join('')}<tr class="tot">${a.cols.map((c,i)=>c[1]==='n'?`<td class="n">${total(a,i).toLocaleString()}</td>`:`<td>${i?'':'Total'}</td>`).join('')}</tr></tbody></table>`;
/* real .xlsx: minimal ZIP (stored) + SpreadsheetML */
const CT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t.push(c>>>0)}return t})();
const crc=b=>{let r=-1;for(const x of b)r=CT[(r^x)&255]^(r>>>8);return(r^-1)>>>0};
function zip(files,type){const e=new TextEncoder(),parts=[],cd=[];let off=0;
for(const[n,d]of files){const nb=e.encode(n),db=e.encode(d),c=crc(db),h=new DataView(new ArrayBuffer(30)),g=new DataView(new ArrayBuffer(46));
h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint32(14,c,true);h.setUint32(18,db.length,true);h.setUint32(22,db.length,true);h.setUint16(26,nb.length,true);
g.setUint32(0,0x02014b50,true);g.setUint16(4,20,true);g.setUint16(6,20,true);g.setUint32(16,c,true);g.setUint32(20,db.length,true);g.setUint32(24,db.length,true);g.setUint16(28,nb.length,true);g.setUint32(42,off,true);
parts.push(h,nb,db);cd.push(g,nb);off+=30+nb.length+db.length}
const cl=cd.reduce((s,x)=>s+x.byteLength,0),z=new DataView(new ArrayBuffer(22));
z.setUint32(0,0x06054b50,true);z.setUint16(8,files.length,true);z.setUint16(10,files.length,true);z.setUint32(12,cl,true);z.setUint32(16,off,true);
return new Blob([...parts,...cd,z],{type})}
function sheetXLSX(a){const L=i=>String.fromCharCode(65+i),n=a.rows.length,X='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',NS='xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const s=(r,v,st)=>`<c r="${r}" t="inlineStr"${st?` s="${st}"`:''}><is><t>${esc(v)}</t></is></c>`;
const rows=[`<row r="1">${a.cols.map((c,i)=>s(L(i)+1,c[0],1)).join('')}</row>`,...a.rows.map((r,y)=>`<row r="${y+2}">${a.cols.map((c,i)=>c[1]==='n'?`<c r="${L(i)}${y+2}" s="2"><v>${+r[i]||0}</v></c>`:s(L(i)+(y+2),r[i]??'')).join('')}</row>`),
`<row r="${n+2}">${a.cols.map((c,i)=>c[1]==='n'?`<c r="${L(i)}${n+2}" s="3"><f>SUM(${L(i)}2:${L(i)}${n+1})</f></c>`:i?'':s('A'+(n+2),'Total',3)).join('')}</row>`].join('');
const sn=a.title.replace(/[\\\/?*\[\]:]/g,' ').slice(0,31)||'Sheet1';
return zip([
['[Content_Types].xml',`${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
['_rels/.rels',`${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
['xl/workbook.xml',`${X}<workbook ${NS} xmlns:r="${R}"><sheets><sheet name="${esc(sn)}" sheetId="1" r:id="rId1"/></sheets><calcPr fullCalcOnLoad="1"/></workbook>`],
['xl/_rels/workbook.xml.rels',`${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/styles" Target="styles.xml"/></Relationships>`],
['xl/styles.xml',`${X}<styleSheet ${NS}><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF5B3DF5"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf numFmtId="4" applyNumberFormat="1"/><xf numFmtId="4" fontId="2" applyNumberFormat="1" applyFont="1"/></cellXfs></styleSheet>`],
['xl/worksheets/sheet1.xml',`${X}<worksheet ${NS}><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${a.cols.length}" width="20" customWidth="1"/></cols><sheetData>${rows}</sheetData></worksheet>`]
],'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
const slug=s=>(s||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'project';
function files(a){const n=slug(a.name||a.title),tx=(t,m)=>new Blob([t],{type:m});
if(a.kind==='web')return[['Download .html',n+'.html',()=>tx(webHTML(a),'text/html')]];
if(a.kind==='sheet')return[['Download .xlsx',n+'.xlsx',()=>sheetXLSX(a)],['CSV',n+'.csv',()=>tx(sheetCSV(a),'text/csv')]];
if(a.kind==='doc')return[['Download .html',n+'.html',()=>tx(docHTML(a),'text/html')],['Markdown',n+'.md',()=>tx(docMD(a),'text/markdown')]];
if(a.kind==='deck')return[['Download .html',n+'.html',()=>tx(deckHTML(a),'text/html')]];
return[['Download '+a.file,a.file,()=>tx(a.body,'text/plain')]]}
const srcOf=a=>a.kind==='web'?webHTML(a):a.kind==='sheet'?sheetCSV(a):a.kind==='doc'?docMD(a):a.kind==='deck'?deckHTML(a):a.body;


/* ============ actions ============ */
function err(m){const e=$('#err');if(e){e.textContent=m;$('#tx').focus()}}
function valid(t){if(t.length<8)return'Add a little more detail (at least 8 characters) so the agent knows what you need.';if(t.length>2000)return'That request is over 2,000 characters. Shorten it or split it into follow-ups.';return''}
async function submit(text){text=text.trim();const v=valid(text);if(v)return err(v);if(busy)return;
let p=cur();if(!p){p={id:uid(),title:cap(text.slice(0,44)),type:sel,msgs:[],plan:[],art:null,t:Date.now()};S.projects.unshift(p);S.cur=p.id}
p.msgs.push({r:'u',t:text});draft='';busy=true;tab='view';p.plan=[{t:'Working on your request',s:'run'}];render();
try{const r=await api('/api/chat',{method:'POST',body:JSON.stringify({message:text,type:p.type||'auto',history:p.msgs.slice(-11,-1),artifact:p.art})});
p.plan=(r.plan||[]).map(t=>({t,s:'done'}));if(r.artifact){p.art=r.artifact;S.ui.art=1}p.msgs.push({r:'a',t:r.reply})}
catch(e){p.plan=[{t:'Request failed',s:'fail'}];p.msgs.push({r:'a',t:e.message})}
busy=false;p.t=Date.now();render();save()}
function del(id){const p=S.projects.find(x=>x.id===id);if(p&&confirm(`Delete “${p.title}”? This cannot be undone.`)){S.projects=S.projects.filter(x=>x.id!==id);if(S.cur===id)S.cur=null;render();save()}}
function ren(id){const p=S.projects.find(x=>x.id===id),n=p&&prompt('Rename project',p.title);if(n&&n.trim()){p.title=n.trim().slice(0,80);render();save()}}
async function copy(){try{await navigator.clipboard.writeText(srcOf(cur().art));toast('Copied to clipboard')}catch(e){toast('Copy is blocked here. Select the text and copy it manually.')}}
function dl(i){const a=cur().art,f=files(a)[i];try{const u=URL.createObjectURL(f[2]()),l=document.createElement('a');l.href=u;l.download=f[1];document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Downloaded '+f[1])}catch(e){toast('Download failed: '+e.message)}}
const EXAMPLES=[['Build a student attendance page','web','globe','Working mark-present, late and absent page.'],['Create an Excel sheet to track monthly expenses','sheet','table','Real .xlsx with a SUM formula.'],['Create a website for my bakery','web','globe','Responsive site with menu and contact form.'],['Add a dashboard to my existing project','web','globe','Explains the limits, builds a standalone dashboard.'],['Make a pitch deck for a food delivery startup','deck','deck','Keyboard-navigable slide deck.']];

/* ============ views ============ */
function renderSide(){const l=S.projects.filter(p=>p.title.toLowerCase().includes(q.toLowerCase()));
$('#side').innerHTML=`<div class="brand"><span class="mark">${ic('code')}</span><span>AI Software Engineer Tool</span></div><button class="btn pri" data-act="new">${ic('plus')}New project</button><label class="sr" for="qs">Search projects</label><input class="srch" id="qs" placeholder="Search projects" value="${esc(q)}"><div class="h6">Recent work</div>${l.length?l.map(p=>`<div class="pi ${p.id===S.cur?'on':''}"><button class="o" data-act="open" data-id="${p.id}" title="${esc(p.title)}">${esc(p.title)}</button><button class="ib" data-act="ren" data-id="${p.id}" aria-label="Rename ${esc(p.title)}" title="Rename">${ic('edit')}</button><button class="ib" data-act="del" data-id="${p.id}" aria-label="Delete ${esc(p.title)}" title="Delete">${ic('trash')}</button></div>`).join(''):`<div class="mut" style="padding:6px 4px">${S.projects.length?'No projects match that search.':'No projects yet. Your first request creates one.'}</div>`}<div class="h6">Templates</div>${EXAMPLES.slice(0,3).map((e,i)=>`<button class="pi o" style="padding:8px;background:none;border:0;text-align:left" data-act="ex" data-i="${i}">${ic(e[2])} ${esc(e[0])}</button>`).join('')}<div style="flex:1"></div><button class="btn" data-act="settings">${ic('gear')}Settings and integrations</button>`}
function renderTop(){const p=cur();$('#top').innerHTML=`<button class="ib" data-act="side" aria-label="Toggle sidebar" title="Toggle sidebar">${ic('panel')}</button><div class="t">${p?esc(p.title):'New project'}</div>${p?`<button class="ib" data-act="ren" data-id="${p.id}" aria-label="Rename project" title="Rename project">${ic('edit')}</button>`:''}<span class="tag hide-m">${H.ai?esc(H.model):'AI not configured'}</span><span class="st" id="st"><span class="dot"></span>Saved</span>${p&&p.art?`<button class="btn" data-act="art" title="Show or hide preview">${ic('globe')}<span class="hide-m">Preview</span></button>`:''}`}
function composer(p){return`<div class="comp"><label class="sr" for="tx">${p?'Follow-up instruction':'Describe what you want to build'}</label><textarea id="tx" rows="${p?2:4}" maxlength="2100" placeholder="${p?'Refine it, e.g. “make it green”':'e.g. Build a student attendance page'}">${esc(draft)}</textarea><div id="err" class="err" role="alert"></div><div class="crow">${p?'':`<div class="chips" role="radiogroup" aria-label="Output type">${Object.entries(TYPES).map(([k,v])=>`<button class="chip" role="radio" aria-checked="${sel===k}" data-act="type" data-k="${k}">${ic(v[1])}${v[0]}</button>`).join('')}</div>`}<span class="cnt" id="cnt">${draft.length}/2000</span><button class="go" data-act="send" ${busy?'disabled':''}>${ic(busy?'load':'send',busy?'spin':'')}${busy?'Working…':p?'Send':'Build it'}</button></div></div>`}
const SUG={web:['Make it green','Add a pricing section','Add an FAQ section'],sheet:['Add column Notes','Add row'],doc:['Add section Risks'],deck:['Add slide Roadmap'],code:['Use JavaScript']};
function renderMain(){const p=cur(),mv=$('#mv'),dk=$('#dock');
if(!p){dk.innerHTML='';mv.innerHTML=`<div class="home"><h1>Say what you want. Get something you can use.</h1><p class="lead">Describe a page, a spreadsheet, a document or a deck. The agent plans it, builds it, shows a live preview and gives you a real file to download.</p>${composer(null)}<div class="ex">${EXAMPLES.map((e,i)=>`<button class="card" data-act="ex" data-i="${i}"><b>${ic(e[2])}${esc(e[0])}</b><span class="mut">${esc(e[3])}</span></button>`).join('')}</div><div class="h6" style="margin-top:22px">Recent projects</div>${S.projects.length?S.projects.slice(0,3).map(x=>`<button class="card" style="margin-top:8px;width:100%" data-act="open" data-id="${x.id}"><b>${esc(x.title)}</b><span class="mut">${x.msgs.length} messages, updated ${new Date(x.t).toLocaleString()}</span></button>`).join(''):`<div class="empty">Nothing here yet. Pick an example above or type your own request.</div>`}</div>`;return}
mv.innerHTML=p.msgs.map((m,i)=>`<div class="msg ${m.r}"><div class="bub">${m.r==='a'?'<small>Agent</small>':''}${esc(m.t)}</div></div>`).join('')+(p.plan.length?`<div class="plan"><b>Plan</b><ul>${p.plan.map(s=>`<li class="${s.s}">${ic(s.s==='done'?'check':s.s==='run'?'load':'dot',s.s==='run'?'spin':'')}${esc(s.t)}${s.s==='fail'?' (failed)':''}</li>`).join('')}</ul></div>`:'');
dk.innerHTML=`<div class="dock">${p.art?`<div class="sug">${(SUG[p.art.kind]||[]).map(s=>`<button class="chip" data-act="sug" data-t="${esc(s)}">${esc(s)}</button>`).join('')}</div>`:''}${composer(p)}</div>`;mv.scrollTop=mv.scrollHeight}
function renderArt(){const p=cur(),el=$('#art');if(!p||!p.art){el.innerHTML='';return}const a=p.art,two=a.kind!=='code';
el.innerHTML=`<div class="ah"><div class="tabs" role="tablist"><button role="tab" aria-selected="${tab==='view'}" data-act="tab" data-k="view">${a.kind==='code'?'Code':'Preview'}</button>${two?`<button role="tab" aria-selected="${tab==='src'}" data-act="tab" data-k="src">${a.kind==='sheet'?'CSV data':a.kind==='doc'?'Markdown':'Source'}</button>`:''}</div><button class="ib" data-act="copy" aria-label="Copy source" title="Copy source">${ic('copy')}</button>${files(a).map((f,i)=>`<button class="btn ${i?'':'pri'}" data-act="dl" data-i="${i}">${i?'':ic('dl')}${esc(f[0])}</button>`).join('')}</div><div class="ab ${tab==='src'||a.kind==='code'||a.kind==='sheet'?'dk':''}">${tab==='src'||a.kind==='code'?`<pre>${esc(srcOf(a))}</pre>`:a.kind==='sheet'?sheetHTML(a):`<iframe id="pv" title="Live preview" sandbox="allow-scripts"></iframe>`}</div>`;
const f=$('#pv');if(f)f.srcdoc=a.kind==='web'?webHTML(a):a.kind==='doc'?docHTML(a):deckHTML(a)}
function render(){document.body.classList.toggle('no-side',!S.ui.side);const p=cur();document.body.classList.toggle('no-art',!S.ui.art||!p||!p.art);document.documentElement.style.setProperty('--aw',S.ui.w+'px');renderSide();renderTop();renderMain();renderArt()}

/* ============ events ============ */
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const d=b.dataset;
({new:()=>{S.cur=null;draft='';render()},open:()=>{S.cur=d.id;if(innerWidth<900)S.ui.side=0;render();save()},del:()=>del(d.id),ren:()=>ren(d.id),side:()=>{S.ui.side=S.ui.side?0:1;render()},art:()=>{S.ui.art=S.ui.art?0:1;render()},
type:()=>{sel=d.k;const t=$('#tx');draft=t?t.value:draft;render()},tab:()=>{tab=d.k;renderArt()},copy,dl:()=>dl(+d.i),
ex:()=>{const x=EXAMPLES[+d.i];S.cur=null;sel=x[1];draft=x[0];render();$('#tx').focus()},sug:()=>submit(d.t),
send:()=>submit($('#tx').value),settings:()=>{$('#dlg').innerHTML=`<h2 style="margin-top:0">Settings and integrations</h2><p><span class="tag">${H.ai?'AI connected':'AI not configured'}</span> ${H.ai?'Model: '+esc(H.model):'Set ANTHROPIC_API_KEY in the server .env file and restart the server.'}</p><p class="mut">The API key stays on the server and is never sent to the browser. Projects are stored on the server.</p><div style="display:flex;gap:8px;justify-content:space-between"><button class="btn" data-act="wipe">Delete all projects</button><button class="btn pri" data-act="close">Close</button></div>`;$('#dlg').showModal()},
close:()=>$('#dlg').close(),wipe:()=>{if(confirm('Delete every project stored on the server? This cannot be undone.')){S.projects=[];S.cur=null;render();save();$('#dlg').close()}}}[d.act]||(()=>{}))()});
document.addEventListener('input',e=>{if(e.target.id==='tx'){draft=e.target.value;$('#cnt').textContent=draft.length+'/2000'}if(e.target.id==='qs'){q=e.target.value;const s=e.target.selectionStart;renderSide();const n=$('#qs');n.focus();n.setSelectionRange(s,s)}});
document.addEventListener('keydown',e=>{if(e.target.id==='tx'&&e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();submit(e.target.value)}});
$('#rz').addEventListener('pointerdown',e=>{const mv=ev=>{S.ui.w=Math.max(320,Math.min(innerWidth-520,innerWidth-ev.clientX));document.documentElement.style.setProperty('--aw',S.ui.w+'px')},up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);save()};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
$('#rz').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){S.ui.w=Math.max(320,Math.min(innerWidth-520,S.ui.w+(e.key==='ArrowLeft'?30:-30)));render();save()}});
(async()=>{try{S.projects=(await api('/api/projects')).projects}catch(e){toast(e.message)}try{H=await api('/api/health')}catch(e){}render()})();
