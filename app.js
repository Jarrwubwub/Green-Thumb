const KEY='gardenLedgerDataV1';
const DAY=86400000;
const SEED=[
{id:'tomato',name:'Tomato',group:'Vegetables',gmin:5,gmax:10,hmin:60,hmax:85,flower:45},
{id:'basil',name:'Basil',group:'Herbs',gmin:5,gmax:10,hmin:60,hmax:75,flower:55},
{id:'lettuce',name:'Lettuce',group:'Vegetables',gmin:4,gmax:10,hmin:45,hmax:65,flower:75},
{id:'zucchini',name:'Zucchini',group:'Vegetables',gmin:5,gmax:10,hmin:45,hmax:60,flower:35},
{id:'carrot',name:'Carrot',group:'Vegetables',gmin:10,gmax:21,hmin:70,hmax:90},
{id:'radish',name:'Radish',group:'Vegetables',gmin:3,gmax:7,hmin:25,hmax:35},
{id:'beans',name:'Beans',group:'Vegetables',gmin:7,gmax:14,hmin:50,hmax:65},
{id:'cucumber',name:'Cucumber',group:'Vegetables',gmin:3,gmax:10,hmin:50,hmax:70,flower:35},
{id:'spinach',name:'Spinach',group:'Vegetables',gmin:5,gmax:14,hmin:40,hmax:55},
{id:'capsicum',name:'Capsicum',group:'Vegetables',gmin:7,gmax:21,hmin:70,hmax:90,flower:60},
{id:'parsley',name:'Parsley',group:'Herbs',gmin:14,gmax:28,hmin:70,hmax:90},
{id:'coriander',name:'Coriander',group:'Herbs',gmin:7,gmax:14,hmin:40,hmax:50},
{id:'peas',name:'Peas',group:'Vegetables',gmin:7,gmax:14,hmin:60,hmax:70},
{id:'sunflower',name:'Sunflower',group:'Flowers',gmin:7,gmax:14,hmin:70,hmax:100,flower:55},
{id:'marigold',name:'Marigold',group:'Flowers',gmin:5,gmax:10,hmin:45,hmax:60,flower:45}
];
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const dateObj=s=>new Date(`${s}T12:00:00`);
const addDays=(s,n)=>{const d=dateObj(s);d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmt=s=>dateObj(s).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const daysBetween=(a,b)=>Math.floor((dateObj(b)-dateObj(a))/DAY);
let data=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{plantings:[],customPlants:[],settings:{}}}catch{return {plantings:[],customPlants:[],settings:{}}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function allSpecies(){return [...SEED,...data.customPlants]}
function species(id){return allSpecies().find(p=>p.id===id)}
function toast(s){const t=document.getElementById('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function milestoneList(p){const s=species(p.speciesId);if(!s)return[];const out=[{type:'Germination',min:s.gmin,max:s.gmax}];if(s.flower)out.push({type:'First flowers',min:s.flower,max:s.flower+10});out.push({type:'Harvest window',min:s.hmin,max:s.hmax});return out.map(m=>({...m,start:addDays(p.date,m.min),end:addDays(p.date,m.max)}))}
function status(p){if(p.actualSprout)return 'Sprouted';const ms=milestoneList(p)[0];const now=todayISO();if(now>ms.end)return 'Overdue';if(now>=ms.start)return 'Due now';return 'Pending'}
function render(){
 const now=todayISO();document.getElementById('todayLabel').textContent=fmt(now);
 document.getElementById('seasonLabel').textContent='Growing season';
 document.getElementById('gardenName').value=data.settings.name||'';
 document.getElementById('location').value=data.settings.location||'';
 const active=data.plantings.filter(p=>!p.archived);
 const spr=active.filter(p=>{const m=milestoneList(p)[0];return !p.actualSprout&&now>=m.start&&now<=m.end}).length;
 const har=active.filter(p=>{const m=milestoneList(p).slice(-1)[0];return now>=m.start&&now<=m.end}).length;
 document.getElementById('plantCount').textContent=active.length;document.getElementById('sproutCount').textContent=spr;document.getElementById('harvestCount').textContent=har;
 document.getElementById('plantingList').innerHTML=active.length?active.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>plantCard(p)).join(''):'<div class="empty">No plantings yet. Add your first planting to start your garden diary.</div>';
 const events=active.flatMap(p=>milestoneList(p).map(m=>({p,m}))).filter(x=>x.m.end>=now).sort((a,b)=>a.m.start.localeCompare(b.m.start)).slice(0,8);
 document.getElementById('upcomingList').innerHTML=events.length?events.map(x=>`<div class="event"><div class="event-date">${fmt(x.m.start)}${x.m.start!==x.m.end?' – '+fmt(x.m.end):''}</div><div><b>${esc(species(x.p.speciesId)?.name||'Plant')}</b><div class="tiny">${x.m.type} · ${esc(x.p.location||x.p.method)}</div></div></div>`).join(''):'<div class="empty">Your upcoming milestones will appear here.</div>';
 renderSpecies();renderCalendar();renderHistory();populateSelect();
}
function plantCard(p){const s=species(p.speciesId),m=milestoneList(p)[0],st=status(p);const label=st==='Overdue'?'Overdue':st==='Due now'?'Sprouting window':st;const cls=st==='Overdue'?'overdue':st==='Pending'?'pending':'';return `<div class="plant-row"><div><div class="plant-name">${esc(s?.name||'Unknown plant')}${p.variety?' · '+esc(p.variety):''}</div><div class="plant-meta">Planted ${fmt(p.date)} · ${daysBetween(p.date,todayISO())} days ago · ${esc(p.location||p.method)}</div><div class="plant-meta">Expected sprouting: ${fmt(m.start)} – ${fmt(m.end)}</div></div><div style="display:grid;gap:7px;justify-items:end"><span class="status ${cls}">${label}</span><button class="btn secondary" data-action="sprout" data-id="${p.id}" style="font-size:11px;padding:6px 8px">${p.actualSprout?'View sprout':'Record sprout'}</button><button class="btn ghost" data-action="detail" data-id="${p.id}" style="font-size:11px;padding:6px 8px">Details</button></div></div>`}
function renderSpecies(){const q=(document.getElementById('plantSearch').value||'').toLowerCase();const list=allSpecies().filter(p=>p.name.toLowerCase().includes(q)||p.group.toLowerCase().includes(q));document.getElementById('speciesCount').textContent=list.length+' plants';document.getElementById('speciesList').innerHTML=list.map(p=>`<div class="plant-row"><div><div class="plant-name">${esc(p.name)}</div><div class="plant-meta">${esc(p.group)} · Germination ${p.gmin}–${p.gmax} days · Harvest ${p.hmin}–${p.hmax} days</div></div><button class="btn secondary" data-action="choose" data-id="${p.id}">Plant</button></div>`).join('')}
function renderCalendar(){const events=data.plantings.filter(p=>!p.archived).flatMap(p=>milestoneList(p).map(m=>({p,m}))).sort((a,b)=>a.m.start.localeCompare(b.m.start));document.getElementById('calendarList').innerHTML=events.length?events.map(({p,m})=>`<div class="event"><div class="event-date">${fmt(m.start)}${m.start!==m.end?'<br>to '+fmt(m.end):''}</div><div><b>${esc(species(p.speciesId)?.name||'Plant')} · ${m.type}</b><div class="tiny">Planted ${fmt(p.date)}${p.actualSprout&&m.type==='Germination'?' · Sprouted '+fmt(p.actualSprout):''}</div></div></div>`).join(''):'<div class="empty">No growth milestones to show yet.</div>'}
function renderHistory(){const list=data.plantings.slice().sort((a,b)=>b.date.localeCompare(a.date));document.getElementById('historyList').innerHTML=list.length?list.map(p=>`<div class="plant-row"><div><div class="plant-name">${esc(species(p.speciesId)?.name||'Plant')} ${p.variety?'· '+esc(p.variety):''}</div><div class="plant-meta">Planted ${fmt(p.date)} · ${p.quantity} · ${p.method}${p.actualSprout?' · Sprouted '+fmt(p.actualSprout):''}</div></div><button class="btn ghost" data-action="archive" data-id="${p.id}">${p.archived?'Restore':'Archive'}</button></div>`).join(''):'<div class="empty">Your planting history will appear here.</div>'}
function populateSelect(){document.getElementById('plantSpecies').innerHTML=allSpecies().map(p=>`<option value="${p.id}">${esc(p.name)} (${p.group})</option>`).join('')}
function openPlant(id){populateSelect();if(id)document.getElementById('plantSpecies').value=id;document.getElementById('plantedDate').value=todayISO();document.getElementById('plantDialog').showModal()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('main>section').forEach(s=>s.classList.toggle('hide',s.id!==b.dataset.tab));if(b.dataset.tab==='garden')render()}));
document.getElementById('addPlantTop').onclick=()=>openPlant();document.getElementById('plantForm').addEventListener('submit',e=>{if(e.submitter?.id!=='savePlant')return;e.preventDefault();const p={id:crypto.randomUUID(),speciesId:document.getElementById('plantSpecies').value,variety:document.getElementById('variety').value.trim(),date:document.getElementById('plantedDate').value,quantity:Math.max(1,+document.getElementById('quantity').value||1),method:document.getElementById('plantMethod').value,location:document.getElementById('plantLocation').value.trim(),notes:document.getElementById('plantNotes').value.trim(),actualSprout:'',archived:false};if(!p.date){toast('Choose a planting date');return}data.plantings.push(p);save();document.getElementById('plantDialog').close();e.target.reset();render();toast('Planting saved')});
document.getElementById('plantingList').addEventListener('click',e=>action(e));document.getElementById('speciesList').addEventListener('click',e=>action(e));document.getElementById('historyList').addEventListener('click',e=>action(e));
function action(e){const b=e.target.closest('[data-action]');if(!b)return;const p=data.plantings.find(x=>x.id===b.dataset.id);if(b.dataset.action==='choose')openPlant(b.dataset.id);if(!p)return;if(b.dataset.action==='sprout'){if(!p.actualSprout){p.actualSprout=todayISO();save();render();toast('Sprouting recorded')}else alert('Recorded sprouting date: '+fmt(p.actualSprout))}if(b.dataset.action==='detail'){const s=species(p.speciesId);const ms=milestoneList(p).map(m=>`${m.type}: ${fmt(m.start)} – ${fmt(m.end)}`).join('\n');alert(`${s.name}${p.variety?' · '+p.variety:''}\nPlanted: ${fmt(p.date)}\nQuantity: ${p.quantity}\nMethod: ${p.method}\nLocation: ${p.location||'Not specified'}\n\nPredicted milestones\n${ms}\n\nNotes: ${p.notes||'None'}`)}if(b.dataset.action==='archive'){p.archived=!p.archived;save();render()}}
document.getElementById('plantSearch').addEventListener('input',renderSpecies);
document.getElementById('saveCustomPlant').onclick=()=>{const name=document.getElementById('customPlantName').value.trim(),gmin=+document.getElementById('customMin').value,gmax=+document.getElementById('customMax').value,hmin=+document.getElementById('customHarvestMin').value,hmax=+document.getElementById('customHarvestMax').value;if(!name||!gmin||!gmax||!hmin||!hmax||gmax<gmin||hmax<hmin){toast('Check the plant name and day ranges');return}data.customPlants.push({id:'custom-'+crypto.randomUUID(),name,group:'Custom',gmin,gmax,hmin,hmax});save();document.getElementById('customPlantName').value='';render();toast('Custom plant saved')};
document.getElementById('saveSettings').onclick=()=>{data.settings={name:document.getElementById('gardenName').value.trim(),location:document.getElementById('location').value.trim()};save();toast('Settings saved')};
document.getElementById('exportData').onclick=()=>{const blob=new Blob([JSON.stringify({format:'garden-ledger-backup',version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='garden-ledger-backup-'+todayISO()+'.json';a.click();URL.revokeObjectURL(a.href);document.getElementById('backupStatus').textContent='Backup exported.'};
document.getElementById('importButton').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(x.format!=='garden-ledger-backup'||!x.data||!Array.isArray(x.data.plantings))throw Error();if(!confirm('Replace the garden data on this device with this backup?'))return;data=x.data;save();render();document.getElementById('backupStatus').textContent='Backup restored.'}catch{alert('This file does not look like a valid Garden Ledger backup.')}e.target.value=''};
document.getElementById('clearAll').onclick=()=>{if(confirm('Permanently delete all Garden Ledger records from this browser? Export a backup first if you want to keep them.')){data={plantings:[],customPlants:[],settings:{}};save();render();toast('Garden data cleared')}};
render();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
