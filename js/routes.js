/**
 * Модуль для работы с маршрутами
 */

const RoutesModule = {
    // Текущий маршрут
    currentRoute: [],
    
    /**
     * Инициализирует модуль
     */
    init: function() {
        // Привязываем обработчики к кнопкам
        document.getElementById('build-route').addEventListener('click', this.buildRoute.bind(this));
        document.getElementById('export-route').addEventListener('click', this.exportRoute.bind(this));
        document.getElementById('export-route-excel').addEventListener('click', this.exportRouteToExcel.bind(this));
        document.getElementById('export-route-html').addEventListener('click', this.exportRouteToHTML.bind(this));
    },
    
    /**
     * Строит маршрут
     */
    buildRoute: function() {
        console.log('Начало построения маршрута...');
        
        // Получаем выбранные значения
        const district = document.getElementById('district-select').value;
        const microdistrict = document.getElementById('microdistrict-select').value;
        const visitDay = document.getElementById('visit-day-select').value;
        
        console.log('Выбранные фильтры:', { district, microdistrict, visitDay });
        
        // Проверяем наличие клиентов
        if (!ClientsModule.clients || ClientsModule.clients.length === 0) {
            // Пробуем загрузить клиентов из localStorage
            const savedClients = Utils.loadFromLocalStorage(CONFIG.storage.clientsKey);
            if (savedClients && savedClients.length > 0) {
                console.log('Загружены клиенты из localStorage:', savedClients.length);
                ClientsModule.clients = savedClients;
            } else {
                alert('Загрузите файл с клиентами');
                return;
            }
        }
        
        console.log('Всего клиентов в системе:', ClientsModule.clients.length);
        
        // Получаем клиентов для маршрута
        let clients;
        
        // Если не выбраны фильтры, используем всех клиентов
        if (!district && !microdistrict) {
            clients = [...ClientsModule.clients];
            console.log('Используем всех клиентов:', clients.length);
        } else {
            try {
                clients = ClientsModule.getClientsForRoute(district, microdistrict, visitDay);
                console.log('Клиенты после фильтрации:', clients.length);
            } catch (e) {
                console.error('Ошибка при фильтрации клиентов:', e);
                clients = [...ClientsModule.clients]; // Используем всех клиентов в случае ошибки
            }
        }
        
        // Проверяем, что есть клиенты после фильтрации
        if (!clients || clients.length === 0) {
            alert('Нет клиентов для построения маршрута с выбранными параметрами');
            return;
        }
        
        // Решаем задачу коммивояжера
        const routeIndices = Utils.solveTSP(clients);
        
        // Создаем маршрут
        this.currentRoute = routeIndices.map(index => clients[index]);
        
        // Отображаем маршрут на карте
        MapModule.showRoute(this.currentRoute);
        
        // Обновляем список маршрута
        this.updateRouteList();
        
        // Очищаем сообщение о пустом маршруте
        const emptyMessage = document.querySelector('.route-list .empty-message');
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
        console.log(`Построен маршрут из ${this.currentRoute.length} точек`);
    },
    
    /**
     * Обновляет список маршрута в сайдбаре
     */
    updateRouteList: function() {
        const container = document.getElementById('route-container');
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Если нет маршрута, показываем сообщение
        if (this.currentRoute.length === 0) {
            container.innerHTML = '<p class="empty-message">Маршрут не построен</p>';
            return;
        }
        
        // Добавляем информацию о маршруте
        const district = document.getElementById('district-select').value;
        const microdistrict = document.getElementById('microdistrict-select').value;
        
        const routeInfo = document.createElement('div');
        routeInfo.className = 'route-info';
        routeInfo.innerHTML = `
            <p><strong>Район:</strong> ${district || 'Все районы'}</p>
            ${microdistrict ? `<p><strong>Микрорайон:</strong> ${microdistrict}</p>` : ''}
            <p><strong>Всего точек:</strong> ${this.currentRoute.length}</p>
        `;
        container.appendChild(routeInfo);
        
        // Добавляем клиентов в список
        this.currentRoute.forEach((client, index) => {
            const routeItem = document.createElement('div');
            routeItem.className = 'route-item';
            
            routeItem.innerHTML = `
                <div class="route-number">${index + 1}</div>
                <div class="route-client-info">
                    <div class="client-name"><strong>${client.name}</strong></div>
                    <div class="client-info">
                        <small>
                            ${client.type ? `Тип ТТ: ${client.type}<br>` : ''}
                            ${client.phone ? `Телефон: ${client.phone}<br>` : ''}
                            ${client.district ? `Район: ${client.district}<br>` : ''}
                            ${client.microdistrict ? `Микрорайон: ${client.microdistrict}` : ''}
                        </small>
                    </div>
                </div>
            `;
            
            // Добавляем обработчик клика
            routeItem.addEventListener('click', () => {
                // Приближаем карту к клиенту
                MapModule.map.setView([client.lat, client.lng], 16);
                
                // Находим маркер и открываем всплывающее окно
                MapModule.routeLayer.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        const latlng = layer.getLatLng();
                        if (latlng.lat === client.lat && latlng.lng === client.lng) {
                            layer.openPopup();
                        }
                    }
                });
            });
            
            container.appendChild(routeItem);
        });
    },
    
    /**
     * Экспортирует маршрут в PDF
     */
    exportRoute: function() {
        // Проверяем, что есть маршрут
        if (this.currentRoute.length === 0) {
            alert('Сначала постройте маршрут');
            return;
        }
        
        // Получаем выбранные значения
        const district = document.getElementById('district-select').value;
        const microdistrict = document.getElementById('microdistrict-select').value;
        
        // Показываем предварительный просмотр маршрута
        Utils.showRoutePreview(this.currentRoute, district, microdistrict || 'Все микрорайоны');
    },
    
    /**
     * Экспортирует маршрут в Excel
     */
    exportRouteToExcel: function() {
        if (!this.currentRoute || this.currentRoute.length === 0) {
            alert('Нет данных для экспорта. Сначала постройте маршрут.');
            return;
        }
        
        // Получаем выбранные значения
        const district = document.getElementById('district-select').value;
        const microdistrict = document.getElementById('microdistrict-select').value;
        
        // Получаем текстовые значения для выбранных опций
        const districtName = district ? document.getElementById('district-select').options[document.getElementById('district-select').selectedIndex].text : '';
        const microdistrictName = microdistrict ? document.getElementById('microdistrict-select').options[document.getElementById('microdistrict-select').selectedIndex].text : '';
        
        Utils.exportRouteToExcel(this.currentRoute, districtName, microdistrictName || 'Все микрорайоны');
    },
    
    /**
     * Экспортирует маршрут в HTML-таблицу
     */
    exportRouteToHTML: function() {
        if (!this.currentRoute || this.currentRoute.length === 0) {
            alert('Нет данных для экспорта. Сначала постройте маршрут.');
            return;
        }
        
        // Получаем выбранные значения
        const district = document.getElementById('district-select').value;
        const microdistrict = document.getElementById('microdistrict-select').value;
        
        // Получаем текстовые значения для выбранных опций
        const districtName = district ? document.getElementById('district-select').options[document.getElementById('district-select').selectedIndex].text : '';
        const microdistrictName = microdistrict ? document.getElementById('microdistrict-select').options[document.getElementById('microdistrict-select').selectedIndex].text : '';
        
        Utils.exportRouteToHTML(this.currentRoute, districtName, microdistrictName || 'Все микрорайоны');
    },
    

    
    /**
     * Очищает маршрут
     */
    clearRoute: function() {
        this.currentRoute = [];
        MapModule.clearRoute();
        
        // Очищаем список маршрута
        document.getElementById('route-container').innerHTML = '<p class="empty-message">Постройте маршрут, чтобы увидеть его здесь</p>';
    }
};
