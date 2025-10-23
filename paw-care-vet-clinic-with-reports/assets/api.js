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
