/* ===========================================================
   Paw Care Vet Clinic — Main App Script (Frontend)
   Includes: login, sidebar, recent, local DB, repo helpers,
   backend toggle with API fallback (from assets/api.js)
   =========================================================== */

/* ===== Login (demo credentials per role) ===== */
const DEMO_USERS = {
  admin:        { username: "admin",        password: "admin123" },
  vet:          { username: "vet",          password: "vet123" },
  receptionist: { username: "reception",    password: "reception123" },
  pharmacist:   { username: "pharm",        password: "pharm123" }
};
window.tryLogin = function(username, password, role) {
  if (!role) return { ok: false, msg: "Please select a role first." };
  const acct = DEMO_USERS[role];
  if (!acct) return { ok: false, msg: "Unknown role." };
  if (username !== acct.username || password !== acct.password) {
    return { ok: false, msg: "Invalid username or password for the selected role." };
  }
  localStorage.setItem("role", role);
  localStorage.setItem("userDisplayName", username);
  return { ok: true };
};
window.logout = function(){ localStorage.removeItem("role"); localStorage.removeItem("userDisplayName"); location.href="index.html"; };

/* ===== Roles, sidebar, guard ===== */
const CONFIG = {
  admin:        ["dashboard","pet-records","appointments","prescriptions","reports","manage-users"],
  vet:          ["dashboard","pet-records","appointments","prescriptions","reports"],
  receptionist: ["dashboard","pet-records","appointments"],
  pharmacist:   ["dashboard","pet-records","prescriptions"]
};
const LABEL = {
  "dashboard":"Dashboard","pet-records":"Pet Records","appointments":"Appointments",
  "prescriptions":"Prescriptions","reports":"Reports","manage-users":"Manage Users"
};
const ROLE_COPY = {
  admin:{ welcome:"Full access. Manage users, pets, appointments, and prescriptions." },
  vet:{ welcome:"Review/approve appointments and issue prescriptions." },
  receptionist:{ welcome:"Create appointments and manage client check-ins." },
  pharmacist:{ welcome:"View/dispense prescriptions and print PDFs." }
};
window.getRole = ()=> localStorage.getItem("role") || "";
window.ensureLoggedIn = ()=> { if(!localStorage.getItem("role")) location.href="index.html"; };
window.renderSidebar = (container, role, activeFile)=>{
  container.innerHTML="";
  (CONFIG[role]||[]).forEach(key=>{
    const btn=document.createElement("button");
    btn.className="px-4 py-3 text-left rounded-md font-medium text-gray-700 hover:bg-[var(--soft-teal)] hover:text-white transition";
    btn.textContent=LABEL[key];
    btn.onclick=()=>location.href=`${key}.html`;
    if(`${key}.html`===activeFile) btn.classList.add("bg-[var(--soft-teal)]","text-white");
    container.appendChild(btn);
  });
};
window.ROLE_COPY = ROLE_COPY;
window.guard = (pageKey)=>{ window.ensureLoggedIn(); const role=window.getRole(); const allowed=CONFIG[role]||[]; if(!allowed.includes(pageKey)) location.href="dashboard.html"; };

/* ===== Quick actions (dashboard) ===== */
window.renderQuickActions = function(el,role){
  el.innerHTML="";
  const card=(title,href,icon)=>{
    const b=document.createElement("button");
    b.className="text-left w-full bg-[#f7fbfb] hover:bg-[#eef6f6] border border-gray-200 rounded-xl p-5 shadow-soft";
    b.innerHTML=`<div class='text-2xl mb-2'>${icon}</div><div class='font-semibold'>${title}</div>`;
    b.onclick=()=>location.href=href; return b;
  };
  const m={
    admin:[card("Add Pet Record","pet-records.html","➕"),card("Create Appointment","appointments.html","📅"),card("Manage Users","manage-users.html","👥"),card("Issue Prescription","prescriptions.html","💊"),card("View Reports","reports.html","📈")],
    vet:[card("Review Appointments","appointments.html","📅"),card("Issue Prescription","prescriptions.html","💊"),card("View Reports","reports.html","📈"),card("View Pet Records","pet-records.html","🐾")],
    receptionist:[card("Create Appointment","appointments.html","📅"),card("Add Pet Record","pet-records.html","➕"),card("View Pet Records","pet-records.html","🐾")],
    pharmacist:[card("View Prescriptions","prescriptions.html","💊"),card("Dispense & Print","prescriptions.html","🖨️"),card("View Pet Records","pet-records.html","🐾")]
  };
  (m[role]||[]).forEach(c=>el.appendChild(c));
};

/* ===== Recent activity (local only) ===== */
const REC_KEY="pawcare_recent_v1";
const recDb = ()=> JSON.parse(localStorage.getItem(REC_KEY) || '{"recent":[]}');
const recSave = (d)=> localStorage.setItem(REC_KEY, JSON.stringify(d));
function pushRecent(text){ const d=recDb(); d.recent.unshift({text,ts:Date.now()}); d.recent=d.recent.slice(0,30); recSave(d); }
function clearRecent(){ recSave({recent:[]}); }
window.renderRecent = function(el){
  const r=recDb().recent;
  const wrap = document.createElement("div");
  wrap.innerHTML = r.length ? r.map(i=>`<div class="text-sm">${new Date(i.ts).toLocaleString()} — ${i.text}</div>`).join("") : `<div class="text-gray-500">Nothing yet.</div>`;
  el.innerHTML = `<div class="mb-2"><button class="border px-3 py-1 rounded-md text-sm hover:bg-gray-50" onclick="window._clearRecent()">Clear recent activity</button></div>`;
  el.appendChild(wrap);
};
window._clearRecent = ()=>{ clearRecent(); const el=document.getElementById("recentList"); if(el) window.renderRecent(el); };

/* ===== Backend toggle + API wrapper (from assets/api.js) ===== */
const USE_API = window.USE_API ?? false;   // set in assets/api.js
const Api     = window.Api     ?? null;    // set in assets/api.js

/* ===== Local DB (fallback when USE_API=false) ===== */
const DB_KEY='pawcare_db_core_v1';
const DEFAULT_DB={
  pets:[
    {id:1,name:'Choco',contactNumber:'09123456789',species:'Canine',breed:'Beagle',gender:'Female',age:3,microchip:'12345678',owner:'Maria Santos',address:'123 Mabini St.',federation:'N/A',photo:null,procedures:[{date:'2025-10-01',procedure:'Deworming',notes:'Single dose',vet:'Dr. Cruz'}]},
    {id:2,name:'Mimi',contactNumber:'09987654321',species:'Feline',breed:'Persian',gender:'Male',age:2,microchip:'22334455',owner:'John Dela Cruz',address:'45 Narra St.',federation:'FCCI',photo:null,procedures:[]},
  ],
  appts:[{id:1,petId:1,owner:'Maria Santos',date:'2025-10-20',time:'10:00',vet:'Dr. Cruz',status:'Pending',completedAt:null}],
  rx:[{id:1,petId:1,owner:'Maria Santos',pet:'Choco',drug:'Amoxicillin',dosage:'250 mg',directions:'Twice daily',prescriber:'Dr. Cruz',date:'2025-10-17',dispensed:false,dispensedAt:null}],
  users:[{id:1,name:'Admin',role:'admin'},{id:2,name:'Dr. Cruz',role:'vet'},{id:3,name:'Daisy',role:'receptionist'},{id:4,name:'Paul',role:'pharmacist'}]
};
function _db(){ const raw=localStorage.getItem(DB_KEY); if(!raw){ localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB)); return structuredClone(DEFAULT_DB); } return JSON.parse(raw); }
function _save(d){ localStorage.setItem(DB_KEY, JSON.stringify(d)); }

/* Helpers */
window.fileToDataURL = file => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
window.petName  = id => { const p=_db().pets.find(x=>x.id===Number(id)); return p?p.name:`#${id}`; };
window.ownerForPet = id => { const p=_db().pets.find(x=>x.id===Number(id)); return p?.owner||''; };

/* ===== Local operations ===== */
// Pets
function localListPets(){ return _db().pets; }
function localGetPet(id){ return _db().pets.find(p=>p.id===Number(id)); }
function localAddPet(p){ const d=_db(); p.id=(d.pets.at(-1)?.id||0)+1; p.photo=p.photo??null; p.procedures=p.procedures||[]; d.pets.push(p); _save(d); pushRecent(`Added pet ${p.name}`); return p; }
function localUpdatePet(p){ const d=_db(); const i=d.pets.findIndex(x=>x.id===p.id); if(i>-1){ d.pets[i]=p; _save(d); pushRecent(`Updated pet ${p.name}`);} }
function localDeletePet(id){ const d=_db(); const p=d.pets.find(x=>x.id===id); d.pets=d.pets.filter(x=>x.id!==id); _save(d); pushRecent(`Deleted pet ${p?.name||'#'+id}`); }
function localAddProcedure(petId, proc){ const d=_db(); const p=d.pets.find(x=>x.id===Number(petId)); if(!p) return; p.procedures=p.procedures||[]; p.procedures.push(proc); _save(d); pushRecent(`Procedure for ${p.name}: ${proc.procedure}`); }

// Appointments (minimal for pages to work)
function localListAppts(){ return _db().appts; }
function localCreateAppt(a){ const d=_db(); a.id=(d.appts.at(-1)?.id||0)+1; a.status='Pending'; d.appts.push(a); _save(d); pushRecent(`Appointment created for ${a.owner} (${window.petName(a.petId)})`); }
function localApproveAppt(id){ const d=_db(); const ap=d.appts.find(x=>x.id===id); if(ap){ ap.status='Approved by Vet'; _save(d); pushRecent(`Appointment approved for ${ap.owner}`);} }
function localDoneAppt(id){ const d=_db(); const ap=d.appts.find(x=>x.id===id); if(ap){ ap.status='Done'; ap.completedAt=new Date().toISOString().slice(0,10); _save(d); pushRecent(`Appointment done for ${ap.owner}`);} }
function localDeleteAppt(id){ const d=_db(); d.appts=d.appts.filter(x=>x.id===id?false:true); _save(d); }

// Prescriptions (minimal)
function localListRx(){ return _db().rx; }
function localCreateRx(r){ const d=_db(); r.id=(d.rx.at(-1)?.id||0)+1; r.dispensed=false; d.rx.push(r); _save(d); pushRecent(`Prescription for ${r.pet}`); }
function localDispenseRx(id){ const d=_db(); const r=d.rx.find(x=>x.id===id); if(r){ r.dispensed=true; r.dispensedAt=new Date().toISOString().slice(0,10); _save(d); pushRecent(`Prescription #${id} dispensed`);} }

/* ===== Repo layer (API when USE_API=true, otherwise local) ===== */
// Pets
window.repoListPets   = async ()=> USE_API && Api ? await Api.pets.list() : localListPets();
window.repoGetPet     = async (id)=> USE_API && Api ? await Api.pets.get(id) : localGetPet(id);
window.repoAddPet     = async (p, rawFile=null)=>{
  if(USE_API && Api){
    const created = await Api.pets.create(p);
    if(rawFile) await Api.pets.uploadPhoto(created.id, rawFile);
    return created;
  } else {
    return localAddPet(p);
  }
};
window.repoUpdatePet  = async (p)=> USE_API && Api ? await Api.pets.update(p) : localUpdatePet(p);
window.repoDeletePet  = async (id)=> USE_API && Api ? await Api.pets.remove(id) : localDeletePet(id);
window.repoAddProcedure = async (petId, proc)=> USE_API && Api ? await Api.pets.addProcedure(petId, proc) : localAddProcedure(petId, proc);

// Appointments
window.repoListAppts   = async ()=> USE_API && Api ? await Api.appts.list() : localListAppts();
window.repoCreateAppt  = async (a)=> USE_API && Api ? await Api.appts.create(a) : localCreateAppt(a);
window.repoApproveAppt = async (id)=> USE_API && Api ? await Api.appts.approve(id) : localApproveAppt(id);
window.repoDoneAppt    = async (id)=> USE_API && Api ? await Api.appts.done(id) : localDoneAppt(id);
window.repoDeleteAppt  = async (id)=> USE_API && Api ? await Api.appts.remove(id) : localDeleteAppt(id);

// Prescriptions
window.repoListRx      = async ()=> USE_API && Api ? await Api.rx.list() : localListRx();
window.repoCreateRx    = async (r)=> USE_API && Api ? await Api.rx.create(r) : localCreateRx(r);
window.repoDispenseRx  = async (id)=> USE_API && Api ? await Api.rx.dispense(id) : localDispenseRx(id);

/* ===== Reports stubs (optional) ===== */
window.repoSummary = async (period, from, to)=>{
  // simple local summary; API version handled in assets/api.js if you added it
  const today = new Date(); const fmt = d=>d.toISOString().slice(0,10);
  let f,t;
  if(period==='day'){ f=t=fmt(today); }
  else if(period==='week'){ const d=new Date(); d.setDate(d.getDate()-6); f=fmt(d); t=fmt(today); }
  else if(period==='month'){ const d=new Date(); d.setDate(1); f=fmt(d); t=fmt(today); }
  else { f=from; t=to; }
  const d=_db();
  const between=(s)=> s>=f && s<=t;
  const apptsDone=d.appts.filter(a=>a.status==='Done' && a.completedAt && between(a.completedAt)).length;
  const rxDisp=d.rx.filter(r=>r.dispensed && r.dispensedAt && between(r.dispensedAt)).length;
  const events=(recDb().recent||[]).map(x=>({ts:new Date(x.ts).toISOString(),type:'EVENT',message:x.text}));
  return { period, from:f, to:t, appointmentsDone:apptsDone, prescriptionsDispensed:rxDisp, petsAdded:0, events };
};
window.repoOpsLog = async (from,to)=>[]; // not used unless you added reports.html

/* ===== End ===== */
