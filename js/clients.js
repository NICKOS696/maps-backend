/**
 * Модуль для работы с клиентами
 */

const ClientsModule = {
    // Массив клиентов
    clients: [],
    
    /**
     * Инициализирует модуль
     */
    init: function() {
        // Привязываем обработчик к загрузке файла
        document.getElementById('client-upload').addEventListener('change', this.handleFileUpload.bind(this));
        
        // Привязываем обработчик к кнопке очистки списка клиентов
        document.getElementById('clear-clients').addEventListener('click', this.clearClients.bind(this));
        
        // Отключена автоматическая загрузка клиентов из localStorage
        // Пользователь должен загрузить список клиентов из файла
    },
    
    /**
     * Обработчик загрузки файла (Excel или HTML)
     */
    handleFileUpload: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        // Определяем тип файла по расширению
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'html' || fileExtension === 'htm') {
            // Обработка HTML файла
            reader.onload = (event) => {
                try {
                    // Читаем HTML файл как текст
                    const htmlContent = event.target.result;
                    
                    // Обрабатываем HTML данные
                    this.processHTMLData(htmlContent);
                    
                    // Очищаем input
                    e.target.value = '';
                } catch (error) {
                    console.error('Ошибка при чтении HTML файла:', error);
                    alert('Ошибка при чтении HTML файла. Проверьте формат файла.');
                }
            };
            
            reader.readAsText(file);
        } else {
            // Обработка Excel файла (для обратной совместимости)
            reader.onload = (event) => {
                try {
                    // Читаем Excel файл
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Берем первый лист
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Конвертируем в JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
                    
                    // Обрабатываем данные
                    this.processExcelData(jsonData);
                    
                    // Очищаем input
                    e.target.value = '';
                } catch (error) {
                    console.error('Ошибка при чтении Excel файла:', error);
                    alert('Ошибка при чтении Excel файла. Проверьте формат файла.');
                }
            };
            
            reader.readAsArrayBuffer(file);
        }
    },
    
    /**
     * Обрабатывает данные из HTML файла
     * @param {string} htmlContent - HTML содержимое файла
     */
    processHTMLData: function(htmlContent) {
        console.log('Начало обработки HTML файла');
        
        try {
            // Создаем DOM-парсер для обработки HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // Находим все строки таблицы (пропускаем заголовок)
            const rows = doc.querySelectorAll('tr');
            console.log('Найдено строк в таблице:', rows.length);
            
            // Очищаем текущих клиентов
            this.clients = [];
            
            // Начинаем с 1, чтобы пропустить заголовок
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                
                // Проверяем, что у нас достаточно ячеек
                if (cells.length < 7) {
                    console.log(`Строка ${i} имеет недостаточно ячеек: ${cells.length}`);
                    continue;
                }
                
                try {
                    // Получаем данные из ячеек
                    const name = cells[0].textContent.trim();
                    const district = cells[1].textContent.trim();
                    const lat = parseFloat(cells[2].textContent.trim());
                    const lng = parseFloat(cells[3].textContent.trim());
                    const category = cells[4].textContent.trim();
                    const type = cells[5].textContent.trim();
                    const phone = cells[6].textContent.trim();
                    
                    // Проверяем корректность координат
                    if (isNaN(lat) || isNaN(lng) || !name) {
                        console.log(`Пропускаем клиента с некорректными данными: ${name}, ${lat}, ${lng}`);
                        continue;
                    }
                    
                    // Создаем объект клиента
                    const client = {
                        name: name,
                        district: district,
                        lat: lat,
                        lng: lng,
                        category: category,
                        type: type,
                        phone: phone
                    };
                    
                    // Определяем микрорайон
                    const point = [client.lat, client.lng];
                    client.microdistrict = DistrictsModule.getMicrodistrictForPoint(point);
                    console.log(`Клиент ${client.name}: район=${client.district}, микрорайон=${client.microdistrict}`);
                    
                    // Добавляем клиента в массив
                    this.clients.push(client);
                } catch (e) {
                    console.error(`Ошибка при обработке строки ${i}:`, e);
                }
            }
            
            console.log(`Загружено клиентов: ${this.clients.length}`);
            
            // Сохраняем клиентов в localStorage
            Utils.saveToLocalStorage(CONFIG.storage.clientsKey, this.clients);
            
            // Отображаем клиентов на карте
            this.displayClients();
            
            // Обновляем список клиентов
            this.updateClientList();
            
            console.log(`Загружено ${this.clients.length} клиентов из HTML`);
            
            if (this.clients.length === 0) {
                alert('Не удалось загрузить клиентов из HTML файла. Проверьте формат файла.');
            } else {
                alert(`Успешно загружено ${this.clients.length} клиентов`);
            }
        } catch (error) {
            console.error('Ошибка при обработке HTML данных:', error);
            alert('Ошибка при обработке HTML данных. Проверьте формат файла.');
        }
    },
    
    /**
     * Обрабатывает данные из Excel
     */
    processExcelData: function(data) {
        // Проверяем наличие заголовков
        if (data.length === 0) {
            alert('Файл пуст или не содержит данных');
            return;
        }
        
        // Очищаем текущих клиентов
        this.clients = [];
        
        // Пропускаем заголовок и обрабатываем данные
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            
            // Проверяем наличие необходимых данных
            if (!row.A || !row.C || !row.D) continue;
            
            // Создаем объект клиента с новой структурой
            const client = {
                name: row.A,                 // Клиент
                district: row.B || '',       // Подотдел (район)
                lat: parseFloat(row.C),       // Широта
                lng: parseFloat(row.D),       // Долгота
                category: row.E || '',       // Категория ТТ
                type: row.F || '',           // Тип ТТ
                phone: row.G || ''           // Телефон
            };
            
            // Проверяем корректность координат
            if (isNaN(client.lat) || isNaN(client.lng)) continue;
            
            // Определяем микрорайон
            const point = [client.lat, client.lng];
            client.microdistrict = DistrictsModule.getMicrodistrictForPoint(point);
            
            // Если район не указан в файле, определяем его по координатам
            if (!client.district) {
                client.district = DistrictsModule.getDistrictForPoint(point);
            }
            
            // Добавляем клиента в массив
            this.clients.push(client);
        }
        
        // Сохраняем клиентов в localStorage
        Utils.saveToLocalStorage(CONFIG.storage.clientsKey, this.clients);
        
        // Отображаем клиентов на карте
        this.displayClients();
        
        // Обновляем список клиентов
        this.updateClientList();
        
        console.log(`Загружено ${this.clients.length} клиентов`);
        
        if (this.clients.length === 0) {
            alert('Не удалось загрузить клиентов из Excel файла. Проверьте формат файла.');
        } else {
            alert(`Успешно загружено ${this.clients.length} клиентов`);
        }
    },
    
    /**
     * Загружает клиентов из сохраненных данных
     */
    loadClients: function(clients) {
        this.clients = clients;
        
        // Отображаем клиентов на карте
        this.displayClients();
        
        // Обновляем список клиентов
        this.updateClientList();
        
        console.log(`Загружено ${this.clients.length} клиентов из сохраненных данных`);
    },
    
    /**
     * Отображает клиентов на карте
     */
    displayClients: function() {
        // Очищаем слой клиентов
        MapModule.clientLayer.clearLayers();
        
        console.log(`Отображение ${this.clients.length} клиентов на карте`);
        
        // Добавляем маркеры для каждого клиента
        this.clients.forEach((client, index) => {
            // Проверяем корректность координат
            if (!client.lat || !client.lng || isNaN(client.lat) || isNaN(client.lng)) {
                console.warn(`Клиент ${client.name} имеет некорректные координаты:`, client.lat, client.lng);
                return;
            }
            
            // Используем стандартный цвет для всех клиентов
            const color = '#3388ff';
            
            // Создаем маркер с дивовой иконкой, которая будет гарантированно поверх всех слоев
            const marker = L.marker([client.lat, client.lng], {
                icon: L.divIcon({
                    html: `<div style="width: 16px; height: 16px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                    className: 'client-marker-icon',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                }),
                bubblingMouseEvents: false, // Отключаем всплытие событий мыши
                zIndexOffset: 1000 // Устанавливаем высокий z-index для маркеров
            });
            
            // Добавляем всплывающее окно
            marker.bindPopup(Utils.createClientPopupContent(client));
            
            // Добавляем на слой клиентов
            MapModule.clientLayer.addLayer(marker);
        });
        
        console.log(`Добавлено маркеров на карту: ${MapModule.clientLayer.getLayers().length}`);
        
        // НЕ приближаем карту автоматически - пользователь сам выберет нужную область
        // Это предотвращает неожиданные перемещения карты
    },
    
    /**
     * Обновляет список клиентов в сайдбаре
     */
    updateClientList: function() {
        const container = document.getElementById('clients-container');
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Если нет клиентов, показываем сообщение
        if (this.clients.length === 0) {
            container.innerHTML = '<p class="empty-message">Загрузите файл с клиентами</p>';
            return;
        }
        
        // Добавляем клиентов в список
        this.clients.forEach((client, index) => {
            const clientItem = document.createElement('div');
            clientItem.className = 'client-item';
            
            // Используем стандартный цвет
            const color = '#3388ff';
            
            clientItem.innerHTML = `
                <div class="client-name" style="color: ${color}">
                    <strong>${client.name}</strong>
                </div>
                <div class="client-info">
                    <small>
                        ${client.type ? `Тип ТТ: ${client.type}<br>` : ''}
                        ${client.phone ? `Телефон: ${client.phone}<br>` : ''}
                        ${client.district ? `Район: ${client.district}<br>` : ''}
                        ${client.microdistrict ? `Микрорайон: ${client.microdistrict}` : ''}
                    </small>
                </div>
            `;
            
            // Добавляем обработчик клика
            clientItem.addEventListener('click', () => {
                // Приближаем карту к клиенту
                MapModule.map.setView([client.lat, client.lng], 16);
                
                // Находим маркер и открываем всплывающее окно
                MapModule.clientLayer.eachLayer(layer => {
                    const latlng = layer.getLatLng();
                    if (latlng.lat === client.lat && latlng.lng === client.lng) {
                        layer.openPopup();
                    }
                });
            });
            
            container.appendChild(clientItem);
        });
    },
    
    /**
     * Фильтрует клиентов по району и микрорайону на основе их географического положения
     * @param {string} district - Название района
     * @param {string} microdistrict - Название микрорайона
     * @param {string} visitDay - День посещения (не используется)
     * @returns {Array} Отфильтрованный массив клиентов
     */
    filterClients: function(district, microdistrict, visitDay) {
        let filtered = [...this.clients];
        
        console.log(`=== ФИЛЬТРАЦИЯ КЛИЕНТОВ ===`);
        console.log(`Параметры: район="${district}", микрорайон="${microdistrict}"`);
        console.log(`Всего клиентов до фильтрации: ${filtered.length}`);
        
        // Если нет клиентов, возвращаем пустой массив
        if (filtered.length === 0) {
            console.log('⚠️ Нет клиентов для фильтрации');
            return filtered;
        }
        
        // Если не выбран район и микрорайон, возвращаем всех клиентов
        if (!district && !microdistrict) {
            console.log('✓ Фильтры не выбраны, возвращаем всех клиентов:', filtered.length);
            return filtered;
        }
        
        // Проверяем, загружены ли районы/микрорайоны на карте
        // Используем кэш allDistrictLayers вместо getLayers() для более надежной проверки
        const hasDistricts = MapModule.allDistrictLayers && MapModule.allDistrictLayers.length > 0;
        const hasMicrodistricts = MapModule.allMicrodistrictLayers && MapModule.allMicrodistrictLayers.length > 0;
        
        console.log(`Районы на карте: ${hasDistricts ? `загружены (${MapModule.allDistrictLayers?.length || 0})` : '❌ НЕ ЗАГРУЖЕНЫ'}`);
        console.log(`Микрорайоны на карте: ${hasMicrodistricts ? `загружены (${MapModule.allMicrodistrictLayers?.length || 0})` : '❌ НЕ ЗАГРУЖЕНЫ'}`);
        
        if (district && !hasDistricts) {
            console.error('❌ ОШИБКА: Выбран район для фильтрации, но районы не загружены на карте!');
            console.log('💡 Решение: Сначала нажмите "Загрузить районы"');
            alert('Сначала загрузите районы на карту (кнопка "Загрузить районы")');
            return [];
        }
        
        if (microdistrict && !hasMicrodistricts) {
            console.error('❌ ОШИБКА: Выбран микрорайон для фильтрации, но микрорайоны не загружены на карте!');
            console.log('💡 Решение: Сначала нажмите "Загрузить микрорайоны"');
            alert('Сначала загрузите микрорайоны на карту (кнопка "Загрузить микрорайоны")');
            return [];
        }
        
        // Фильтруем по географическому положению
        let matchedCount = 0;
        filtered = filtered.filter(client => {
            // Проверяем наличие координат
            if (!client || typeof client.lat !== 'number' || typeof client.lng !== 'number' || isNaN(client.lat) || isNaN(client.lng)) {
                console.warn('⚠️ Клиент без координат:', client);
                return false;
            }
            
            const point = [client.lat, client.lng];
            let matchesDistrict = true;
            let matchesMicrodistrict = true;
            
            // Проверяем принадлежность к району - используем геопространственную проверку
            if (district) {
                matchesDistrict = false;
                // Ищем слой района с выбранным названием
                MapModule.allDistrictLayers.forEach(layer => {
                    if (layer.feature && layer.feature.properties && layer.feature.properties.name === district) {
                        // Проверяем, находится ли точка внутри этого полигона
                        const latLng = L.latLng(point[0], point[1]);
                        if (layer.getBounds && layer.getBounds().contains(latLng)) {
                            // Дополнительная проверка через leaflet-pip или turf
                            try {
                                const geoJson = layer.toGeoJSON();
                                if (turf && turf.booleanPointInPolygon) {
                                    const turfPoint = turf.point([point[1], point[0]]); // turf использует [lng, lat]
                                    if (turf.booleanPointInPolygon(turfPoint, geoJson)) {
                                        matchesDistrict = true;
                                    }
                                }
                            } catch (e) {
                                // Если turf не доступен, используем простую проверку bounds
                                matchesDistrict = true;
                            }
                        }
                    }
                });
            }
            
            // Проверяем принадлежность к микрорайону
            if (microdistrict) {
                matchesMicrodistrict = false;
                // Ищем слой микрорайона с выбранным названием
                MapModule.allMicrodistrictLayers.forEach(layer => {
                    if (layer.feature && layer.feature.properties && layer.feature.properties.name === microdistrict) {
                        // Проверяем, находится ли точка внутри этого полигона
                        const latLng = L.latLng(point[0], point[1]);
                        if (layer.getBounds && layer.getBounds().contains(latLng)) {
                            try {
                                const geoJson = layer.toGeoJSON();
                                if (turf && turf.booleanPointInPolygon) {
                                    const turfPoint = turf.point([point[1], point[0]]);
                                    if (turf.booleanPointInPolygon(turfPoint, geoJson)) {
                                        matchesMicrodistrict = true;
                                    }
                                }
                            } catch (e) {
                                matchesMicrodistrict = true;
                            }
                        }
                    }
                });
            }
            
            const matches = matchesDistrict && matchesMicrodistrict;
            if (matches) matchedCount++;
            
            return matches;
        });
        
        console.log(`✓ После фильтрации: ${filtered.length} клиентов (совпало: ${matchedCount})`);
        console.log(`=== КОНЕЦ ФИЛЬТРАЦИИ ===`);
        
        return filtered;
    },
    
    /**
     * Получает клиентов для построения маршрута
     */
    getClientsForRoute: function(district, microdistrict, visitDay) {
        console.log('Получение клиентов для маршрута...');
        console.log('Фильтры:', { district, microdistrict, visitDay });
        
        // Проверяем, есть ли клиенты в модуле
        if (!this.clients || this.clients.length === 0) {
            // Пробуем загрузить клиентов из localStorage
            const savedClients = Utils.loadFromLocalStorage(CONFIG.storage.clientsKey);
            if (savedClients && savedClients.length > 0) {
                console.log('Загружены клиенты из localStorage:', savedClients.length);
                this.clients = savedClients;
                // Отображаем клиентов на карте
                this.displayClients();
            } else {
                console.log('Нет клиентов для маршрута');
                return [];
            }
        }
        
        console.log('Всего клиентов:', this.clients.length);
        console.log('Первый клиент:', this.clients.length > 0 ? JSON.stringify(this.clients[0]) : 'нет клиентов');
        
        // Если нет фильтров, возвращаем всех клиентов
        if (!district && !microdistrict) {
            console.log('Возвращаем всех клиентов:', this.clients.length);
            return [...this.clients]; // Возвращаем копию массива
        }
        
        // Фильтруем клиентов
        const filteredClients = this.filterClients(district, microdistrict, visitDay);
        console.log('Клиенты после фильтрации:', filteredClients.length);
        
        return filteredClients;
    },
    
    /**
     * Очищает список клиентов
     */
    clearClients: function() {
        // Запрашиваем подтверждение
        if (confirm('Вы уверены, что хотите очистить список клиентов?')) {
            // Очищаем массив клиентов
            this.clients = [];
            
            // Удаляем из localStorage
            localStorage.removeItem(CONFIG.storage.clientsKey);
            
            // Очищаем список клиентов в интерфейсе
            const clientsContainer = document.getElementById('clients-container');
            clientsContainer.innerHTML = '<p class="empty-message">Загрузите Excel-файл с клиентами</p>';
            
            // Удаляем маркеры с карты
            MapModule.clientLayer.clearLayers();
            
            // Очищаем маршрут
            MapModule.clearRoute();
            
            // Очищаем список маршрута
            document.getElementById('route-container').innerHTML = '<p class="empty-message">Постройте маршрут, чтобы увидеть его здесь</p>';
            
            // Показываем сообщение об успешной очистке
            alert('Список клиентов успешно очищен');
        }
    }
};
