const KEY = 'asimos_admin_token'

export function getToken(){
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function setToken(token){
  try { localStorage.setItem(KEY, token) } catch {}
}

export function clearToken(){
  try { localStorage.removeItem(KEY) } catch {}
}
