import { reactive } from 'vue'

const defaultSettings: Record<string,any> = {
  colorScheme:"default",
  language:"default",
  refreshInterval:5,
  timeout:10,
  orderBy:"addedDate",
  reverse:true,
  selectedServer:0,
  useBits:false,
  expandMenu:true,
  ipFlags:false,
  openMagnetLinks:false,
  searchByName:true,
  searchByDirectory:true,
  selectedPreset:"",
  rememberSelectedPreset:false,
  compactMode: false,
  showTrackerList: false
}

const defaultServer: Record<string, any> = {
  name:"Default",
  host:typeof window !== "undefined" ? window.location.hostname : "localhost",
  port:typeof window !== "undefined" ? (window.location.port || ((window.location.protocol==="https:") ? 443 : 80)) : 80,
  https:typeof window !== "undefined" ? (window.location.protocol==="https:") : false
}

const defaultServers: Array<Record<string,any>> = [defaultServer];

function getStoredValue(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  const direct = localStorage.getItem(key);
  if (direct !== null) return direct;
  const legacy = localStorage.getItem(`CapacitorStorage.${key}`);
  if (legacy !== null) {
    localStorage.setItem(key, legacy);
    localStorage.removeItem(`CapacitorStorage.${key}`);
    return legacy;
  }
  return null;
}

function setStoredValue(key: string, value: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, value);
  localStorage.removeItem(`CapacitorStorage.${key}`);
}

function removeStoredValue(key: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key);
  localStorage.removeItem(`CapacitorStorage.${key}`);
}

export function sanitizeServersForStorage(serverList: unknown): Array<Record<string, any>> {
  const list = Array.isArray(serverList) ? serverList : Object.values(serverList || {});
  return list.map((server: Record<string, any>) => {
    const copy: Record<string, any> = { ...server };
    if (copy.auth && typeof copy.auth === "object") {
      const username = typeof copy.auth.username === "string" ? copy.auth.username : "";
      if (username) {
        copy.auth = { username };
      } else {
        delete copy.auth;
      }
    }
    return copy;
  });
}

export const UserSettings = {
  state: reactive({...defaultSettings}) as Record<string,any>,

  getLanguage(): string {
    return this.state.language=="default" ? navigator.language : this.state.language
  },

  setValue(key: string, val: string|number|boolean|unknown, save=false): void {
    if(val!=null){
      Object(this.state)[key] = val;
    }
    if(save){
      this.saveKey(key);
    }
  },

  async loadSettings(): Promise<void> {
    await this.loadDefaultSettings();

    for (const setting in this.state) {
      const val = getStoredValue(setting);
      if (val !== null) {
        if(typeof Object(this.state)[setting]=="boolean"){
          this.setValue(setting,(val=="true"));
        }
        else if(typeof Object(this.state)[setting]=="number"){
          this.setValue(setting,parseInt(val));
        }
        else {
          this.setValue(setting,val);
        }
      }
    }
  },

  async loadDefaultSettings(): Promise<void> {
    const defaultJson = await fetch('default.json')
      .then((response) => response.json())
      .catch(()=> {return})
    if(defaultJson){
      for (const setting in defaultJson) {
        if(setting=="servers"){
          defaultServers.length = 0;
          defaultJson[setting].forEach((server: Record<string,any>) => {
            defaultServers.push(Object.assign({}, defaultServer, server));
          });
        }
        else {
          this.setValue(setting,defaultJson[setting]);
          defaultSettings[setting]=defaultJson[setting];
        }
      }
    }
  },

  resetSettings(): void {
    for (const setting in this.state) {
      this.setValue(setting,defaultSettings[setting],true);
    }
  },

  saveSettings(): void {
    for (const setting in this.state) {
      this.saveKey(setting);
    }
  },

  saveKey(key: string): void {
    if(this.state[key] != defaultSettings[key] || key=="selectedServer"){
      setStoredValue(key, Object(this.state)[key].toString());
    }
    else {
      removeStoredValue(key);
    }
  },

  async loadServerList(): Promise<Array<Record<string,unknown>>> {
    let result: Array<Record<string,unknown>> = [...defaultServers];

    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("cap_sec_servers");
      const raw = getStoredValue("servers");
      if (raw && raw !== "[]") {
        try {
          const parsed = JSON.parse(raw);
          const sanitized = sanitizeServersForStorage(parsed);
          if (sanitized.length > 0) {
            result = sanitized;
            setStoredValue("servers", JSON.stringify(sanitized));
          }
        } catch (_) {
          // Ignore malformed storage
        }
      }
    }

    return result;
  },

  saveServerList(serverList: Record<string, any>): void {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem("cap_sec_servers");
    const sanitized = sanitizeServersForStorage(serverList);
    setStoredValue("servers", JSON.stringify(sanitized));
  },

  async loadPresets(): Promise<Record<string,any>> {
    let result: Record<string,any> = {};
    const raw = getStoredValue("presets");
    if (raw) {
      try {
        result = JSON.parse(raw);
      } catch (_) {
        result = {};
      }
    }
    return result;
  },

  savePresets(presets: Record<string,any>): void {
    setStoredValue("presets", JSON.stringify(presets));
  }
}
