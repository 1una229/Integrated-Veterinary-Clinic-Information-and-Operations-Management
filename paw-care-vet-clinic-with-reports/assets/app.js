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
  pharmacist:   ["dashboard","pet-records","prescriptions"]
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
  return pet ? pet.owner : "Unknown Owner";
};

/* ===== Local Storage Repository Functions ===== */
// These functions provide local storage functionality when USE_API is false

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

window.repoAddAppt = async function(appt) {
  if (window.USE_API) {
    return await Api.appts.create(appt);
  }
  const appts = await repoListAppts();
  const newId = appts.length > 0 ? Math.max(...appts.map(a => a.id)) + 1 : 1;
  appt.id = newId;
  appt.status = 'Pending';
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
    localStorage.setItem('pawcare_rx', JSON.stringify(prescriptions));
    pushRecent(`Dispensed prescription #${id}`);
    // Trigger reports refresh if reports page is open
    if (typeof window.run === 'function') {
      window.run();
    }
  }
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
  
  return {
    period,
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
    appointmentsDone,
    prescriptionsDispensed,
    petsAdded,
    events
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
    // Ensure the procedure has a date if not provided
    if (!procedure.date) {
      procedure.date = new Date().toISOString().slice(0, 10);
    }
    pet.procedures.push(procedure);
    localStorage.setItem('pawcare_pets', JSON.stringify(pets));
    pushRecent(`Added procedure for ${pet.name}: ${procedure.procedure}`);
  }
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
