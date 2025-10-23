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

/* ===== Helpers for Pet Names etc. (demo placeholders) ===== */
window.petName = id => "Pet #"+id;
window.ownerForPet = id => "Owner "+id;

/* ===== End of File ===== */
