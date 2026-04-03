/**
 * Модуль для работы с Backend API
 */
const ApiModule = {
    token: localStorage.getItem('auth_token') || null,
    
    /**
     * Выполняет HTTP запрос к API
     */
    async request(endpoint, options = {}) {
        const url = CONFIG.api.baseUrl + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Добавляем токен авторизации если есть
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка API');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * Авторизация пользователя
     */
    async login(username, password) {
        const data = await this.request(CONFIG.api.endpoints.auth, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.success && data.token) {
            this.token = data.token;
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    },
    
    /**
     * Выход из системы
     */
    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },
    
    /**
     * Проверка авторизации
     */
    isAuthenticated() {
        return !!this.token;
    },
    
    /**
     * Получение всех районов
     */
    async getDistricts() {
        return await this.request(CONFIG.api.endpoints.districts);
    },
    
    /**
     * Создание нового района
     */
    async createDistrict(districtData) {
        return await this.request(CONFIG.api.endpoints.districts, {
            method: 'POST',
            body: JSON.stringify(districtData)
        });
    },
    
    /**
     * Обновление района
     */
    async updateDistrict(id, districtData) {
        return await this.request(`${CONFIG.api.endpoints.districts}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(districtData)
        });
    },
    
    /**
     * Удаление района
     */
    async deleteDistrict(id) {
        return await this.request(`${CONFIG.api.endpoints.districts}/${id}`, {
            method: 'DELETE'
        });
    },
    
    /**
     * Получение всех микрорайонов
     */
    async getMicrodistricts() {
        return await this.request(CONFIG.api.endpoints.microdistricts);
    },
    
    /**
     * Создание нового микрорайона
     */
    async createMicrodistrict(microdistrictData) {
        return await this.request(CONFIG.api.endpoints.microdistricts, {
            method: 'POST',
            body: JSON.stringify(microdistrictData)
        });
    },
    
    /**
     * Обновление микрорайона
     */
    async updateMicrodistrict(id, microdistrictData) {
        return await this.request(`${CONFIG.api.endpoints.microdistricts}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(microdistrictData)
        });
    },
    
    /**
     * Удаление микрорайона
     */
    async deleteMicrodistrict(id) {
        return await this.request(`${CONFIG.api.endpoints.microdistricts}/${id}`, {
            method: 'DELETE'
        });
    }
};
