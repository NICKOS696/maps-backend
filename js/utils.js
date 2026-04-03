/**
 * Утилиты для работы с приложением
 */

const Utils = {
    /**
     * Загружает данные из localStorage
     * @param {string} key - Ключ для загрузки
     * @returns {Object|null} Загруженные данные или null, если данных нет
     */
    loadFromLocalStorage: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Ошибка при загрузке данных из localStorage:', error);
            return null;
        }
    },
    
    /**
     * Сохраняет данные в localStorage с безопасной обработкой циклических ссылок
     * @param {string} key - Ключ для сохранения
     * @param {Object} data - Данные для сохранения
     */
    saveToLocalStorage: function(key, data) {
        try {
            // Создаем безопасную копию данных без циклических ссылок
            const getCircularReplacer = () => {
                const seen = new WeakSet();
                return (key, value) => {
                    // Пропускаем свойства Leaflet
                    if (key.startsWith('_') && key !== '_latlngs' && key !== '_layers') {
                        return undefined;
                    }
                    
                    // Обработка циклических ссылок
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return undefined; // Исключаем циклические ссылки
                        }
                        seen.add(value);
                    }
                    return value;
                };
            };
            
            // Используем специальный replacer для обработки циклических ссылок
            localStorage.setItem(key, JSON.stringify(data, getCircularReplacer()));
            console.log('Данные успешно сохранены в localStorage для ключа:', key);
        } catch (error) {
            console.error('Ошибка при сохранении данных в localStorage:', error);
            // Не показываем алерт, чтобы не раздражать пользователя
        }
    },
    
    /**
     * Генерирует случайный цвет в формате HEX
     * @returns {string} Случайный цвет в формате HEX
     */
    getRandomColor: function() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },
    
    /**
     * Создает оттенок цвета (осветляет или затемняет)
     * @param {string} color - Исходный цвет в формате HEX (#RRGGBB)
     * @param {number} factor - Коэффициент изменения (>0 - осветление, <0 - затемнение)
     * @returns {string} Новый цвет в формате HEX
     */
    getColorShade: function(color, factor) {
        // Проверяем формат цвета
        if (!color || color.charAt(0) !== '#') {
            return this.getRandomColor(); // Если цвет неверный, возвращаем случайный
        }
        
        // Преобразуем HEX в RGB
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
        
        // Изменяем яркость
        if (factor > 0) {
            // Осветляем
            r = Math.min(255, Math.floor(r + (255 - r) * factor));
            g = Math.min(255, Math.floor(g + (255 - g) * factor));
            b = Math.min(255, Math.floor(b + (255 - b) * factor));
        } else {
            // Затемняем
            factor = Math.abs(factor);
            r = Math.max(0, Math.floor(r * (1 - factor)));
            g = Math.max(0, Math.floor(g * (1 - factor)));
            b = Math.max(0, Math.floor(b * (1 - factor)));
        }
        
        // Преобразуем обратно в HEX
        return '#' + 
            ((r < 16 ? '0' : '') + r.toString(16)) + 
            ((g < 16 ? '0' : '') + g.toString(16)) + 
            ((b < 16 ? '0' : '') + b.toString(16));
    },
    
    /**
     * Создает содержимое всплывающего окна для клиента
     * @param {Object} client - Объект клиента
     * @returns {string} HTML-содержимое всплывающего окна
     */
    createClientPopupContent: function(client) {
        let content = `
            <div class="client-popup">
                <h3>${client.name}</h3>
                <table class="client-info">
        `;
        
        // Добавляем тип ТТ
        if (client.type) {
            content += `
                    <tr>
                        <td><strong>Тип ТТ:</strong></td>
                        <td>${client.type}</td>
                    </tr>
            `;
        }
        
        // Добавляем телефон
        if (client.phone) {
            content += `
                    <tr>
                        <td><strong>Телефон:</strong></td>
                        <td>${client.phone}</td>
                    </tr>
            `;
        }
        
        // Добавляем район
        if (client.district) {
            content += `
                    <tr>
                        <td><strong>Район:</strong></td>
                        <td>${client.district}</td>
                    </tr>
            `;
        }
        
        // Добавляем микрорайон
        if (client.microdistrict) {
            content += `
                    <tr>
                        <td><strong>Микрорайон:</strong></td>
                        <td>${client.microdistrict}</td>
                    </tr>
            `;
        }
        
        // Добавляем категорию ТТ
        if (client.category) {
            content += `
                    <tr>
                        <td><strong>Категория ТТ:</strong></td>
                        <td>${client.category}</td>
                    </tr>
            `;
        }
        
        // Добавляем координаты
        content += `
                    <tr>
                        <td><strong>Координаты:</strong></td>
                        <td>${client.lat.toFixed(6)}, ${client.lng.toFixed(6)}</td>
                    </tr>
        `;
        
        content += `
                </table>
            </div>
        `;
        
        return content;
    },
    
    /**
     * Возвращает название дня недели по его номеру
     * @param {number} dayNumber - Номер дня недели (1-7)
     * @returns {string} Название дня недели
     */
    getDayName: function(dayNumber) {
        const days = [
            'Воскресенье',
            'Понедельник',
            'Вторник',
            'Среда',
            'Четверг',
            'Пятница',
            'Суббота'
        ];
        
        // Приводим к индексу массива (0-6)
        const index = ((dayNumber - 1) % 7 + 7) % 7;
        return days[index];
    },
    
    /**
     * Загружает GeoJSON файл
     * @param {string} url - URL файла
     * @returns {Promise} Promise с данными GeoJSON
     */
    loadGeoJSON: function(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Ошибка при загрузке GeoJSON:', error);
                return this.createEmptyGeoJSON();
            });
    },
    
    /**
     * Создает пустой GeoJSON объект
     * @returns {Object} Пустой GeoJSON объект
     */
    createEmptyGeoJSON: function() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    },
    
    /**
     * Создает GeoJSON объект с заданной геометрией и свойствами
     * @param {Object} geometry - Геометрия объекта
     * @param {Object} properties - Свойства объекта
     * @returns {Object} GeoJSON объект
     */
    createGeoJSONFeature: function(geometry, properties) {
        return {
            type: 'Feature',
            geometry: geometry,
            properties: properties || {}
        };
    },
    
    /**
     * Проверяет, находится ли точка внутри полигона
     * @param {Array} point - Точка [lat, lng]
     * @param {Object} polygon - GeoJSON полигон
     * @returns {boolean} true, если точка внутри полигона
     */
    isPointInPolygon: function(point, polygon) {
        try {
            // Создаем точку в формате GeoJSON (lng, lat)
            const pt = turf.point([point[1], point[0]]);
            
            // Проверяем, что полигон имеет правильную структуру
            if (!polygon || !polygon.geometry || !polygon.geometry.coordinates) {
                return false;
            }
            
            // Если это MultiPolygon, проверяем каждый полигон
            if (polygon.geometry.type === 'MultiPolygon') {
                for (let i = 0; i < polygon.geometry.coordinates.length; i++) {
                    try {
                        // Проверяем и исправляем замкнутость полигона
                        const coords = polygon.geometry.coordinates[i];
                        for (let j = 0; j < coords.length; j++) {
                            const ring = coords[j];
                            if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
                                // Замыкаем кольцо, добавляя первую точку в конец
                                ring.push([...ring[0]]);
                            }
                        }
                        
                        const poly = turf.polygon(coords);
                        if (turf.booleanPointInPolygon(pt, poly)) {
                            return true;
                        }
                    } catch (e) {
                        console.warn('Ошибка при обработке MultiPolygon:', e);
                        // Продолжаем с другими полигонами
                    }
                }
                return false;
            } 
            // Если это обычный Polygon
            else if (polygon.geometry.type === 'Polygon') {
                try {
                    // Проверяем и исправляем замкнутость полигона
                    const coords = [...polygon.geometry.coordinates];
                    for (let i = 0; i < coords.length; i++) {
                        const ring = coords[i];
                        if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
                            // Замыкаем кольцо, добавляя первую точку в конец
                            ring.push([...ring[0]]);
                        }
                    }
                    
                    const poly = turf.polygon(coords);
                    return turf.booleanPointInPolygon(pt, poly);
                } catch (e) {
                    console.warn('Ошибка при обработке Polygon:', e);
                    return false;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Ошибка при проверке точки в полигоне:', error);
            return false;
        }
    },
    
    /**
     * Решает задачу коммивояжера (поиск кратчайшего маршрута)
     * @param {Array} clients - Массив клиентов
     * @returns {Array} Массив индексов клиентов в порядке обхода
     */
    solveTSP: function(clients) {
        console.log('Начало решения задачи коммивояжера...');
        console.log('Получено клиентов:', clients ? clients.length : 0);
        
        // Проверяем входные данные
        if (!clients) {
            console.error('Ошибка: массив клиентов не определен');
            return [];
        }
        
        if (clients.length <= 1) {
            console.log('Мало клиентов для построения маршрута:', clients.length);
            return clients.map((_, i) => i);
        }
        
        // Проверяем наличие координат у клиентов
        const validClients = clients.filter(client => {
            if (!client || typeof client.lat !== 'number' || typeof client.lng !== 'number' || isNaN(client.lat) || isNaN(client.lng)) {
                console.warn('Обнаружен клиент без координат:', client);
                return false;
            }
            return true;
        });
        
        console.log('Валидных клиентов с координатами:', validClients.length);
        
        if (validClients.length !== clients.length) {
            console.warn('Некоторые клиенты были исключены из-за отсутствия координат');
        }
        
        if (validClients.length <= 1) {
            console.error('Недостаточно валидных клиентов для построения маршрута');
            return validClients.map((_, i) => i);
        }
        
        try {
            // Создаем матрицу расстояний
            const n = validClients.length;
            const distances = Array(n).fill().map(() => Array(n).fill(0));
            
            console.log('Создание матрицы расстояний для', n, 'клиентов');
            
            // Заполняем матрицу расстояний
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i === j) continue;
                    
                    try {
                        // Вычисляем расстояние между клиентами
                        const from = turf.point([validClients[i].lng, validClients[i].lat]);
                        const to = turf.point([validClients[j].lng, validClients[j].lat]);
                        distances[i][j] = turf.distance(from, to, {units: 'kilometers'});
                    } catch (e) {
                        console.error('Ошибка при расчете расстояния между клиентами', i, 'и', j, ':', e);
                        distances[i][j] = 999999; // Большое значение в случае ошибки
                    }
                }
            }
            
            console.log('Матрица расстояний создана успешно');
            
            // Ищем наилучшую начальную точку (точку с минимальной суммой расстояний)
            let bestStartIndex = 0;
            let minTotalDistance = Infinity;
            
            for (let startIndex = 0; startIndex < n; startIndex++) {
                let totalDistance = 0;
                for (let j = 0; j < n; j++) {
                    if (startIndex !== j) {
                        totalDistance += distances[startIndex][j];
                    }
                }
                
                if (totalDistance < minTotalDistance) {
                    minTotalDistance = totalDistance;
                    bestStartIndex = startIndex;
                }
            }
            
            console.log('Найдена начальная точка маршрута:', bestStartIndex);
            
            // Жадный алгоритм для решения TSP
            const visited = Array(n).fill(false);
            const route = [bestStartIndex]; // Начинаем с найденной начальной точки
            visited[bestStartIndex] = true;
            
            // Пока не посетили всех клиентов
            while (route.length < n) {
                let lastIndex = route[route.length - 1];
                let minDist = Infinity;
                let minIndex = -1;
                
                // Ищем ближайшего непосещенного клиента
                for (let i = 0; i < n; i++) {
                    if (!visited[i] && distances[lastIndex][i] < minDist) {
                        minDist = distances[lastIndex][i];
                        minIndex = i;
                    }
                }
                
                if (minIndex !== -1) {
                    route.push(minIndex);
                    visited[minIndex] = true;
                }
            }
            
            console.log('Маршрут построен, длина:', route.length);
            
            // Применяем алгоритм 2-opt для улучшения маршрута
            try {
                this.optimize2Opt(route, distances);
                console.log('Маршрут оптимизирован');
            } catch (e) {
                console.error('Ошибка при оптимизации маршрута:', e);
            }
            
            // Преобразуем индексы валидных клиентов в индексы исходных клиентов
            if (validClients.length !== clients.length) {
                // Создаем маппинг индексов
                const validIndices = clients.map((client, index) => {
                    if (!client || typeof client.lat !== 'number' || typeof client.lng !== 'number' || isNaN(client.lat) || isNaN(client.lng)) {
                        return -1; // Невалидный клиент
                    }
                    return index;
                }).filter(index => index !== -1);
                
                // Преобразуем индексы
                const originalIndices = route.map(validIndex => validIndices[validIndex]);
                console.log('Маршрут преобразован в исходные индексы');
                return originalIndices;
            }
            
            console.log('Задача коммивояжера решена успешно');
            return route;
        } catch (e) {
            console.error('Ошибка при решении задачи коммивояжера:', e);
            // В случае ошибки возвращаем простой маршрут по порядку
            return validClients.map((_, i) => i);
        }
    },
    
    /**
     * Оптимизирует маршрут с помощью алгоритма 2-opt
     * @param {Array} route - Маршрут (массив индексов)
     * @param {Array} distances - Матрица расстояний
     */
    optimize2Opt: function(route, distances) {
        const n = route.length;
        let improved = true;
        let iterations = 0;
        const maxIterations = 100; // Ограничиваем количество итераций
        
        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;
            
            for (let i = 0; i < n - 2; i++) {
                for (let j = i + 2; j < n; j++) {
                    // Вычисляем длину текущего маршрута
                    const currentDistance = 
                        distances[route[i]][route[i+1]] + 
                        distances[route[j]][route[(j+1) % n]];
                    
                    // Вычисляем длину после перестановки
                    const newDistance = 
                        distances[route[i]][route[j]] + 
                        distances[route[i+1]][route[(j+1) % n]];
                    
                    // Если новый маршрут короче, применяем перестановку
                    if (newDistance < currentDistance) {
                        // Переворачиваем участок маршрута
                        this.reverseSubroute(route, i + 1, j);
                        improved = true;
                    }
                }
            }
        }
        
        console.log(`Оптимизация 2-opt завершена за ${iterations} итераций`);
    },
    
    /**
     * Переворачивает участок маршрута между индексами start и end
     * @param {Array} route - Маршрут
     * @param {number} start - Начальный индекс
     * @param {number} end - Конечный индекс
     */
    reverseSubroute: function(route, start, end) {
        while (start < end) {
            const temp = route[start];
            route[start] = route[end];
            route[end] = temp;
            start++;
            end--;
        }
    },
    
    /**
     * Показывает предварительный просмотр маршрута
     * @param {Array} route - Маршрут (массив клиентов)
     * @param {string} districtName - Название района
     * @param {string} microdistrictName - Название микрорайона
     */
    showRoutePreview: function(route, districtName, microdistrictName) {
        // Удаляем предыдущее модальное окно, если оно есть
        const oldModal = document.querySelector('.route-preview-modal');
        if (oldModal) {
            document.body.removeChild(oldModal);
        }
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'route-preview-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        // Создаем контейнер для содержимого
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.backgroundColor = 'white';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.position = 'relative';
        
        // Создаем заголовок
        const header = document.createElement('div');
        header.style.padding = '10px';
        header.style.borderBottom = '1px solid #ddd';
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 18px;">Предварительный просмотр маршрута | Район: ${districtName}, Микрорайон: ${microdistrictName} | Точек: ${route.length}</h2>
                <span class="close-btn" style="font-size: 24px; cursor: pointer;">&times;</span>
            </div>
        `;
        
        // Создаем контейнер для карты и списка
        const content = document.createElement('div');
        content.style.display = 'flex';
        content.style.flex = '1';
        content.style.overflow = 'hidden';
        
        // Создаем карту
        const mapContainer = document.createElement('div');
        mapContainer.style.flex = '1';
        mapContainer.style.minWidth = '0';
        mapContainer.style.padding = '10px';
        
        const mapDiv = document.createElement('div');
        mapDiv.id = 'preview-map';
        mapDiv.style.width = '100%';
        mapDiv.style.height = '100%';
        mapDiv.style.border = '1px solid #ddd';
        mapContainer.appendChild(mapDiv);
        
        // Создаем список клиентов
        const listContainer = document.createElement('div');
        listContainer.style.width = '400px';
        listContainer.style.padding = '10px';
        listContainer.style.borderLeft = '1px solid #ddd';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        
        const listHeader = document.createElement('h3');
        listHeader.style.margin = '0 0 10px 0';
        listHeader.style.fontSize = '16px';
        listHeader.textContent = 'Порядок посещения клиентов:';
        listContainer.appendChild(listHeader);
        
        const listContent = document.createElement('div');
        listContent.style.flex = '1';
        listContent.style.overflowY = 'auto';
        
        // Создаем один столбец для всех клиентов
        const column = document.createElement('div');
        column.style.width = '100%';
        
        // Создаем таблицу
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '12px';
        table.style.tableLayout = 'fixed';
        
        // Создаем заголовок таблицы
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background-color: #3498db; color: white;">
                <th style="padding: 4px; text-align: center; border: 1px solid #ddd; width: 50px;">№</th>
                <th style="padding: 4px; text-align: left; border: 1px solid #ddd;">Название клиента</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Создаем тело таблицы
        const tbody = document.createElement('tbody');
        for (let i = 0; i < route.length; i++) {
            const client = route[i];
            const row = document.createElement('tr');
            row.style.backgroundColor = i % 2 === 0 ? 'white' : '#f2f2f2';
            
            const cellNum = document.createElement('td');
            cellNum.style.padding = '4px';
            cellNum.style.textAlign = 'center';
            cellNum.style.border = '1px solid #ddd';
            cellNum.textContent = i + 1;
            
            const cellName = document.createElement('td');
            cellName.style.padding = '4px';
            cellName.style.textAlign = 'left';
            cellName.style.border = '1px solid #ddd';
            cellName.style.overflow = 'hidden';
            cellName.style.textOverflow = 'ellipsis';
            cellName.style.whiteSpace = 'nowrap';
            cellName.textContent = client.name;
            
            row.appendChild(cellNum);
            row.appendChild(cellName);
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        column.appendChild(table);
        
        // Добавляем таблицу в список
        listContent.appendChild(column);
        listContainer.appendChild(listContent);
        
        // Создаем кнопки
        const buttons = document.createElement('div');
        buttons.style.padding = '10px';
        buttons.style.borderTop = '1px solid #ddd';
        buttons.style.textAlign = 'center';
        
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Сохранить';
        exportBtn.style.marginTop = '30px';
        exportBtn.style.padding = '15px';
        exportBtn.style.backgroundColor = '#5B9BD5';
        exportBtn.style.color = 'white';
        exportBtn.style.border = 'none';
        exportBtn.style.borderRadius = '5px';
        exportBtn.style.cursor = 'pointer';
        exportBtn.style.display = 'block';
        exportBtn.style.width = '100%';
        exportBtn.style.fontSize = '18px';
        exportBtn.style.fontWeight = 'bold';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.backgroundColor = '#e74c3c';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.cursor = 'pointer';
        
        buttons.appendChild(exportBtn);
        buttons.appendChild(cancelBtn);
        
        // Собираем все вместе
        content.appendChild(mapContainer);
        content.appendChild(listContainer);
        
        container.appendChild(header);
        container.appendChild(content);
        container.appendChild(buttons);
        
        modal.appendChild(container);
        document.body.appendChild(modal);
        
        // Добавляем обработчики событий
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        exportBtn.addEventListener('click', () => {
            // Добавляем индикатор загрузки
            const loadingIndicator = document.createElement('div');
            loadingIndicator.style.position = 'absolute';
            loadingIndicator.style.top = '50%';
            loadingIndicator.style.left = '50%';
            loadingIndicator.style.transform = 'translate(-50%, -50%)';
            loadingIndicator.style.padding = '20px';
            loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            loadingIndicator.style.color = 'white';
            loadingIndicator.style.borderRadius = '5px';
            loadingIndicator.style.zIndex = '2000';
            loadingIndicator.textContent = 'Создание скриншота...';
            document.body.appendChild(loadingIndicator);
            
            // Скрываем кнопки, чтобы они не попали на скриншот
            buttons.style.display = 'none';
            closeBtn.style.display = 'none';
            
            // Даем время для обновления DOM
            setTimeout(() => {
                // Создаем скриншот всего модального окна с высоким качеством
                html2canvas(container, {
                    scale: 2, // Увеличиваем масштаб для лучшего качества
                    useCORS: true, // Разрешаем загрузку внешних ресурсов
                    allowTaint: true, // Разрешаем использование внешних изображений
                    logging: false, // Отключаем логирование
                    backgroundColor: '#ffffff', // Белый фон
                    imageTimeout: 0, // Без таймаута для загрузки изображений
                    onclone: function(clonedDoc) {
                        // Можем дополнительно модифицировать клон перед созданием скриншота
                        const clonedContainer = clonedDoc.querySelector('.route-preview-modal > div');
                        if (clonedContainer) {
                            clonedContainer.style.overflow = 'visible';
                        }
                    }
                }).then(canvas => {
                    // Создаем ссылку для скачивания
                    const link = document.createElement('a');
                    link.download = `Маршрут_${districtName}_${microdistrictName}_${new Date().toISOString().slice(0, 10)}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    
                    // Удаляем индикатор загрузки и модальное окно
                    document.body.removeChild(loadingIndicator);
                    document.body.removeChild(modal);
                }).catch(error => {
                    console.error('Ошибка при создании скриншота:', error);
                    // Возвращаем кнопки назад
                    buttons.style.display = 'block';
                    closeBtn.style.display = 'block';
                    document.body.removeChild(loadingIndicator);
                    alert('Произошла ошибка при создании скриншота. Попробуйте еще раз.');
                });
            }, 500);
        });
        
        // Инициализируем карту
        setTimeout(() => {
            const map = L.map('preview-map', {
                center: [41.2995, 69.2401],
                zoom: 12
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Добавляем границы микрорайона
            const microdistrict = MapModule.microdistrictLayer.getLayers()
                .find(layer => layer.feature && layer.feature.properties && layer.feature.properties.name === microdistrictName);
            
            if (microdistrict) {
                const microdistrictLayer = L.geoJSON(microdistrict.feature, {
                    style: {
                        weight: 2,
                        opacity: 1,
                        color: '#e74c3c',
                        fillOpacity: 0.1,
                        dashArray: '3'
                    }
                }).addTo(map);
            }
            
            const markers = [];
            const latlngs = [];
            
            route.forEach((client, index) => {
                const latlng = [client.lat, client.lng];
                latlngs.push(latlng);
                
                const icon = L.divIcon({
                    className: 'route-marker',
                    html: `<div style="background-color: #3498db; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);">${index + 1}</div>`,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                });
                
                const marker = L.marker(latlng, { icon: icon }).addTo(map);
                marker.bindPopup(`<b>№${index + 1}: ${client.name}</b>`);
                markers.push(marker);
            });
            
            // Линии маршрута отключены по запросу пользователя
            /*
            if (latlngs.length > 1) {
                const routeLine = L.polyline(latlngs, { color: '#3498db', weight: 3 }).addTo(map);
                map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
            } else if (latlngs.length === 1) {
                map.setView(latlngs[0], 15);
            }
            */
            
            // Вместо линий просто приближаем карту к всем маркерам
            if (markers.length > 0) {
                // Создаем группу маркеров для приближения
                const group = L.featureGroup(markers);
                map.fitBounds(group.getBounds(), { padding: [50, 50] });
            } else if (latlngs.length === 1) {
                map.setView(latlngs[0], 15);
            }
        }, 100);
        
        return modal;
    },
    
    /**
     * Экспортирует маршрут в PDF-файл для печати
     * @param {Array} route - Маршрут (массив клиентов)
     * @param {string} districtName - Название района
     * @param {string} microdistrictName - Название микрорайона
     */
    exportRouteToPDF: function(route, districtName, microdistrictName) {
        // Вызываем предварительный просмотр маршрута
        this.showRoutePreview(route, districtName, microdistrictName);
    },
    
    /**
     * Сохраняет маршрут в PDF-файл
     * @private
     * @param {Array} route - Маршрут (массив клиентов)
     * @param {string} districtName - Название района
     * @param {string} microdistrictName - Название микрорайона
     */
    _saveRouteToPDF: function(route, districtName, microdistrictName) {
        try {
            // Создаем временный div для рендеринга содержимого
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            
            // Рассчитываем количество клиентов в каждом столбце
            const clientsPerColumn = Math.ceil(route.length / 2);
            
            // Создаем содержимое для печати - двухколоночный макет
            tempDiv.innerHTML = `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: white;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="margin: 0; font-size: 24px; color: #2c3e50;">Маршрут посещения клиентов</h1>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d;">Район: ${districtName}, Микрорайон: ${microdistrictName}</p>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d;">Всего точек: ${route.length}</p>
                    </div>
                    
                    <div style="display: flex; gap: 20px;">
                        <div id="map-container" style="flex: 7; margin-bottom: 20px;">
                            <h2 style="margin-top: 0; color: #3498db; font-size: 18px;">Карта маршрута:</h2>
                            <div id="map-screenshot" style="width: 100%; height: 700px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;"></div>
                        </div>
                        
                        <div id="route-table" style="flex: 3; margin-bottom: 20px; min-width: 300px; max-width: 400px;">
                            <h2 style="margin-top: 0; color: #3498db; font-size: 18px;">Порядок посещения клиентов:</h2>
                            <div style="display: flex; gap: 10px; overflow: auto;">
                                <div style="flex: 1; min-width: 0;">
                                    <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
                                        <thead>
                                            <tr style="background-color: #3498db; color: white;">
                                                <th style="padding: 4px; text-align: center; border: 1px solid #ddd; width: 50px;">№</th>
                                                <th style="padding: 4px; text-align: left; border: 1px solid #ddd;">Название клиента</th>
                                            </tr>
                                        </thead>
                                        <tbody>
            `;
            
            // Добавляем клиентов в первый столбец
            for (let i = 0; i < clientsPerColumn; i++) {
                if (i < route.length) {
                    const client = route[i];
                    const bgColor = i % 2 === 0 ? 'white' : '#f2f2f2';
                    tempDiv.innerHTML += `
                        <tr style="background-color: ${bgColor};">
                            <td style="padding: 4px; text-align: center; border: 1px solid #ddd;">${i + 1}</td>
                            <td style="padding: 4px; text-align: left; border: 1px solid #ddd; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${client.name}</td>
                        </tr>
                    `;
                }
            }
            
            // Закрываем первую таблицу и начинаем вторую
            tempDiv.innerHTML += `
                                        </tbody>
                                    </table>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
                                        <thead>
                                            <tr style="background-color: #3498db; color: white;">
                                                <th style="padding: 4px; text-align: center; border: 1px solid #ddd; width: 50px;">№</th>
                                                <th style="padding: 4px; text-align: left; border: 1px solid #ddd;">Название клиента</th>
                                            </tr>
                                        </thead>
                                        <tbody>
            `;
            
            // Добавляем клиентов во второй столбец
            for (let i = clientsPerColumn; i < route.length; i++) {
                const client = route[i];
                const bgColor = i % 2 === 0 ? 'white' : '#f2f2f2';
                tempDiv.innerHTML += `
                    <tr style="background-color: ${bgColor};">
                        <td style="padding: 4px; text-align: center; border: 1px solid #ddd;">${i + 1}</td>
                        <td style="padding: 4px; text-align: left; border: 1px solid #ddd; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${client.name}</td>
                    </tr>
                `;
            }
            
            // Закрываем вторую таблицу и завершаем HTML
            tempDiv.innerHTML += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px;">
                        Сгенерировано приложением "Карта Ташкента" ${new Date().toLocaleDateString()}
                    </div>
                </div>
            `;
            
            // Сначала сделаем скриншот карты
            const mapContainer = document.getElementById('map');
            
            html2canvas(mapContainer, {
                backgroundColor: 'white',
                scale: 2, // Увеличиваем масштаб для лучшего качества
                logging: false,
                allowTaint: true,
                useCORS: true,
                imageTimeout: 5000, // Увеличиваем таймаут для загрузки изображений
                ignoreElements: (element) => {
                    // Игнорируем ненужные элементы управления на карте
                    return element.classList && (
                        element.classList.contains('leaflet-control-container') ||
                        element.classList.contains('leaflet-control-zoom') ||
                        element.classList.contains('leaflet-control-attribution')
                    );
                }
            }).then(mapCanvas => {
                // Добавляем скриншот карты в наш див
                const mapScreenshot = tempDiv.querySelector('#map-screenshot');
                mapScreenshot.innerHTML = '';
                mapScreenshot.appendChild(mapCanvas);
                
                // Создаем PDF
                setTimeout(() => {
                    html2canvas(tempDiv, {
                        backgroundColor: 'white',
                        scale: 1,
                        logging: false,
                        allowTaint: true,
                        useCORS: true
                    }).then(canvas => {
                        // Создаем PDF в альбомной ориентации
                        const { jsPDF } = window.jspdf;
                        const pdf = new jsPDF({
                            orientation: 'landscape',
                            unit: 'mm',
                            format: 'a4'
                        });
                        
                        // Добавляем изображение на страницу PDF
                        const imgData = canvas.toDataURL('image/png');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = pdf.internal.pageSize.getHeight();
                        const imgWidth = canvas.width;
                        const imgHeight = canvas.height;
                        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                        const imgX = (pdfWidth - imgWidth * ratio) / 2;
                        const imgY = (pdfHeight - imgHeight * ratio) / 2;
                        
                        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
                        
                        // Сохраняем PDF
                        pdf.save(`Маршрут_${districtName}_${microdistrictName}_${new Date().toISOString().split('T')[0]}.pdf`);
                        
                        // Удаляем временный div
                        document.body.removeChild(tempDiv);
                        
                        // Показываем уведомление об успешном экспорте
                        alert('Маршрут успешно экспортирован в PDF');
                    }).catch(error => {
                        console.error('Ошибка при создании изображения:', error);
                        alert('Произошла ошибка при экспорте маршрута. Попробуйте еще раз.');
                        document.body.removeChild(tempDiv);
                    });
                }, 500);
            }).catch(error => {
                console.error('Ошибка при создании скриншота карты:', error);
                alert('Произошла ошибка при экспорте маршрута. Попробуйте еще раз.');
                document.body.removeChild(tempDiv);
            });
        } catch (error) {
            console.error('Ошибка при экспорте маршрута:', error);
            alert('Произошла ошибка при экспорте маршрута. Подробности в консоли.');
        }
    },
    
    /**
     * Создает пустой GeoJSON FeatureCollection
     * @returns {Object} Пустой GeoJSON FeatureCollection
     */
    createEmptyGeoJSON: function() {
        return {
            "type": "FeatureCollection",
            "features": []
        };
    },
    
    /**
     * Создает GeoJSON Feature из координат полигона
     * @param {Array} coordinates - Координаты полигона
     * @param {Object} properties - Свойства объекта
     * @returns {Object} GeoJSON Feature
     */
    createGeoJSONFeature: function(coordinates, properties) {
        return {
            "type": "Feature",
            "properties": properties || {},
            "geometry": {
                "type": "Polygon",
                "coordinates": coordinates
            }
        };
    },
    
    /**
     * Экспортирует маршрут в HTML-таблицу с возможностью предварительного просмотра и сохранения
     * @param {Array} route - Маршрут (массив клиентов)
     * @param {string} districtName - Название района
     * @param {string} microdistrictName - Название микрорайона
     * @returns {boolean} Успешность операции
     */
    exportRouteToHTML: function(route, districtName, microdistrictName) {
        try {
            // Проверяем входные данные
            if (!Array.isArray(route) || route.length === 0) {
                throw new Error('Маршрут пуст или имеет неверный формат');
            }
            
            // Разбиваем клиентов на блоки по 30 клиентов
            const clientsPerBlock = 30;
            const blocks = [];
            
            for (let i = 0; i < route.length; i += clientsPerBlock) {
                blocks.push(route.slice(i, i + clientsPerBlock));
            }
            
            // Создаем HTML-контейнер
            const container = document.createElement('div');
            container.className = 'route-preview-container';
            
            // Создаем заголовок
            const header = document.createElement('div');
            header.className = 'route-header';
            header.innerHTML = `
                <h2>Маршрут по клиентам</h2>
                <p><strong>Район:</strong> ${districtName || 'Все районы'}</p>
                <p><strong>Микрорайон:</strong> ${microdistrictName || 'Все микрорайоны'}</p>
                <p><strong>Дата:</strong> ${new Date().toLocaleDateString()}</p>
            `;
            container.appendChild(header);
            
            // Создаем таблицу
            const table = document.createElement('table');
            table.className = 'route-table';
            table.border = '1';
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.fontSize = '16px';
            table.style.fontFamily = 'Arial, sans-serif';
            
            // Создаем заголовки столбцов
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            // Добавляем заголовки для каждого блока
            blocks.forEach((block, blockIndex) => {
                // Добавляем заголовки столбцов
                const numHeader = document.createElement('th');
                numHeader.textContent = '№';
                numHeader.style.backgroundColor = '#5B9BD5';
                numHeader.style.color = 'white';
                numHeader.style.padding = '10px';
                numHeader.style.fontWeight = 'bold';
                numHeader.style.width = '30px';
                headerRow.appendChild(numHeader);
                
                const clientHeader = document.createElement('th');
                clientHeader.textContent = 'Клиент';
                clientHeader.style.backgroundColor = '#5B9BD5';
                clientHeader.style.color = 'white';
                clientHeader.style.padding = '10px';
                clientHeader.style.fontWeight = 'bold';
                clientHeader.style.width = '250px';
                headerRow.appendChild(clientHeader);
                
                const typeHeader = document.createElement('th');
                typeHeader.textContent = 'Тип ТТ';
                typeHeader.style.backgroundColor = '#5B9BD5';
                typeHeader.style.color = 'white';
                typeHeader.style.padding = '10px';
                typeHeader.style.fontWeight = 'bold';
                typeHeader.style.width = '80px';
                headerRow.appendChild(typeHeader);
                
                // Добавляем разделитель между блоками (кроме последнего блока)
                if (blockIndex < blocks.length - 1) {
                    const separator = document.createElement('th');
                    separator.style.width = '20px';
                    separator.innerHTML = '&nbsp;';
                    headerRow.appendChild(separator);
                }
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Создаем тело таблицы
            const tbody = document.createElement('tbody');
            
            // Определяем максимальное количество строк
            let maxRows = 0;
            blocks.forEach(block => {
                maxRows = Math.max(maxRows, block.length);
            });
            
            // Добавляем данные клиентов
            for (let row = 0; row < maxRows; row++) {
                const tr = document.createElement('tr');
                
                // Чередующийся цвет строк
                if (row % 2 === 1) {
                    tr.style.backgroundColor = '#F5F5F5';
                }
                
                // Добавляем данные для каждого блока
                blocks.forEach((block, blockIndex) => {
                    // Если в текущем блоке есть клиент для этой строки
                    if (row < block.length) {
                        const client = block[row];
                        const clientIndex = blockIndex * clientsPerBlock + row + 1; // Номер клиента начиная с 1
                        
                        // Добавляем ячейки с данными клиента
                        const numCell = document.createElement('td');
                        numCell.textContent = clientIndex.toString();
                        numCell.style.padding = '10px';
                        numCell.style.textAlign = 'center';
                        numCell.style.fontWeight = 'bold';
                        tr.appendChild(numCell);
                        
                        const nameCell = document.createElement('td');
                        nameCell.textContent = client.name;
                        nameCell.style.padding = '10px';
                        tr.appendChild(nameCell);
                        
                        const typeCell = document.createElement('td');
                        typeCell.textContent = client.type || '';
                        typeCell.style.padding = '10px';
                        typeCell.style.textAlign = 'center';
                        typeCell.style.fontWeight = 'bold';
                        tr.appendChild(typeCell);
                    } else {
                        // Добавляем пустые ячейки
                        for (let i = 0; i < 3; i++) {
                            const emptyCell = document.createElement('td');
                            emptyCell.innerHTML = '&nbsp;';
                            emptyCell.style.padding = '5px';
                            tr.appendChild(emptyCell);
                        }
                    }
                    
                    // Добавляем разделитель между блоками (кроме последнего блока)
                    if (blockIndex < blocks.length - 1) {
                        const separator = document.createElement('td');
                        separator.innerHTML = '&nbsp;';
                        tr.appendChild(separator);
                    }
                });
                
                tbody.appendChild(tr);
            }
            
            table.appendChild(tbody);
            
            // Добавляем справочник типов магазинов
            const referenceContainer = document.createElement('div');
            referenceContainer.className = 'reference-container';
            referenceContainer.style.marginTop = '20px';
            
            const referenceTitle = document.createElement('h3');
            referenceTitle.textContent = 'Справочник:';
            referenceTitle.style.marginTop = '30px';
            referenceTitle.style.marginBottom = '15px';
            referenceTitle.style.fontSize = '20px';
            referenceTitle.style.fontWeight = 'bold';
            container.appendChild(referenceTitle);
            
            const referenceTable = document.createElement('table');
            referenceTable.border = '1';
            referenceTable.style.borderCollapse = 'collapse';
            referenceTable.style.width = '60%';
            referenceTable.style.fontSize = '16px';
            referenceTable.style.fontFamily = 'Arial, sans-serif';
            
            // Добавляем строки справочника
            const referenceTypes = [
                { code: 'A', name: 'Аптека', color: '#D8E4BC' },
                { code: 'CM', name: 'Смешенный магазин (продукты, косметика)', color: '#D8E4BC' },
                { code: 'XM', name: 'Хозяйственный магазин', color: '#D8E4BC' },
                { code: 'KM', name: 'Косметический магазин', color: '#D8E4BC' },
                { code: 'ПР', name: 'Продуктовый магазин', color: '#D8E4BC' }
            ];
            
            referenceTypes.forEach(type => {
                const tr = document.createElement('tr');
                
                const codeCell = document.createElement('td');
                codeCell.textContent = type.code;
                codeCell.style.padding = '10px';
                codeCell.style.textAlign = 'center';
                codeCell.style.backgroundColor = type.color;
                codeCell.style.fontWeight = 'bold';
                codeCell.style.width = '80px';
                tr.appendChild(codeCell);
                
                const nameCell = document.createElement('td');
                nameCell.textContent = type.name;
                nameCell.style.padding = '10px';
                nameCell.style.backgroundColor = type.color;
                tr.appendChild(nameCell);
                
                referenceTable.appendChild(tr);
            });
            
            container.appendChild(table);
            container.appendChild(referenceContainer);
            
            // Добавляем кнопку для сохранения
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Сохранить в HTML';
            saveButton.className = 'btn btn-success';
            saveButton.style.marginTop = '30px';
            saveButton.style.padding = '15px';
            saveButton.style.backgroundColor = '#5B9BD5';
            saveButton.style.color = 'white';
            saveButton.style.border = 'none';
            saveButton.style.borderRadius = '5px';
            saveButton.style.cursor = 'pointer';
            saveButton.style.fontSize = '18px';
            saveButton.style.fontWeight = 'bold';
            saveButton.style.width = '100%';
            saveButton.onclick = () => {
                // Создаем полный HTML-документ для сохранения
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Маршрут ${districtName || 'Все'} ${microdistrictName || 'Все'}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; font-size: 16px; }
                            h1 { font-size: 24px; margin-bottom: 20px; color: #333; }
                            h3 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #333; }
                            .route-header { margin-bottom: 30px; }
                            .route-table, .reference-table { border-collapse: collapse; width: 100%; margin-bottom: 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                            .route-table th { background-color: #5B9BD5; color: white; padding: 12px; font-weight: bold; text-align: center; }
                            .route-table tr:nth-child(even) { background-color: #F5F5F5; }
                            .route-table tr:hover { background-color: #e9f3ff; }
                            .route-table td { padding: 10px; border: 1px solid #ddd; }
                            .route-table td:first-child { text-align: center; font-weight: bold; }
                            .route-table td:nth-child(3) { text-align: center; font-weight: bold; }
                            .reference-table { width: 60%; }
                            .reference-table td { padding: 10px; border: 1px solid #ddd; }
                            .reference-table td:first-child { text-align: center; font-weight: bold; width: 80px; }
                            @media print {
                                body { font-size: 14px; }
                                .route-table th { background-color: #5B9BD5 !important; color: white !important; -webkit-print-color-adjust: exact; }
                                .route-table tr:nth-child(even) { background-color: #F5F5F5 !important; -webkit-print-color-adjust: exact; }
                                .reference-table td { background-color: #E2EFDA !important; -webkit-print-color-adjust: exact; }
                            }
                        </style>
                    </head>
                    <body>
                        ${container.outerHTML}
                    </body>
                    </html>
                `;
                
                // Создаем Blob и ссылку для скачивания
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Маршрут_${districtName || 'Все'}_${microdistrictName || 'Все'}_${new Date().toISOString().slice(0, 10)}.html`;
                document.body.appendChild(a);
                a.click();
                
                // Очищаем ресурсы
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 0);
            };
            
            container.appendChild(saveButton);
            
            // Создаем модальное окно для предварительного просмотра
            // Сначала удалим существующее модальное окно, если оно есть
            const existingModal = document.getElementById('routeHTMLPreviewModal');
            if (existingModal) {
                document.body.removeChild(existingModal);
            }
            
            // Создаем новое модальное окно
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'routeHTMLPreviewModal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.zIndex = '9999';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            
            // Создаем содержимое модального окна
            const modalContent = document.createElement('div');
            modalContent.style.backgroundColor = 'white';
            modalContent.style.width = '95%';
            modalContent.style.height = '90%';
            modalContent.style.display = 'flex';
            modalContent.style.flexDirection = 'column';
            modalContent.style.borderRadius = '5px';
            modalContent.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
            
            // Создаем заголовок модального окна
            const modalHeader = document.createElement('div');
            modalHeader.style.padding = '15px';
            modalHeader.style.borderBottom = '1px solid #e5e5e5';
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            
            const modalTitle = document.createElement('h5');
            modalTitle.textContent = 'Предварительный просмотр маршрута';
            modalTitle.style.margin = '0';
            modalTitle.style.fontSize = '24px';
            modalTitle.style.fontWeight = 'bold';
            
            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'close';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '32px';
            closeButton.style.cursor = 'pointer';
            closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            // Создаем тело модального окна
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.style.flex = '1';
            modalBody.style.overflowY = 'auto';
            modalBody.style.padding = '20px';
            modalBody.style.overflowX = 'auto';
            
            // Добавляем контейнер с таблицей в тело модального окна
            modalBody.appendChild(container);
            
            // Создаем подвал модального окна
            const modalFooter = document.createElement('div');
            modalFooter.style.padding = '15px';
            modalFooter.style.borderTop = '1px solid #e5e5e5';
            modalFooter.style.display = 'flex';
            modalFooter.style.justifyContent = 'center';
            
            const btnClose = document.createElement('button');
            btnClose.type = 'button';
            btnClose.className = 'btn-close';
            btnClose.textContent = 'Закрыть';
            btnClose.style.padding = '12px 30px';
            btnClose.style.backgroundColor = '#5B9BD5';
            btnClose.style.color = 'white';
            btnClose.style.border = 'none';
            btnClose.style.borderRadius = '5px';
            btnClose.style.fontSize = '18px';
            btnClose.style.fontWeight = 'bold';
            btnClose.style.cursor = 'pointer';
            
            modalFooter.appendChild(btnClose);
            
            // Собираем модальное окно
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modal.appendChild(modalContent);
            
            // Добавляем модальное окно в DOM
            document.body.appendChild(modal);
            
            // Функция закрытия модального окна
            const closeModal = function() {
                document.body.removeChild(modal);
            };
            
            // Добавляем обработчики закрытия
            closeButton.onclick = closeModal;
            btnClose.onclick = closeModal;
            
            return true;
        } catch (error) {
            console.error('Ошибка при экспорте маршрута в HTML:', error);
            alert('Ошибка при экспорте маршрута в HTML. Подробности в консоли.');
            return false;
        }
    },
    
    /**
     * Экспортирует маршрут в Excel-файл для печати
     * @param {Array} route - Маршрут (массив клиентов)
     * @param {string} districtName - Название района
     * @param {string} microdistrictName - Название микрорайона
     */
    exportRouteToExcel: function(route, districtName, microdistrictName) {
        if (!route || route.length === 0) {
            alert('Нет данных для экспорта. Сначала постройте маршрут.');
            return;
        }
        
        try {
            // Функция логирования для отладки
            const logDebug = (message, obj) => {
                console.log(`[Excel Export] ${message}:`, obj);
            };
            
            logDebug('Starting Excel export', { routeLength: route.length });
            
            // Создаем новую книгу Excel
            const wb = XLSX.utils.book_new();
            logDebug('Workbook created', wb);
            
            // Подготавливаем данные для экспорта
            // Разбиваем клиентов на блоки по 30 клиентов
            const clientsPerBlock = 30;
            const blocks = [];
            
            for (let i = 0; i < route.length; i += clientsPerBlock) {
                blocks.push(route.slice(i, i + clientsPerBlock));
            }
            
            // Создаем заголовок с информацией о районе и микрорайоне
            // Для каждого блока создаем полный набор столбцов (3 столбца на блок + разделители)
            const totalColumns = blocks.length * 4 - (blocks.length > 1 ? 1 : 0);
            const headerData = [];
            
            // Создаем заголовки с полным объединением ячеек
            const title = ['Маршрут по клиентам'];
            const district = [`Район: ${districtName || 'Все районы'}`];
            const microdistrict = [`Микрорайон: ${microdistrictName || 'Все микрорайоны'}`];
            const date = ['Дата: ' + new Date().toLocaleDateString()];
            
            // Дополняем заголовки пустыми ячейками до полной ширины
            while (title.length < totalColumns) title.push('');
            while (district.length < totalColumns) district.push('');
            while (microdistrict.length < totalColumns) microdistrict.push('');
            while (date.length < totalColumns) date.push('');
            
            headerData.push(title, district, microdistrict, date, []);
            
            // Создаем заголовки столбцов для каждого блока
            const columnHeadersRow = [];
            for (let i = 0; i < blocks.length; i++) {
                // Добавляем заголовки без телефона
                columnHeadersRow.push('№', 'Клиент', 'Тип ТТ');
                
                // Добавляем разделитель между блоками
                if (i < blocks.length - 1) {
                    columnHeadersRow.push('');
                }
            }
            headerData.push(columnHeadersRow);
            
            // Создаем массив данных для всех блоков
            const allData = [];
            
            // Добавляем заголовок
            allData.push(...headerData);
            
            // Определяем максимальное количество строк в блоке
            let maxRows = 0;
            blocks.forEach(block => {
                maxRows = Math.max(maxRows, block.length);
            });
            
            // Добавляем данные клиентов по блокам
            for (let row = 0; row < maxRows; row++) {
                const rowData = [];
                
                for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
                    const block = blocks[blockIndex];
                    
                    // Если в текущем блоке есть клиент для этой строки
                    if (row < block.length) {
                        const client = block[row];
                        const clientIndex = blockIndex * clientsPerBlock + row + 1; // Номер клиента начиная с 1
                        
                        // Добавляем данные клиента (без телефона)
                        rowData.push(
                            clientIndex.toString(),
                            client.name,
                            client.type || ''
                        );
                    } else {
                        // Добавляем пустые ячейки, если в блоке нет клиента для этой строки (без телефона)
                        rowData.push('', '', '');
                    }
                    
                    // Добавляем пустой столбец-разделитель между блоками (кроме последнего блока)
                    if (blockIndex < blocks.length - 1) {
                        rowData.push('');
                    }
                }
                
                allData.push(rowData);
            }
            
            // Добавляем пустые строки после списка клиентов
            allData.push([]);
            allData.push([]);
            
            // Добавляем пустую строку перед справочником
            allData.push([]);
            allData.push([]);
            
            // Добавляем элементы справочника
            allData.push(['А', 'Аптека']);
            allData.push(['СМ', 'Смешенный магазин (продукты, косметика)']);
            allData.push(['ХМ', 'Хозяйственный магазин']);
            allData.push(['КМ', 'Косметический магазин']);
            allData.push(['ПР', 'Продуктовый магазин']);
            
            // Создаем лист Excel
            const ws = XLSX.utils.aoa_to_sheet(allData);
            
            // Устанавливаем ширину столбцов и автоподгонку
            const colWidths = [];
            
            // Функция для автоподгонки ширины столбца по содержимому
            const getMaxLength = (data, col) => {
                let maxLen = 0;
                for (let i = 0; i < data.length; i++) {
                    if (data[i] && data[i][col] && String(data[i][col]).length > maxLen) {
                        maxLen = String(data[i][col]).length;
                    }
                }
                return maxLen;
            };
            
            for (let i = 0; i < blocks.length; i++) {
                const startCol = i * (blocks.length > 1 ? 4 : 3);
                
                // Номер - фиксированная узкая ширина
                colWidths.push({ wch: 3 });
                
                // Клиент - автоподгонка, минимум 30 символов
                colWidths.push({ wch: Math.max(30, getMaxLength(allData, startCol + 1) + 2) });
                
                // Тип ТТ - автоподгонка, минимум 15 символов
                colWidths.push({ wch: Math.max(15, getMaxLength(allData, startCol + 2) + 2) });
                
                // Разделитель между блоками
                if (i < blocks.length - 1) {
                    colWidths.push({ wch: 5 });
                }
            }
            
            // Устанавливаем ширину столбцов
            ws['!cols'] = colWidths;
            
            // Добавляем стили для ячеек
            if (!ws['!rows']) ws['!rows'] = [];
            
            // Создаем стили для ячеек в формате, полностью совместимом с Excel
            logDebug('Creating styles', {});
            
            // Максимально упрощенные стили для лучшей совместимости с XLS
            const styles = {
                header: { // Стиль для заголовка
                    font: { bold: true },
                    fill: { fgColor: { rgb: "4472C4" } },
                    alignment: { horizontal: "center" }
                },
                columnHeader: { // Стиль для заголовков столбцов
                    font: { bold: true },
                    fill: { fgColor: { rgb: "5B9BD5" } },
                    alignment: { horizontal: "center" }
                },
                cell: { // Стиль для обычных ячеек
                    border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
                },
                cellEven: { // Стиль для четных строк
                    border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
                    fill: { fgColor: { rgb: "F5F5F5" } }
                },
                reference: { // Стиль для справочника
                    font: { bold: true },
                    fill: { fgColor: { rgb: "70AD47" } },
                    alignment: { horizontal: "center" }
                },
                referenceItem: { // Стиль для элементов справочника
                    border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
                    fill: { fgColor: { rgb: "E2EFDA" } }
                }
            };
            
            // Применяем стили к ячейкам
            // Функция для получения адреса ячейки
            const getCellAddress = (r, c) => XLSX.utils.encode_cell({r: r, c: c});
            
            logDebug('Applying styles to cells', { totalColumns });
            
            // Добавляем объединение ячеек для заголовков
            if (!ws['!merges']) ws['!merges'] = [];
            
            // Объединяем ячейки заголовка
            for (let r = 0; r < 4; r++) {
                // Объединяем всю строку заголовка
                ws['!merges'].push({ s: { r: r, c: 0 }, e: { r: r, c: totalColumns - 1 } });
            }
            
            // Применяем стили к заголовку
            logDebug('Applying header styles', { headerStyle: styles.header });
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < totalColumns; c++) {
                    const cellAddress = getCellAddress(r, c);
                    if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
                    ws[cellAddress].s = styles.header;
                    if (r === 0 && c === 0) {
                        logDebug(`Style applied to cell ${cellAddress}`, ws[cellAddress]);
                    }
                }
            }
            
            // Применяем стили к заголовкам столбцов
            const headerRow = 5; // Строка с заголовками столбцов
            logDebug('Applying column header styles', { columnHeaderStyle: styles.columnHeader });
            for (let i = 0; i < blocks.length; i++) {
                const startCol = i * 5; // Начальный столбец для блока
                for (let c = 0; c < 4; c++) {
                    const cellAddress = getCellAddress(headerRow, startCol + c);
                    if (ws[cellAddress]) {
                        ws[cellAddress].s = styles.columnHeader;
                        if (i === 0 && c === 0) {
                            logDebug(`Column header style applied to ${cellAddress}`, ws[cellAddress]);
                        }
                    }
                }
            }
            
            // Применяем стили к ячейкам с данными клиентов
            logDebug('Applying data cell styles', { cellStyle: styles.cell, cellEvenStyle: styles.cellEven });
            for (let r = headerRow + 1; r < headerRow + 1 + maxRows; r++) {
                // Определяем стиль для строки (чередующиеся цвета)
                const rowStyle = (r - headerRow - 1) % 2 === 0 ? styles.cell : styles.cellEven;
                
                for (let i = 0; i < blocks.length; i++) {
                    const startCol = i * 5; // Начальный столбец для блока
                    for (let c = 0; c < 4; c++) {
                        const cellAddress = getCellAddress(r, startCol + c);
                        if (ws[cellAddress]) {
                            ws[cellAddress].s = rowStyle;
                            if (r === headerRow + 1 && i === 0 && c === 0) {
                                logDebug(`Data cell style applied to ${cellAddress}`, ws[cellAddress]);
                            }
                        }
                    }
                }
            }
            
            // Применяем стили к справочнику
            const referenceStartRow = headerRow + 1 + maxRows + 3; // Строка начала справочника
            
            // Объединяем ячейки заголовка справочника
            ws['!merges'].push({ s: { r: referenceStartRow, c: 0 }, e: { r: referenceStartRow, c: totalColumns - 1 } });
            
            logDebug('Applying reference styles', { referenceStyle: styles.reference });
            for (let c = 0; c < totalColumns; c++) {
                const cellAddress = getCellAddress(referenceStartRow, c);
                if (ws[cellAddress]) {
                    ws[cellAddress].s = styles.reference;
                    if (c === 0) {
                        logDebug(`Reference header style applied to ${cellAddress}`, ws[cellAddress]);
                    }
                }
            }
            
            // Применяем стили к элементам справочника
            logDebug('Applying reference item styles', { referenceItemStyle: styles.referenceItem });
            for (let r = referenceStartRow + 2; r < referenceStartRow + 7; r++) {
                for (let c = 0; c < 2; c++) {
                    const cellAddress = getCellAddress(r, c);
                    if (ws[cellAddress]) {
                        ws[cellAddress].s = styles.referenceItem;
                        if (r === referenceStartRow + 2 && c === 0) {
                            logDebug(`Reference item style applied to ${cellAddress}`, ws[cellAddress]);
                        }
                    }
                }
            }
            
            // Добавляем лист в книгу
            XLSX.utils.book_append_sheet(wb, ws, 'Маршрут');
            
            // Проверяем поддержку стилей
            logDebug('XLSX version', XLSX.version);
            logDebug('Workbook structure before save', { sheets: wb.SheetNames, merges: ws['!merges'], cols: ws['!cols'] });
            
            // Проверяем наличие стилей в первой ячейке
            const firstCell = ws['A1'];
            logDebug('First cell content', firstCell);
            
            // Проверяем опции записи
            // Используем формат BIFF8 (XLS) для максимальной совместимости
            const writeOpts = { 
                bookType: 'biff8', // Используем BIFF8 формат для лучшей поддержки стилей
                bookSST: true, 
                type: 'binary',
                cellStyles: true,
                compression: false
            };
            logDebug('Write options', writeOpts);
            
            // Генерируем имя файла с расширением .xls
            const fileName = `Маршрут_${districtName || 'Все'}_${microdistrictName || 'Все'}_${new Date().toISOString().slice(0, 10)}.xls`;
            logDebug('Saving file', fileName);
            
            // Используем альтернативный способ сохранения с поддержкой стилей
            try {
                // Создаем двоичные данные с явным указанием поддержки стилей
                const wbout = XLSX.write(wb, writeOpts);
                logDebug('Binary data created', { length: wbout.length });
                
                // Создаем Blob и сохраняем файл через ссылку
                const s2ab = (s) => {
                    const buf = new ArrayBuffer(s.length);
                    const view = new Uint8Array(buf);
                    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
                    return buf;
                };
                
                const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                
                // Создаем ссылку для скачивания
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                
                // Очищаем ресурсы
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 0);
                
                logDebug('File saved successfully using Blob', fileName);
            } catch (e) {
                logDebug('Error during file save with Blob', e);
                // В случае ошибки пробуем стандартный метод
                XLSX.writeFile(wb, fileName, writeOpts);
            }
            
            alert(`Маршрут успешно экспортирован в Excel-файл: ${fileName}`);
        } catch (error) {
            console.error('Ошибка при экспорте маршрута в Excel:', error);
            alert('Ошибка при экспорте маршрута в Excel. Подробности в консоли.');
        }
    }
};
