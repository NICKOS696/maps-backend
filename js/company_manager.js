/**
 * CompanyManager: управление данными компаний/городов/районов/микрорайонов
 * Структура файла компании:
 * {
 *   "company": "PROFIT EXPERT NONFOOD",
 *   "cities": [
 *     {
 *       "name": "Tashkent",
 *       "districts": { "type":"FeatureCollection", "features": [] },
 *       "microdistricts": { "type":"FeatureCollection", "features": [] }
 *     }
 *   ]
 * }
 */

const CompanyManager = {
  companies: [
    'PROFIT EXPERT NONFOOD',
    'PROFIT EXPERT FOOD',
    'LUCRO DOLCE'
  ],
  // Сопоставление компания->файл данных
  files: {
    'PROFIT EXPERT NONFOOD': 'data/profit_expert_nonfood.json',
    'PROFIT EXPERT FOOD': 'data/profit_expert_food.json',
    'LUCRO DOLCE': 'data/lucro_dolce.json'
  },

  currentCompany: null,
  currentCity: null,
  // Кэш загруженных данных по компаниям
  dataCache: {},
  // Привязанные файловые дескрипторы (на время сессии)
  fileHandles: {},

  async init(defaultCompany) {
    this.currentCompany = defaultCompany || this.companies[0];
    await this.loadCompany(this.currentCompany);
  },

  async loadCompany(company) {
    this.currentCompany = company;
    if (this.dataCache[company]) return this.dataCache[company];

    // 1) пробуем из localStorage
    try {
      const lsData = (typeof Utils !== 'undefined') ? Utils.loadFromLocalStorage(this._lsKey(company)) : null;
      if (lsData && typeof lsData === 'object') {
        this._ensureStructure(lsData, company);
        this.dataCache[company] = lsData;
        return lsData;
      }
    } catch(_) {}

    // 2) иначе пробуем из файла
    const url = this.files[company];
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      this._ensureStructure(data, company);
      this.dataCache[company] = data;
      // кэшируем в localStorage
      this._persist(company);
      return data;
    } catch (e) {
      // 3) если файла нет – создаем пустую структуру
      const empty = this._createEmptyCompany(company);
      this.dataCache[company] = empty;
      this._persist(company);
      return empty;
    }
  },

  getCompanies() {
    return this.companies.slice();
  },

  getCities(company) {
    const data = this.dataCache[company || this.currentCompany];
    if (!data) return [];
    return (data.cities || []).map(c => c.name);
  },

  setCity(cityName) {
    this.currentCity = cityName;
  },

  getCurrentCompany() {
    return this.currentCompany;
  },

  getCurrentCity() {
    return this.currentCity;
  },

  getCityNode(company, cityName) {
    const data = this.dataCache[company || this.currentCompany];
    if (!data) return null;
    return (data.cities || []).find(c => c.name === (cityName || this.currentCity)) || null;
  },

  ensureCity(company, cityName) {
    const data = this.dataCache[company || this.currentCompany];
    if (!data) return null;
    let city = (data.cities || []).find(c => c.name === cityName);
    if (!city) {
      city = {
        name: cityName,
        districts: { type: 'FeatureCollection', features: [] },
        microdistricts: { type: 'FeatureCollection', features: [] }
      };
      if (!data.cities) data.cities = [];
      data.cities.push(city);
    }
    return city;
  },

  getDistrictsFC(company, cityName) {
    const city = this.getCityNode(company, cityName);
    return city ? city.districts : { type: 'FeatureCollection', features: [] };
  },

  getMicrodistrictsFC(company, cityName) {
    const city = this.getCityNode(company, cityName);
    return city ? city.microdistricts : { type: 'FeatureCollection', features: [] };
  },

  addDistrict({ company, city, name, color, coordinates }) {
    const cityNode = this.ensureCity(company || this.currentCompany, city || this.currentCity);
    const geometry = this._coordsToPolygonGeometry(coordinates);
    const feature = {
      type: 'Feature',
      geometry,
      properties: { name, color, type: 'district' }
    };
    cityNode.districts.features.push(feature);
    this._persist(company || this.currentCompany);
    return feature;
  },

  addMicrodistrict({ company, city, districtName, name, color, coordinates }) {
    const cityNode = this.ensureCity(company || this.currentCompany, city || this.currentCity);
    const geometry = this._coordsToPolygonGeometry(coordinates);
    const feature = {
      type: 'Feature',
      geometry,
      properties: { name, color, type: 'microdistrict', district: districtName }
    };
    cityNode.microdistricts.features.push(feature);
    this._persist(company || this.currentCompany);
    return feature;
  },

  async saveCurrentCompanyToFile() {
    try {
      // Если есть привязанный файл — пишем напрямую
      const handle = this.fileHandles[this.currentCompany];
      if (handle && handle.createWritable) {
        await this._persistToDisk(this.currentCompany);
        return true;
      }
      // Иначе — обычная скачка файла
      const data = this._sanitizeForJSON(this.dataCache[this.currentCompany]);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this._fileNameForCompany(this.currentCompany);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('Ошибка сохранения файла компании:', e);
      return false;
    }
  },

  async saveCurrentCompanyToGeoJSON() {
    try {
      if (!this.currentCompany || !this.currentCity) {
        alert('Сначала выберите компанию и город');
        return false;
      }

      const data = this.dataCache[this.currentCompany];
      if (!data || !Array.isArray(data.cities)) {
        alert('Нет данных для сохранения');
        return false;
      }

      // Находим текущий город
      const cityData = data.cities.find(c => c.name === this.currentCity);
      if (!cityData) {
        alert('Город не найден');
        return false;
      }

      // Создаем объединенный GeoJSON с районами и микрорайонами
      const combinedGeoJSON = {
        type: 'FeatureCollection',
        features: []
      };

      // Добавляем районы
      if (cityData.districts && cityData.districts.features) {
        combinedGeoJSON.features.push(...cityData.districts.features);
      }

      // Добавляем микрорайоны
      if (cityData.microdistricts && cityData.microdistricts.features) {
        combinedGeoJSON.features.push(...cityData.microdistricts.features);
      }

      // Сохраняем файл
      const blob = new Blob([JSON.stringify(combinedGeoJSON, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentCompany}_${this.currentCity}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('Ошибка сохранения GeoJSON:', e);
      return false;
    }
  },

  async requestBindCurrentCompanyFile() {
    // Пользователь выбирает реальный JSON-файл для текущей компании
    if (!this.currentCompany) return;
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
      // Запрос прав на запись
      const ok = await this._ensureWritePermission(handle);
      if (!ok) return false;
      // Сохраняем handle на время сессии
      this.fileHandles[this.currentCompany] = handle;
      return true;
    } catch (e) {
      console.warn('Привязка файла отменена/ошибка:', e);
      return false;
    }
  },

  _fileNameForCompany(company) {
    if (company === 'PROFIT EXPERT NONFOOD') return 'profit_expert_nonfood.json';
    if (company === 'PROFIT EXPERT FOOD') return 'profit_expert_food.json';
    return 'lucro_dolce.json';
  },

  _createEmptyCompany(company) {
    return {
      company,
      cities: []
    };
  },

  _ensureStructure(data, company) {
    if (!data.company) data.company = company;
    if (!Array.isArray(data.cities)) data.cities = [];
    data.cities.forEach(c => {
      if (!c.districts) c.districts = { type: 'FeatureCollection', features: [] };
      if (!c.microdistricts) c.microdistricts = { type: 'FeatureCollection', features: [] };
    });
  },

  _coordsToPolygonGeometry(coordsText) {
    // Поддерживаем форматы:
    // 1) Каждая строка: "lat, lng" (без скобок) — ИНТЕРПРЕТИРУЕМ как (lat,lng)
    // 2) В скобках: "[lng,lat],[lng,lat],..." — ИНТЕРПРЕТИРУЕМ как (lng,lat)
    const text = (coordsText || '').trim();
    const ring = [];

    if (text.includes('[')) {
      // Парсим пары в квадратных скобках как (lng,lat)
      const pairRegex = /\[\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\]/g;
      let m;
      while ((m = pairRegex.exec(text)) !== null) {
        const lng = parseFloat(m[1]);
        const lat = parseFloat(m[2]);
        if (isFinite(lat) && isFinite(lng)) {
          ring.push([lng, lat]);
        }
      }
    } else {
      // Старый формат: строки вида "lat, lng"
      const lines = text.split(/\n|;/).map(s => s.trim()).filter(Boolean);
      for (const ln of lines) {
        const parts = ln.split(',').map(p => p.trim());
        if (parts.length !== 2) continue;
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (isFinite(lat) && isFinite(lng)) {
          ring.push([lng, lat]); // GeoJSON (lng, lat)
        }
      }
    }
    if (ring.length > 2) {
      // замыкаем
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
    }
    return { type: 'Polygon', coordinates: [ring] };
  }
  ,
  _persist(company){
    try {
      if (typeof Utils !== 'undefined') {
        const data = this._sanitizeForJSON(this.dataCache[company]);
        if (data) Utils.saveToLocalStorage(this._lsKey(company), data);
      }
      // Пытаемся также записать в привязанный файл (если есть и доступны права)
      this._persistToDisk(company);
    } catch(_) {}
  }
  ,
  _lsKey(company){
    return `company_data_${company}`;
  }
  ,
  async _persistToDisk(company){
    try {
      const handle = this.fileHandles[company];
      if (!handle) return;
      const ok = await this._ensureWritePermission(handle);
      if (!ok) return;
      const writable = await handle.createWritable();
      const data = this._sanitizeForJSON(this.dataCache[company] || this._createEmptyCompany(company));
      await writable.write(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      await writable.close();
    } catch (e) {
      console.warn('Не удалось записать в файл компании:', e);
    }
  }
  ,
  async _ensureWritePermission(handle){
    try {
      if (!handle) return false;
      if (typeof handle.queryPermission === 'function' && typeof handle.requestPermission === 'function'){
        const current = await handle.queryPermission({ mode: 'readwrite' });
        if (current === 'granted') return true;
        const ask = await handle.requestPermission({ mode: 'readwrite' });
        return ask === 'granted';
      }
      return true; // старые браузеры: пробуем писать
    } catch(_) { return false; }
  }
  ,
  _sanitizeForJSON(obj){
    try {
      const seen = new WeakSet();
      const walk = (value) => {
        if (value === null || typeof value !== 'object') return value;
        if (seen.has(value)) return undefined; // обрываем циклы
        seen.add(value);
        if (Array.isArray(value)) return value.map(walk).filter(v => v !== undefined);
        const out = {};
        for (const [k, v] of Object.entries(value)){
          if (typeof v === 'function') continue;
          if (k.startsWith('_')) continue; // выкидываем внутренние ссылки Leaflet
          const vv = walk(v);
          if (vv !== undefined) out[k] = vv;
        }
        return out;
      };
      return walk(obj);
    } catch(_) {
      // в крайнем случае простая копия
      return JSON.parse(JSON.stringify(obj));
    }
  }
};
