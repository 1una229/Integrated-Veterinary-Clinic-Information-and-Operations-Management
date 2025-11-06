/* ===========================================================
   Paw Care Vet Clinic — Main App Script (Frontend)
   =========================================================== */

/* ===== DEMO LOGIN (simple credentials per role) ===== */
const DEMO_USERS = {
  admin:        { username: "admin",        password: "admin123" },
  vet:          { username: "vet",          password: "vet123" },
  receptionist: { username: "reception",    password: "reception123" },
  pharmacist:   { username: "pharm",        password: "pharm123" }
};

window.tryLogin = function(username, password, role) {
  if (!role) return { ok: false, msg: "Please select a role first." };
  const acct = DEMO_USERS[role];
  if (!acct) return { ok: false, msg: "Unknown role. Pick one from the left." };

  if (username !== acct.username || password !== acct.password) {
    return { ok: false, msg: "Invalid username or password for the selected role." };
  }

  localStorage.setItem("role", role);
  localStorage.setItem("userDisplayName", username);
  return { ok: true };
};

/* ===== Log out ===== */
window.logout = function() {
  localStorage.removeItem("role");
  localStorage.removeItem("userDisplayName");
  location.href = "index.html";
};

/* ===== Role & Sidebar ===== */
const CONFIG = {
  admin:        ["dashboard","pet-records","appointments","prescriptions","reports","manage-users"],
  vet:          ["dashboard","pet-records","appointments","prescriptions","reports"],
  receptionist: ["dashboard","pet-records","appointments"],
  pharmacist:   ["prescriptions"]
};

const LABEL = {
  "dashboard":"Dashboard",
  "pet-records":"Pet Records",
  "appointments":"Appointments",
  "prescriptions":"Prescriptions",
  "reports":"Reports",
  "manage-users":"Manage Users"
};

const ROLE_COPY = {
  admin:{ welcome:"Full access. Manage users, pets, appointments, and prescriptions." },
  vet:{ welcome:"Review/approve appointments and issue prescriptions." },
  receptionist:{ welcome:"Create appointments and manage client check-ins." },
  pharmacist:{ welcome:"View/dispense prescriptions and print PDFs." }
};

window.getRole = function(){ return localStorage.getItem("role") || ""; };
window.getUserName = function(){ return localStorage.getItem("userDisplayName") || ""; };

window.ensureLoggedIn = function(){
  if(!localStorage.getItem("role")) location.href="index.html";
};

window.renderSidebar = function(container, role, activeFile){
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

/* ===== Dashboard Quick Actions ===== */
window.renderQuickActions = function(el,role){
  el.innerHTML="";
  const make = (title,href,icon)=> {
    const b=document.createElement("button");
    b.className="text-left w-full bg-[#f7fbfb] hover:bg-[#eef6f6] border border-gray-200 rounded-xl p-5 shadow-soft";
    b.innerHTML=`<div class='text-2xl mb-2'>${icon}</div><div class='font-semibold'>${title}</div>`;
    b.onclick=()=>location.href=href;
    return b;
  };
  const map={
    admin:[make("Add Pet Record","pet-records.html","➕"),make("Create Appointment","appointments.html","📅"),make("Manage Users","manage-users.html","👥"),make("Issue Prescription","prescriptions.html","💊"),make("View Reports","reports.html","📈")],
    vet:[make("Review Appointments","appointments.html","📅"),make("Issue Prescription","prescriptions.html","💊"),make("View Reports","reports.html","📈"),make("View Pet Records","pet-records.html","🐾")],
    receptionist:[make("Create Appointment","appointments.html","📅"),make("Add Pet Record","pet-records.html","➕"),make("View Pet Records","pet-records.html","🐾")],
    pharmacist:[make("View Prescriptions","prescriptions.html","💊"),make("Dispense & Print","prescriptions.html","🖨️"),make("View Pet Records","pet-records.html","🐾")]
  };
  (map[role]||[]).forEach(btn=>el.appendChild(btn));
};

/* ===== Global Error Handler (helps on desktop builds without DevTools) ===== */
if(!window.__pawcare_error_handler_installed){
  window.__pawcare_error_handler_installed = true;
  window.addEventListener('error', function(e){
    try{
      const msg = e?.message || 'Unknown script error';
      console && console.error && console.error('GlobalError:', e?.error||e);
      alert('Error: ' + msg);
    }catch(_){/* ignore */}
  });
  window.addEventListener('unhandledrejection', function(e){
    try{
      const reason = e && (e.reason?.message || e.reason || '').toString();
      console && console.error && console.error('UnhandledRejection:', e?.reason||e);
      alert('Error: ' + (reason || 'Unknown promise rejection'));
    }catch(_){/* ignore */}
  });
}

/* ===== Recent Activity (local only) ===== */
const DB_KEY="pawcare_recent";
function db(){const raw=localStorage.getItem(DB_KEY);return raw?JSON.parse(raw):{recent:[]};}
function save(d){localStorage.setItem(DB_KEY,JSON.stringify(d));}
function pushRecent(txt){
  const d=db();
  d.recent.unshift({text:txt,ts:Date.now()});
  d.recent=d.recent.slice(0,20);
  save(d);
}
function clearRecent(){save({recent:[]});}

window.renderRecent=function(el){
  const d=db().recent;
  const clearBtn=document.createElement("div");
  clearBtn.className="mb-2";
  clearBtn.innerHTML=`<button class='border px-3 py-1 rounded-md text-sm hover:bg-gray-50' onclick='window._clearRecent()'>Clear recent activity</button>`;
  el.innerHTML="";
  el.appendChild(clearBtn);
  const wrap=document.createElement("div");
  wrap.innerHTML=d.length
    ? d.map(i=>`<div class='text-sm'>${new Date(i.ts).toLocaleString()} — ${i.text}</div>`).join("")
    : `<div class='text-gray-500'>Nothing yet.</div>`;
  el.appendChild(wrap);
};

window._clearRecent=()=>{clearRecent();const el=document.getElementById("recentList");if(el)window.renderRecent(el);};

/* ===== Domain Constants & Validation ===== */
window.SPECIES_TO_BREEDS = {
  Canine: [
    "Aspin","Labrador","Golden Retriever","German Shepherd","Poodle","Shih Tzu","Pug","Beagle","Husky","Dachshund","Chihuahua","Rottweiler","French Bulldog","Corgi","Border Collie"
  ],
  Feline: [
    "Puspin","Persian","Siamese","Maine Coon","British Shorthair","American Shorthair","Ragdoll","Scottish Fold","Bengal","Sphynx","Russian Blue","Norwegian Forest","Burmese","Abyssinian","Manx"
  ]
};

window.validatePhone = function(phone){
  const cleaned = (phone||"").replace(/[^0-9+\-()\s]/g,"");
  return cleaned.length >= 7;
};

window.validateEmail = function(email){
  if(!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* ===== Procedure Catalog & Prices (PHP) ===== */
window.PROCEDURE_CATALOG = {
  'Consultation & Check-up': [
    { name:'Consultation Fee', price:350, medications:'', dosage:'', directions:'' },
    { name:'After 9:00 PM', price:500, medications:'', dosage:'', directions:'' },
    { name:'Emergency Fee', price:800, medications:'', dosage:'', directions:'' },
    { name:'Follow-Up', price:250, medications:'', dosage:'', directions:'' },
    { name:'Pick-up & Delivery Service', price:300, medications:'', dosage:'', directions:'' },
    { name:'Confinement 1st Day', price:1200, medications:'', dosage:'', directions:'' },
    { name:'Succeeding Days', price:1000, medications:'', dosage:'', directions:'' }
  ],
  'Vaccine & Deworming': [
    { name:'Feline 4 in 1', price:1000, medications:'Feline 4-in-1 Vaccine', dosage:'as indicated', directions:'Follow schedule' },
    { name:'Canine 5 in 1', price:1000, medications:'Canine 5-in-1 Vaccine', dosage:'as indicated', directions:'Follow schedule' },
    { name:'Canine 6 in 1', price:1000, medications:'Canine 6-in-1 Vaccine', dosage:'as indicated', directions:'Follow schedule' },
    { name:'Canine 8 in 1', price:1200, medications:'Canine 8-in-1 Vaccine', dosage:'as indicated', directions:'Follow schedule' },
    { name:'Kennel Cough Vaccine', price:500, medications:'KC Vaccine', dosage:'as indicated', directions:'Follow schedule' },
    { name:'Anti-Rabies', price:350, medications:'Anti-Rabies Vaccine', dosage:'as indicated', directions:'Annual booster' },
    { name:'Deworming Canine', price:250, medications:'Anthelmintic', dosage:'per kg', directions:'Repeat as advised' },
    { name:'Deworming Feline', price:200, medications:'Anthelmintic', dosage:'per kg', directions:'Repeat as advised' }
  ],
  'Laboratory Tests': [
    { name:'Complete Blood Count (CBC)', price:550 },
    { name:'Comprehensive Blood Chemistry', price:3550 },
    { name:'Chemistry 24 Panel', price:2950 },
    { name:'Chemistry 10 Panel', price:2250 },
    { name:'X-ray', price:700 },
    { name:'Ultrasound OB', price:800 },
    { name:'Ultrasound', price:800 },
    { name:'Incubator', price:1000 },
    { name:'2D ECHO', price:2500 },
    { name:'ECG', price:1500 },
    { name:'PCR Test', price:3500 },
    { name:'Rivalta Test', price:350 },
    { name:'Urinalysis', price:400 },
    { name:'Fecalysis', price:350 },
    { name:'Immunofluorescence Assay Test', price:1400 },
    { name:'Ear Smear Test', price:300 },
    { name:'Oxygen Chamber', price:1500 },
    { name:'Nebulization Treatment', price:250 },
    { name:'Pet iChip Standard', price:500 },
    { name:'Laser Therapy', price:1500 },
    { name:'Dental Service', price:1500 }
  ],
  'Rapid Tests': [
    { name:'Feline Panleukopenia Virus Drop Test', price:800 },
    { name:'Feline Herpes Virus Drop Test', price:800 },
    { name:'FIV/FeLV Test', price:1100 },
    { name:'Canine Distemper Virus Drop Test', price:800 },
    { name:'Canine Parvo Virus & Corona Virus Drop Test', price:800 },
    { name:'4-in-1 Test', price:1100 },
    { name:'Giardia Drop Test', price:800 }
  ],
  'Surgical Service': [ { name:'Surgical Procedures', price:0 } ],
  'Spaying & Castration': [
    { name:'Feline Spaying (Female)', price:8000 },
    { name:'Feline Castration (Male)', price:6000 },
    { name:'Canine Spaying (Female)', price:14000 },
    { name:'Canine Castration (Male)', price:12000 }
  ]
};

/* ===== Guard ===== */
window.guard=function(pageKey){
  window.ensureLoggedIn();
  const role=window.getRole();
  const allowed=CONFIG[role]||[];
  if(!allowed.includes(pageKey)) location.href="dashboard.html";
};

/* ===== Helpers for Pet Names etc. ===== */
window.petName = async function(id) {
  const pet = await repoGetPet(id);
  return pet ? pet.name : "Unknown Pet";
};

window.ownerForPet = async function(id) {
  const pet = await repoGetPet(id);
  if(!pet) return "Unknown Owner";
  if (pet.owner) return pet.owner;
  if (pet.ownerId){ const o = await repoGetOwner(pet.ownerId); return o? o.fullName : "Unknown Owner"; }
  return "Unknown Owner";
};

/* ===== Local Storage Repository Functions ===== */
// These functions provide local storage functionality when USE_API is false

// Owner repository functions
window.repoListOwners = async function(){
  const data = localStorage.getItem('pawcare_owners');
  return data ? JSON.parse(data) : [];
};

window.repoSearchOwners = async function(term){
  const t = (term||'').toLowerCase();
  const list = await repoListOwners();
  return list.filter(o => [o.fullName,o.phone,o.email].filter(Boolean).join(' ').toLowerCase().includes(t));
};

window.repoGetOwner = async function(id){
  const list = await repoListOwners();
  return list.find(o=>o.id==id)||null;
};

window.repoAddOwner = async function(owner){
  const list = await repoListOwners();
  const newId = list.length>0 ? Math.max(...list.map(o=>o.id))+1 : 1;
  const toSave = { id:newId, fullName:owner.fullName, phone:owner.phone, email:owner.email||'', address:owner.address||'' };
  list.push(toSave);
  localStorage.setItem('pawcare_owners', JSON.stringify(list));
  pushRecent(`Added owner: ${toSave.fullName}`);
  return toSave;
};

window.repoUpdateOwner = async function(owner){
  const list = await repoListOwners();
  const idx = list.findIndex(o=>o.id==owner.id);
  if(idx!==-1){ list[idx]=owner; localStorage.setItem('pawcare_owners', JSON.stringify(list)); }
  return owner;
};

// Pet repository functions
window.repoListPets = async function() {
  if (window.USE_API) {
    return await Api.pets.list();
  }
  const data = localStorage.getItem('pawcare_pets');
  return data ? JSON.parse(data) : [];
};

window.repoGetPet = async function(id) {
  if (window.USE_API) {
    return await Api.pets.get(id);
  }
  const pets = await repoListPets();
  return pets.find(p => p.id == id) || null;
};

window.repoAddPet = async function(pet, photoFile) {
  if (window.USE_API) {
    const result = await Api.pets.create(pet);
    if (photoFile) {
      await Api.pets.uploadPhoto(result.id, photoFile);
    }
    return result;
  }
  const pets = await repoListPets();
  const newId = pets.length > 0 ? Math.max(...pets.map(p => p.id)) + 1 : 1;
  pet.id = newId;
  pets.push(pet);
  localStorage.setItem('pawcare_pets', JSON.stringify(pets));
  pushRecent(`Added pet: ${pet.name}`);
  return pet;
};

window.repoUpdatePet = async function(pet) {
  if (window.USE_API) {
    return await Api.pets.update(pet);
  }
  const pets = await repoListPets();
  const index = pets.findIndex(p => p.id == pet.id);
  if (index !== -1) {
    pets[index] = pet;
    localStorage.setItem('pawcare_pets', JSON.stringify(pets));
    pushRecent(`Updated pet: ${pet.name}`);
  }
  return pet;
};

window.repoDeletePet = async function(id) {
  if (window.USE_API) {
    await Api.pets.remove(id);
    return;
  }
  const pets = await repoListPets();
  const filtered = pets.filter(p => p.id != id);
  localStorage.setItem('pawcare_pets', JSON.stringify(filtered));
  pushRecent(`Deleted pet #${id}`);
};

// Appointment repository functions
window.repoListAppts = async function() {
  if (window.USE_API) {
    return await Api.appts.list();
  }
  const data = localStorage.getItem('pawcare_appts');
  return data ? JSON.parse(data) : [];
};

window.repoGetAppt = async function(id) {
  if (window.USE_API) {
    return await Api.appts.get(id);
  }
  const appts = await repoListAppts();
  return appts.find(a => a.id == id) || null;
};

function generateAppointmentCode(dateStr, timeStr){
  const d = dateStr ? dateStr.replaceAll('-','') : new Date().toISOString().slice(0,10).replaceAll('-','');
  const t = (timeStr||'').replaceAll(':','').slice(0,4);
  const rand = Math.floor(Math.random()*900+100);
  return `APT-${d}${t?'-'+t:''}-${rand}`;
}

window.repoAddAppt = async function(appt) {
  if (window.USE_API) {
    return await Api.appts.create(appt);
  }
  const appts = await repoListAppts();
  const newId = appts.length > 0 ? Math.max(...appts.map(a => a.id)) + 1 : 1;
  appt.id = newId;
  appt.code = appt.code || generateAppointmentCode(appt.date, appt.time);
  appt.status = appt.status || 'Pending';
  appt.vet = appt.vet || '';
  appts.push(appt);
  localStorage.setItem('pawcare_appts', JSON.stringify(appts));
  pushRecent(`Created appointment for ${appt.owner}`);
  return appt;
};

window.repoUpdateAppt = async function(appt) {
  if (window.USE_API) {
    return await Api.appts.update(appt);
  }
  const appts = await repoListAppts();
  const index = appts.findIndex(a => a.id == appt.id);
  if (index !== -1) {
    appts[index] = appt;
    localStorage.setItem('pawcare_appts', JSON.stringify(appts));
    pushRecent(`Updated appointment #${appt.id}`);
  }
  return appt;
};

window.repoDeleteAppt = async function(id) {
  if (window.USE_API) {
    await Api.appts.remove(id);
    return;
  }
  const appts = await repoListAppts();
  const filtered = appts.filter(a => a.id != id);
  localStorage.setItem('pawcare_appts', JSON.stringify(filtered));
  pushRecent(`Deleted appointment #${id}`);
};

window.repoApproveAppt = async function(id) {
  if (window.USE_API) {
    await Api.appts.approve(id);
    return;
  }
  const appts = await repoListAppts();
  const appt = appts.find(a => a.id == id);
  if (appt) {
    appt.status = 'Approved by Vet';
    localStorage.setItem('pawcare_appts', JSON.stringify(appts));
    pushRecent(`Approved appointment #${id}`);
  }
};

window.repoDoneAppt = async function(id) {
  if (window.USE_API) {
    await Api.appts.done(id);
    // Trigger reports refresh if reports page is open
    if (typeof window.run === 'function') {
      window.run();
    }
    return;
  }
  const appts = await repoListAppts();
  const appt = appts.find(a => a.id == id);
  if (appt) {
    appt.status = 'Done';
    appt.completedAt = new Date().toISOString().split('T')[0];
    localStorage.setItem('pawcare_appts', JSON.stringify(appts));
    pushRecent(`Completed appointment #${id}`);
    // Trigger reports refresh if reports page is open
    if (typeof window.run === 'function') {
      window.run();
    }
  }
};

window.repoCreateAppt = async function(appt) {
  return await repoAddAppt(appt);
};

// Prescription repository functions
window.repoListRx = async function() {
  if (window.USE_API) {
    return await Api.rx.list();
  }
  const data = localStorage.getItem('pawcare_rx');
  return data ? JSON.parse(data) : [];
};

window.repoGetRx = async function(id) {
  if (window.USE_API) {
    return await Api.rx.get(id);
  }
  const rx = await repoListRx();
  return rx.find(r => r.id == id) || null;
};

window.repoAddRx = async function(rx) {
  if (window.USE_API) {
    return await Api.rx.create(rx);
  }
  const prescriptions = await repoListRx();
  const newId = prescriptions.length > 0 ? Math.max(...prescriptions.map(r => r.id)) + 1 : 1;
  rx.id = newId;
  prescriptions.push(rx);
  localStorage.setItem('pawcare_rx', JSON.stringify(prescriptions));
  pushRecent(`Created prescription for ${rx.pet}`);
  return rx;
};

window.repoUpdateRx = async function(rx) {
  if (window.USE_API) {
    return await Api.rx.update(rx);
  }
  const prescriptions = await repoListRx();
  const index = prescriptions.findIndex(r => r.id == rx.id);
  if (index !== -1) {
    prescriptions[index] = rx;
    localStorage.setItem('pawcare_rx', JSON.stringify(prescriptions));
    pushRecent(`Updated prescription #${rx.id}`);
  }
  return rx;
};

window.repoDeleteRx = async function(id) {
  if (window.USE_API) {
    await Api.rx.remove(id);
    return;
  }
  const prescriptions = await repoListRx();
  const filtered = prescriptions.filter(r => r.id != id);
  localStorage.setItem('pawcare_rx', JSON.stringify(filtered));
  pushRecent(`Deleted prescription #${id}`);
};

window.repoDispenseRx = async function(id) {
  if (window.USE_API) {
    await Api.rx.dispense(id);
    // Trigger reports refresh if reports page is open
    if (typeof window.run === 'function') {
      window.run();
    }
    return;
  }
  const prescriptions = await repoListRx();
  const rx = prescriptions.find(r => r.id == id);
  if (rx) {
    rx.dispensed = true;
    rx.dispensedAt = new Date().toISOString().split('T')[0];
    // Auto-archive once dispensed
    rx.archived = true;
    localStorage.setItem('pawcare_rx', JSON.stringify(prescriptions));
    pushRecent(`Dispensed prescription #${id}`);
    // Trigger reports refresh if reports page is open
    if (typeof window.run === 'function') {
      window.run();
    }
  }
};

window.repoArchiveRx = async function(id, archived=true){
  const prescriptions = await repoListRx();
  const idx = prescriptions.findIndex(r=>r.id==id);
  if(idx===-1) return;
  prescriptions[idx].archived = archived;
  localStorage.setItem('pawcare_rx', JSON.stringify(prescriptions));
};

window.repoCreateRx = async function(rx) {
  return await repoAddRx(rx);
};

// User repository functions
window.repoListUsers = async function() {
  if (window.USE_API) {
    return await Api.users.list();
  }
  const data = localStorage.getItem('pawcare_users');
  return data ? JSON.parse(data) : [];
};

window.repoGetUser = async function(id) {
  if (window.USE_API) {
    return await Api.users.get(id);
  }
  const users = await repoListUsers();
  return users.find(u => u.id == id) || null;
};

window.repoAddUser = async function(user) {
  if (window.USE_API) {
    return await Api.users.create(user);
  }
  const users = await repoListUsers();
  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  user.id = newId;
  users.push(user);
  localStorage.setItem('pawcare_users', JSON.stringify(users));
  pushRecent(`Added user: ${user.name}`);
  return user;
};

window.repoUpdateUser = async function(user) {
  if (window.USE_API) {
    return await Api.users.update(user);
  }
  const users = await repoListUsers();
  const index = users.findIndex(u => u.id == user.id);
  if (index !== -1) {
    users[index] = user;
    localStorage.setItem('pawcare_users', JSON.stringify(users));
    pushRecent(`Updated user: ${user.name}`);
  }
  return user;
};

window.repoDeleteUser = async function(id) {
  if (window.USE_API) {
    await Api.users.remove(id);
    return;
  }
  const users = await repoListUsers();
  const filtered = users.filter(u => u.id != id);
  localStorage.setItem('pawcare_users', JSON.stringify(filtered));
  pushRecent(`Deleted user #${id}`);
};

window.repoCreateUser = async function(user) {
  return await repoAddUser(user);
};

// Reports repository functions
window.repoSummary = async function(period, from, to) {
  if (window.USE_API) {
    return await Api.reports.summary(period, from, to);
  }
  
  // Local storage implementation
  const today = new Date();
  let start, end;
  
  switch (period) {
    case 'day':
      start = new Date(today);
      end = new Date(today);
      break;
    case 'week':
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      end = new Date(today);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today);
      break;
    case 'custom':
      start = new Date(from);
      end = new Date(to);
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today);
  }
  
  const appointments = await repoListAppts();
  const prescriptions = await repoListRx();
  const pets = await repoListPets();
  const owners = await repoListOwners();
  
  // Count appointments done
  const appointmentsDone = appointments.filter(a => 
    a.status === 'Done' && 
    a.completedAt && 
    new Date(a.completedAt) >= start && 
    new Date(a.completedAt) <= end
  ).length;
  
  // Count prescriptions dispensed
  const prescriptionsDispensed = prescriptions.filter(r => 
    r.dispensed && 
    r.dispensedAt && 
    new Date(r.dispensedAt) >= start && 
    new Date(r.dispensedAt) <= end
  ).length;
  
  // Count pets added (approximate - count pets created in period)
  const petsAdded = pets.filter(p => {
    // For local storage, we'll estimate based on pet ID or creation order
    // This is a simplified approach - in a real app you'd track creation dates
    return p.id && p.id > 0; // All pets are considered "added" for simplicity
  }).length;
  
  // Get recent activity events
  const events = [];
  const recentData = db();
  if (recentData && recentData.recent) {
    events.push(...recentData.recent.map(r => ({
      ts: new Date(r.ts).toISOString(),
      type: 'ACTIVITY',
      message: r.text
    })));
  }

  // New Patients (from recent events within range)
  const newPatients = (recentData?.recent||[])
    .filter(r=>r.text.startsWith('Added pet:'))
    .filter(r=>{ const d=new Date(r.ts); return d>=start && d<=end; })
    .map(r=>{
      const name = r.text.replace('Added pet:','').trim();
      const pet = pets.find(p=>p.name===name) || null;
      const ownerName = pet?.owner || (pet?.ownerId ? (owners.find(o=>o.id==pet.ownerId)?.fullName||'') : '');
      return { petName:name, ownerName, addedAt:new Date(r.ts).toISOString() };
    });

  // Finished Appointments with cost (join procedures on the completed date)
  function proceduresForPetOnDate(petId, dateStr){
    const pet = pets.find(p=>p.id==petId);
    if(!pet||!Array.isArray(pet.procedures)) return { names:[], total:0 };
    const list = pet.procedures.filter(pr=> (pr.performedAt||'') === dateStr);
    const names = list.map(pr=>pr.name||pr.procedure||'');
    const total = list.reduce((s,pr)=> s + Number(pr.cost||0), 0);
    return { names, total };
  }

  const finished = (appointments||[])
    .filter(a=> a.status==='Done' && a.completedAt)
    .filter(a=>{ const d=new Date(a.completedAt); return d>=start && d<=end; })
    .map(a=>{
      const pr = proceduresForPetOnDate(a.petId, a.completedAt);
      return {
        code: a.code||'',
        date: a.completedAt,
        time: a.time||'',
        vet: a.vet||'',
        pet: a.pet||'',
        owner: a.owner||'',
        procedures: pr.names,
        cost: pr.total
      };
    });

  const totalProfit = finished.reduce((s,x)=> s + Number(x.cost||0), 0);
  
  return {
    period,
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
    appointmentsDone,
    prescriptionsDispensed,
    petsAdded,
    events,
    newPatients,
    finished,
    totalProfit
  };
};

// Procedure repository functions
window.repoAddProcedure = async function(petId, procedure) {
  if (window.USE_API) {
    await Api.pets.addProcedure(petId, procedure);
    return;
  }
  const pets = await repoListPets();
  const pet = pets.find(p => p.id == petId);
  if (pet) {
    if (!pet.procedures) {
      pet.procedures = [];
    }
    const pr = {
      name: procedure.name || procedure.procedure || '',
      notes: procedure.notes || '',
      medications: procedure.medications || '',
      cost: Number(procedure.cost||0),
      performedAt: procedure.performedAt || procedure.date || new Date().toISOString().slice(0, 10),
      category: procedure.category || '',
      labType: procedure.labType || ''
    };
    pet.procedures.push(pr);
    localStorage.setItem('pawcare_pets', JSON.stringify(pets));
    pushRecent(`Added procedure for ${pet.name}: ${pr.name}`);
  }
};

window.repoUpdateProcedure = async function(petId, index, updated){
  const pets = await repoListPets();
  const pet = pets.find(p=>p.id==petId);
  if(!pet || !pet.procedures) return;
  const pr = {
    name: updated.name||'',
    notes: updated.notes||'',
    medications: updated.medications||'',
    cost: Number(updated.cost||0),
    performedAt: updated.performedAt || new Date().toISOString().slice(0,10),
    category: updated.category || '',
    labType: updated.labType || ''
  };
  pet.procedures[index]=pr;
  localStorage.setItem('pawcare_pets', JSON.stringify(pets));
};

window.repoDeleteProcedure = async function(petId, index){
  const pets = await repoListPets();
  const pet = pets.find(p=>p.id==petId);
  if(!pet || !pet.procedures) return;
  pet.procedures.splice(index,1);
  localStorage.setItem('pawcare_pets', JSON.stringify(pets));
};

// Helper function for file to data URL conversion
window.fileToDataURL = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/* ===== End of File ===== */
