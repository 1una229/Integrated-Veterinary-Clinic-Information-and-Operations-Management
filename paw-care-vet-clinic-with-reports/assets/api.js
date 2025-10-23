// Toggle when your backend is ready:
window.USE_API = window.USE_API ?? false;
window.API_BASE = window.API_BASE ?? "http://localhost:8080/api";

window.ApiHttp = async function http(path, { method="GET", headers={}, body, timeoutMs=12000, token } = {}){
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeoutMs);
  const res = await fetch(window.API_BASE + path, {
    method,
    headers: {
      "Accept":"application/json",
      ...(body instanceof FormData ? {} : {"Content-Type":"application/json"}),
      ...(token ? {"Authorization":`Bearer ${token}`} : {}),
      ...headers
    },
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    signal: ctrl.signal
  }).catch(err => { throw new Error(err.name==="AbortError" ? "Request timeout" : err.message); });
  clearTimeout(t);
  if(!res.ok){
    const msg = await res.text().catch(()=>res.statusText);
    throw new Error(`${res.status} ${res.statusText} — ${msg}`);
  }
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
};

window.Api = {
  token(){ return localStorage.getItem("jwt") || null; },
  pets: {
    list:   () => ApiHttp("/pets",                 { token: Api.token() }),
    get:    (id)=> ApiHttp(`/pets/${id}`,          { token: Api.token() }),
    create: (p)=>  ApiHttp("/pets",                { method:"POST", body:p, token: Api.token() }),
    update: (p)=>  ApiHttp(`/pets/${p.id}`,        { method:"PUT",  body:p, token: Api.token() }),
    remove: (id)=> ApiHttp(`/pets/${id}`,          { method:"DELETE", token: Api.token() }),
    uploadPhoto: (id, file)=>{ const fd=new FormData(); fd.append("file", file); return ApiHttp(`/pets/${id}/photo`, { method:"POST", body:fd, token: Api.token() }); },
    addProcedure: (id, proc)=> ApiHttp(`/pets/${id}/procedures`, { method:"POST", body:proc, token: Api.token() })
  },
  appts: {
    list:    ()    => ApiHttp("/appointments", { token: Api.token() }),
    create:  (a)   => ApiHttp("/appointments", { method:"POST", body:a, token: Api.token() }),
    approve: (id)  => ApiHttp(`/appointments/${id}/approve`, { method:"POST", token: Api.token() }),
    done:    (id)  => ApiHttp(`/appointments/${id}/done`,    { method:"POST", token: Api.token() }),
    remove:  (id)  => ApiHttp(`/appointments/${id}`, { method:"DELETE", token: Api.token() })
  },
  rx: {
    list:    ()   => ApiHttp("/prescriptions", { token: Api.token() }),
    create:  (r)  => ApiHttp("/prescriptions", { method:"POST", body:r, token: Api.token() }),
    dispense:(id) => ApiHttp(`/prescriptions/${id}/dispense`, { method:"POST", token: Api.token() })
  },
  users: {
    list:   ()   => ApiHttp("/users", { token: Api.token() }),
    create: (u)  => ApiHttp("/users", { method:"POST", body:u, token: Api.token() }),
    remove: (id) => ApiHttp(`/users/${id}`, { method:"DELETE", token: Api.token() })
  },
  reports: {
    summary: (period, from, to) => {
      const q = new URLSearchParams({ period, ...(from?{from}:{}) , ...(to?{to}:{}) }).toString();
      return ApiHttp(`/reports/summary?${q}`, { token: Api.token() });
    },
    log: (from, to) => {
      const q = new URLSearchParams({ from, to }).toString();
      return ApiHttp(`/ops/log?${q}`, { token: Api.token() });
    }
  }
};

// ------- Local storage fallback and repo* wrappers -------
;(function(){
  const LOCAL_KEY = 'pawcare_store_v1';

  function load(){
    const raw = localStorage.getItem(LOCAL_KEY);
    if(raw){
      try { return JSON.parse(raw); } catch { /* fallthrough */ }
    }
    const fresh = { pets: [], appts: [], rx: [], users: [], ops: [], seq: { pet:0, appt:0, rx:0, user:0, op:0 } };
    save(fresh);
    return fresh;
  }

  function save(db){ localStorage.setItem(LOCAL_KEY, JSON.stringify(db)); }
  function nextId(db, key){ db.seq[key] = (db.seq[key]||0) + 1; return db.seq[key]; }
  function nowTs(){ return new Date().toISOString().slice(0,19); }
  function logOp(db, type, message, petId){
    db.ops.push({ id: nextId(db,'op'), ts: nowTs(), type, message, petId: petId ?? null });
  }

  const LocalRepo = {
    // Pets
    listPets(){ const db=load(); return [...db.pets].sort((a,b)=>a.id-b.id); },
    getPet(id){ const db=load(); return db.pets.find(p=>p.id===Number(id)) || null; },
    addPet(p){ const db=load(); const pet={...p}; pet.id = nextId(db,'pet'); if(!pet.procedures) pet.procedures = []; db.pets.push(pet); logOp(db,'PET_CREATED', `Added pet ${pet.name||('#'+pet.id)}`, pet.id); save(db); return pet; },
    updatePet(p){ const db=load(); const i=db.pets.findIndex(x=>x.id===Number(p.id)); if(i>=0){ db.pets[i] = { ...p, id:Number(p.id) }; logOp(db,'PET_UPDATED', `Updated pet ${db.pets[i].name||('#'+p.id)}`, Number(p.id)); save(db); return db.pets[i]; } return null; },
    deletePet(id){ const db=load(); const i=db.pets.findIndex(x=>x.id===Number(id)); const removed = i>=0 ? db.pets.splice(i,1)[0] : null; logOp(db,'PET_DELETED', `Deleted pet ${removed?removed.name:('#'+id)}`, Number(id)); save(db); },
    addProcedure(petId, proc){ const db=load(); const p=db.pets.find(x=>x.id===Number(petId)); if(!p) return null; if(!p.procedures) p.procedures=[]; p.procedures.push({...proc}); logOp(db,'PET_UPDATED', `Procedure added for ${p.name||('#'+p.id)}`, p.id); save(db); return p; },

    // Appointments
    listAppts(){ const db=load(); return [...db.appts].sort((a,b)=>a.id-b.id); },
    createAppt(a){ const db=load(); const appt={...a}; appt.id=nextId(db,'appt'); appt.status=appt.status||'Pending'; db.appts.push(appt); logOp(db,'APPT_CREATED', `Appointment created for ${appt.owner||''}`, appt.petId||null); save(db); return appt; },
    approveAppt(id){ const db=load(); const a=db.appts.find(x=>x.id===Number(id)); if(a){ a.status='Approved by Vet'; logOp(db,'APPT_APPROVED', `Appointment approved for ${a.owner||''}`, a.petId||null); save(db); } return a||null; },
    doneAppt(id){ const db=load(); const a=db.appts.find(x=>x.id===Number(id)); if(a){ a.status='Done'; a.completedAt = new Date().toISOString().slice(0,10); logOp(db,'APPT_DONE', `Appointment done for ${a.owner||''}`, a.petId||null); save(db); } return a||null; },
    deleteAppt(id){ const db=load(); const i=db.appts.findIndex(x=>x.id===Number(id)); const a = i>=0 ? db.appts.splice(i,1)[0] : null; logOp(db,'APPT_DELETED', `Removed appointment #${id}`, a?a.petId:null); save(db); },

    // Prescriptions
    listRx(){ const db=load(); return [...db.rx].sort((a,b)=>a.id-b.id); },
    createRx(r){ const db=load(); const rec={...r}; rec.id=nextId(db,'rx'); rec.dispensed=!!rec.dispensed; db.rx.push(rec); logOp(db,'RX_CREATED', `Rx issued for ${rec.pet||''} (${rec.drug||''})`, rec.petId||null); save(db); return rec; },
    dispenseRx(id){ const db=load(); const rec=db.rx.find(x=>x.id===Number(id)); if(rec){ rec.dispensed=true; rec.dispensedAt=new Date().toISOString().slice(0,10); logOp(db,'RX_DISPENSED', `Rx dispensed for ${rec.pet||''}`, rec.petId||null); save(db); } return rec||null; },

    // Users
    listUsers(){ const db=load(); return [...db.users].sort((a,b)=>a.id-b.id); },
    createUser(u){ const db=load(); const user={...u, id: nextId(db,'user')}; db.users.push(user); save(db); return user; },
    deleteUser(id){ const db=load(); const i=db.users.findIndex(x=>x.id===Number(id)); if(i>=0) db.users.splice(i,1); save(db); },

    // Reports
    summary(period, from, to){
      const db=load();
      const today = new Date();
      function formatDate(d){ return d.toISOString().slice(0,10); }
      function parseDate(s){ return new Date(s + 'T00:00:00'); }
      let start, end;
      if(period==='day'){ start=new Date(formatDate(today)); end=new Date(formatDate(today)); }
      else if(period==='week'){ const t=new Date(formatDate(today)); start=new Date(t); start.setDate(t.getDate()-6); end=t; }
      else if(period==='month'){ const t=new Date(formatDate(today)); start=new Date(t.getFullYear(), t.getMonth(), 1); end=t; }
      else if(period==='custom'){ start=parseDate(from); end=parseDate(to); }
      else { throw new Error('Invalid period'); }

      function within(dateStr){ const d=parseDate(dateStr); return d>=start && d<=end; }

      const appointmentsDone = db.appts.filter(a=>a.status==='Done' && a.completedAt && within(a.completedAt)).length;
      const prescriptionsDispensed = db.rx.filter(r=>r.dispensed && r.dispensedAt && within(r.dispensedAt)).length;
      const events = db.ops.filter(o=> within(o.ts.slice(0,10)) );
      const petsAdded = events.filter(o=>o.type==='PET_CREATED').length;

      return {
        period,
        from: formatDate(start),
        to: formatDate(end),
        appointmentsDone,
        prescriptionsDispensed,
        petsAdded,
        events
      };
    }
  };

  const useApi = () => !!window.USE_API;

  // Pets API
  window.repoListPets = async () => useApi() ? Api.pets.list() : LocalRepo.listPets();
  window.repoGetPet   = async (id) => useApi() ? Api.pets.get(id) : LocalRepo.getPet(id);
  window.repoAddPet   = async (p, file) => {
    if(useApi()){
      const created = await Api.pets.create(p);
      if(file){ await Api.pets.uploadPhoto(created.id, file); }
      return created;
    } else {
      return LocalRepo.addPet(p);
    }
  };
  window.repoUpdatePet = async (p) => useApi() ? Api.pets.update(p) : LocalRepo.updatePet(p);
  window.repoDeletePet = async (id) => useApi() ? Api.pets.remove(id) : LocalRepo.deletePet(id);
  window.repoAddProcedure = async (id, proc) => useApi() ? Api.pets.addProcedure(id, proc) : LocalRepo.addProcedure(id, proc);

  // Appointments API
  window.repoListAppts = async () => useApi() ? Api.appts.list() : LocalRepo.listAppts();
  window.repoCreateAppt = async (a) => useApi() ? Api.appts.create(a) : LocalRepo.createAppt(a);
  window.repoApproveAppt = async (id) => useApi() ? Api.appts.approve(id) : LocalRepo.approveAppt(id);
  window.repoDoneAppt = async (id) => useApi() ? Api.appts.done(id) : LocalRepo.doneAppt(id);
  window.repoDeleteAppt = async (id) => useApi() ? Api.appts.remove(id) : LocalRepo.deleteAppt(id);

  // Prescriptions API
  window.repoListRx = async () => useApi() ? Api.rx.list() : LocalRepo.listRx();
  window.repoCreateRx = async (r) => useApi() ? Api.rx.create(r) : LocalRepo.createRx(r);
  window.repoDispenseRx = async (id) => useApi() ? Api.rx.dispense(id) : LocalRepo.dispenseRx(id);

  // Users API
  window.repoListUsers = async () => useApi() ? Api.users.list() : LocalRepo.listUsers();
  window.repoCreateUser = async (u) => useApi() ? Api.users.create(u) : LocalRepo.createUser(u);
  window.repoDeleteUser = async (id) => useApi() ? Api.users.remove(id) : LocalRepo.deleteUser(id);

  // Reports API
  window.repoSummary = async (period, from, to) => useApi() ? Api.reports.summary(period, from, to) : LocalRepo.summary(period, from, to);

  // Helper for local image preview
  window.fileToDataURL = window.fileToDataURL || (file => new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }));
})();
