/**
 * Модуль для работы с районами и микрорайонами
 */

const DistrictsModule = {
    /**
     * Инициализирует модуль
     */
    init: function() {
        // Привязываем обработчики событий к кнопкам
        document.getElementById('load-districts').addEventListener('click', this.loadDistricts.bind(this));
        document.getElementById('load-microdistricts').addEventListener('click', this.loadMicrodistricts.bind(this));
        document.getElementById('clear-map').addEventListener('click', () => {
            MapModule.districtLayer.clearLayers();
            MapModule.microdistrictLayer.clearLayers();
            this.initSelects();
        });
        
        // Инициализируем селекты районов и микрорайонов
        this.initSelects();
    },
    
    /**
     * Инициализирует селекты районов и микрорайонов
     */
    initSelects: function() {
        const districtSelect = document.getElementById('district-select');
        const microdistrictSelect = document.getElementById('microdistrict-select');
        
        // Очищаем селекты
        districtSelect.innerHTML = '<option value="">Выберите район</option>';
        microdistrictSelect.innerHTML = '<option value="">Выберите микрорайон</option>';
        
        // Получаем данные из слоев карты
        const districtLayers = MapModule.districtLayer.getLayers();
        const microdistrictLayers = MapModule.microdistrictLayer.getLayers();
        
        // Заполняем селект районов
        if (districtLayers && districtLayers.length > 0) {
            // Создаем массив для хранения уникальных названий районов
            const districtNames = [];
            
            districtLayers.forEach(layer => {
                if (layer.feature && layer.feature.properties && layer.feature.properties.name) {
                    const name = layer.feature.properties.name;
                    
                    // Проверяем, что такого района еще нет в списке
                    if (!districtNames.includes(name)) {
                        districtNames.push(name);
                        
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        districtSelect.appendChild(option);
                    }
                }
            });
        } else {
            // Пробуем загрузить из localStorage в качестве резервного варианта
            const districtsInfo = Utils.loadFromLocalStorage(CONFIG.storage.districtsKey + '_info');
            
            if (districtsInfo && Array.isArray(districtsInfo)) {
                districtsInfo.forEach(district => {
                    if (district && district.name) {
                        const option = document.createElement('option');
                        option.value = district.name;
                        option.textContent = district.name;
                        districtSelect.appendChild(option);
                    }
                });
            }
        }
        
        // Обработчик изменения района
        districtSelect.addEventListener('change', () => {
            const selectedDistrict = districtSelect.value;
            
            // Очищаем селект микрорайонов
            microdistrictSelect.innerHTML = '<option value="">Выберите микрорайон</option>';
            
            // Если выбран район, заполняем селект микрорайонов
            if (selectedDistrict) {
                // Получаем микрорайоны из слоя карты
                const microdistrictLayers = MapModule.microdistrictLayer.getLayers();
                
                // Создаем массив для хранения уникальных названий микрорайонов
                const microdistrictNames = [];
                
                if (microdistrictLayers && microdistrictLayers.length > 0) {
                    microdistrictLayers.forEach(layer => {
                        if (layer.feature && layer.feature.properties && 
                            layer.feature.properties.name && 
                            layer.feature.properties.district === selectedDistrict) {
                            
                            const name = layer.feature.properties.name;
                            
                            // Проверяем, что такого микрорайона еще нет в списке
                            if (!microdistrictNames.includes(name)) {
                                microdistrictNames.push(name);
                                
                                const option = document.createElement('option');
                                option.value = name;
                                option.textContent = name;
                                microdistrictSelect.appendChild(option);
                            }
                        }
                    });
                }
                
                // Если нет микрорайонов для выбранного района, добавляем опцию "Весь район"
                if (microdistrictNames.length === 0) {
                    const option = document.createElement('option');
                    option.value = "whole_district";
                    option.textContent = `Весь район: ${selectedDistrict}`;
                    microdistrictSelect.appendChild(option);
                }
                
                // Приближаем карту к выбранному району
                this.zoomToDistrict(selectedDistrict);
                
                // Фильтруем карту, показываем только выбранный район
                if (MapModule && MapModule.filterMapBySelection) {
                    MapModule.filterMapBySelection('district', selectedDistrict);
                }
            } else {
                // Если район не выбран, показываем все
                if (MapModule && MapModule.filterMapBySelection) {
                    MapModule.filterMapBySelection('city', null);
                }
            }
        });
        
        // Обработчик изменения микрорайона
        microdistrictSelect.addEventListener('change', () => {
            const selectedMicrodistrict = microdistrictSelect.value;
            const selectedDistrict = districtSelect.value;
            
            // Если выбран микрорайон, приближаем карту к нему
            if (selectedMicrodistrict && selectedMicrodistrict !== 'whole_district') {
                this.zoomToMicrodistrict(selectedMicrodistrict);
                
                // Фильтруем карту, показываем только выбранный микрорайон
                if (MapModule && MapModule.filterMapBySelection) {
                    MapModule.filterMapBySelection('microdistrict', selectedMicrodistrict);
                }
            } else if (selectedMicrodistrict === 'whole_district' && selectedDistrict) {
                // Если выбран "Весь район", показываем весь район
                if (MapModule && MapModule.filterMapBySelection) {
                    MapModule.filterMapBySelection('district', selectedDistrict);
                }
            } else if (selectedDistrict) {
                // Если микрорайон не выбран, но выбран район, показываем район
                if (MapModule && MapModule.filterMapBySelection) {
                    MapModule.filterMapBySelection('district', selectedDistrict);
                }
            } else {
                // Если ничего не выбрано, показываем все
                if (MapModule && MapModule.filterMapBySelection) {
                    MapModule.filterMapBySelection('city', null);
                }
            }
        });
    },
    
    /**
     * Загружает районы
     */
    loadDistricts: async function() {
        try {
            // Загружаем районы через API
            const response = await ApiModule.getDistricts();
            
            if (response.success && response.data) {
                // Очищаем текущий слой
                MapModule.districtLayer.clearLayers();
                
                // Преобразуем данные в GeoJSON FeatureCollection
                const features = response.data.map(district => ({
                    type: 'Feature',
                    properties: {
                        id: district.id,
                        name: district.name,
                        color: district.color,
                        city_id: district.city_id,
                        type: 'district'
                    },
                    geometry: district.geometry
                }));
                
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: features
                };
                
                // Отображаем на карте
                MapModule.renderFromFeatureCollections(featureCollection, null);
                this.initSelects();
                
                console.log(`Загружено районов: ${features.length}`);
            } else {
                alert('Не удалось загрузить районы');
            }
        } catch (e) {
            console.error('Ошибка загрузки районов:', e);
            alert('Ошибка при загрузке районов. Проверьте подключение к серверу.');
        }
    },
    
    /**
     * Загружает все районы из папки map
     */
    loadAllDistricts: function() {
        // Очищаем текущий слой
        MapModule.districtLayer.clearLayers();
        
        // Создаем объединенный GeoJSON для всех районов
        const combinedGeoJSON = {
            type: 'FeatureCollection',
            features: []
        };
        
        // Счетчик загруженных районов
        let loadedCount = 0;
        const totalDistricts = 12; // Всего 9 районов
        
        // Функция для загрузки одного района
        const loadDistrict = (districtNumber) => {
            const url = `map/district${districtNumber}.geojson`;
            console.log(`Загрузка района ${districtNumber} из ${url}`);
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Ошибка HTTP: ${response.status}`);
                    }
                    console.log(`Район ${districtNumber}: ответ получен, парсим JSON`);
                    return response.json();
                })
                .then(data => {
                    console.log(`Район ${districtNumber}: данные получены`, data);
                    // Проверяем структуру данных
                    if (data.type === 'Feature') {
                        // Если это одиночный Feature
                        if (!data.properties) {
                            data.properties = {};
                        }
                        data.properties.type = 'district';
                        
                        // Если нет цвета, генерируем случайный
                        if (!data.properties.color) {
                            data.properties.color = Utils.getRandomColor();
                        }
                        
                        // Добавляем в объединенный GeoJSON
                        combinedGeoJSON.features.push(data);
                    } else if (data.type === 'FeatureCollection' && data.features) {
                        // Если это FeatureCollection
                        data.features.forEach(feature => {
                            if (!feature.properties) {
                                feature.properties = {};
                            }
                            feature.properties.type = 'district';
                            
                            // Если нет цвета, генерируем случайный
                            if (!feature.properties.color) {
                                feature.properties.color = Utils.getRandomColor();
                            }
                            
                            // Добавляем в объединенный GeoJSON
                            combinedGeoJSON.features.push(feature);
                        });
                    } else {
                        console.error(`Неподдерживаемый формат GeoJSON в файле district${districtNumber}.geojson`);
                    }
                    
                    // Увеличиваем счетчик
                    loadedCount++;
                    
                    // Если все районы загружены
                    if (loadedCount === totalDistricts) {
                        // Добавляем данные на карту
                        MapModule.districtLayer.addData(combinedGeoJSON);
                        
                        // Приближаем карту к границам районов
                        MapModule.map.fitBounds(MapModule.districtLayer.getBounds());
                        
                        // Сохраняем данные
                        // Используем трай-катч блок, чтобы не прерывать работу при ошибке сохранения
                        try {
                            // Сохраняем только информацию о районах без полных геометрических данных
                            const districtsInfo = combinedGeoJSON.features.map(feature => ({
                                name: feature.properties.name,
                                color: feature.properties.color,
                                type: feature.properties.type
                            }));
                            Utils.saveToLocalStorage(CONFIG.storage.districtsKey + '_info', districtsInfo);
                            console.log('Информация о районах успешно сохранена');
                        } catch (error) {
                            console.warn('Не удалось сохранить данные в localStorage:', error);
                        }
                        
                        // Обновляем контрол слоев
                        MapModule._updateLayersControl();
                        
                        // Обновляем селекты
                        this.initSelects();
                        
                        console.log('Все районы успешно загружены');
                        alert('Все районы успешно загружены');
                    }
                })
                .catch(error => {
                    console.error(`Ошибка при загрузке района ${districtNumber}:`, error);
                    console.log(`Детали ошибки:`, error.message, error.stack);
                    
                    // Увеличиваем счетчик даже при ошибке
                    loadedCount++;
                    
                    // Если все районы загружены
                    if (loadedCount === totalDistricts) {
                        // Добавляем данные на карту
                        MapModule.districtLayer.addData(combinedGeoJSON);
                        
                        // Приближаем карту к границам районов
                        if (MapModule.districtLayer.getBounds().isValid()) {
                            MapModule.map.fitBounds(MapModule.districtLayer.getBounds());
                        }
                        
                        // Сохраняем данные
                        try {
                            const districtsInfo = combinedGeoJSON.features.map(feature => ({
                                name: feature.properties.name,
                                color: feature.properties.color,
                                type: feature.properties.type
                            }));
                            Utils.saveToLocalStorage(CONFIG.storage.districtsKey + '_info', districtsInfo);
                            console.log('Информация о районах успешно сохранена');
                        } catch (error) {
                            console.warn('Не удалось сохранить данные в localStorage:', error);
                        }
                        
                        // Обновляем контрол слоев
                        MapModule._updateLayersControl();
                        
                        // Обновляем селекты
                        this.initSelects();
                        
                        console.log('Все районы успешно загружены');
                        alert('Все районы успешно загружены');
                    }
                });
        };
        
        // Загружаем все районы
        for (let i = 1; i <= totalDistricts; i++) {
            loadDistrict(i);
        }
    },
    
    /**
     * Загружает микрорайоны
     */
    loadMicrodistricts: async function() {
        try {
            // Загружаем микрорайоны через API
            const response = await ApiModule.getMicrodistricts();
            
            if (response.success && response.data) {
                // Получаем текущие районы для сопоставления district_id -> district name
                const districtMap = {};
                const districtLayers = MapModule.districtLayer.getLayers();
                districtLayers.forEach(layer => {
                    if (layer.feature && layer.feature.properties) {
                        const id = layer.feature.properties.id;
                        const name = layer.feature.properties.name;
                        if (id && name) {
                            districtMap[id] = name;
                        }
                    }
                });
                
                // Очищаем текущий слой
                MapModule.microdistrictLayer.clearLayers();
                
                // Преобразуем данные в GeoJSON FeatureCollection
                const features = response.data.map(microdistrict => ({
                    type: 'Feature',
                    properties: {
                        id: microdistrict.id,
                        name: microdistrict.name,
                        color: microdistrict.color,
                        district_id: microdistrict.district_id,
                        district: districtMap[microdistrict.district_id] || '', // Добавляем название района
                        type: 'microdistrict'
                    },
                    geometry: microdistrict.geometry
                }));
                
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: features
                };
                
                // Получаем текущие районы
                let districtsFC = null;
                try {
                    if (MapModule.districtLayer && MapModule.districtLayer.toGeoJSON) {
                        districtsFC = MapModule.districtLayer.toGeoJSON();
                    }
                } catch(_) {}
                
                // Отображаем на карте
                MapModule.renderFromFeatureCollections(districtsFC, featureCollection);
                this.initSelects();
                
                console.log(`Загружено микрорайонов: ${features.length}`);
            } else {
                alert('Не удалось загрузить микрорайоны');
            }
        } catch (e) {
            console.error('Ошибка загрузки микрорайонов:', e);
            alert('Ошибка при загрузке микрорайонов. Проверьте подключение к серверу.');
        }
    },
    
    /**
     * Включает/выключает режим редактирования
     */
    toggleEditMode: function() {
        MapModule.toggleEditMode();
        
        // Обновляем текст кнопки
        const button = document.getElementById('toggle-edit-mode');
        if (MapModule.editMode) {
            button.textContent = 'Выключить режим редактирования';
            button.classList.add('active');
        } else {
            button.textContent = 'Режим редактирования';
            button.classList.remove('active');
        }
    },
    
    /**
     * Сохраняет изменения в GeoJSON файлы
     */
    saveChanges: function() {
        try {
            // Создаем чистый GeoJSON для районов
            const districtsGeoJSON = {
                type: 'FeatureCollection',
                features: []
            };
            
            // Получаем все районы, избегая использования методов Leaflet
            const districtLayers = MapModule.districtLayer.getLayers();
            for (let i = 0; i < districtLayers.length; i++) {
                const layer = districtLayers[i];
                if (layer && layer.getLatLngs) {
                    try {
                        // Получаем координаты напрямую
                        const latLngs = layer.getLatLngs();
                        const coordinates = this._convertLatLngsToCoordinates(latLngs);
                        
                        // Создаем чистый объект свойств
                        const properties = {};
                        if (layer.feature && layer.feature.properties) {
                            // Копируем только нужные свойства
                            properties.name = layer.feature.properties.name || '';
                            properties.color = layer.feature.properties.color || '#3388ff';
                            properties.type = layer.feature.properties.type || 'district';
                        }
                        
                        // Создаем чистый GeoJSON объект
                        districtsGeoJSON.features.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Polygon',
                                coordinates: coordinates
                            },
                            properties: properties
                        });
                    } catch (e) {
                        console.error('Ошибка при обработке района:', e);
                    }
                }
            }
            
            // Создаем чистый GeoJSON для микрорайонов
            const microdistrictsGeoJSON = {
                type: 'FeatureCollection',
                features: []
            };
            
            // Получаем все микрорайоны, избегая использования методов Leaflet
            const microdistrictLayers = MapModule.microdistrictLayer.getLayers();
            for (let i = 0; i < microdistrictLayers.length; i++) {
                const layer = microdistrictLayers[i];
                if (layer && layer.getLatLngs) {
                    try {
                        // Получаем координаты напрямую
                        const latLngs = layer.getLatLngs();
                        const coordinates = this._convertLatLngsToCoordinates(latLngs);
                        
                        // Создаем чистый объект свойств
                        const properties = {};
                        if (layer.feature && layer.feature.properties) {
                            // Копируем только нужные свойства
                            properties.name = layer.feature.properties.name || '';
                            properties.color = layer.feature.properties.color || '#3388ff';
                            properties.type = layer.feature.properties.type || 'microdistrict';
                            properties.district = layer.feature.properties.district || '';
                        }
                        
                        // Создаем чистый GeoJSON объект
                        microdistrictsGeoJSON.features.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Polygon',
                                coordinates: coordinates
                            },
                            properties: properties
                        });
                    } catch (e) {
                        console.error('Ошибка при обработке микрорайона:', e);
                    }
                }
            }
            
            // Сохраняем в файлы
            const districtsBlob = new Blob([JSON.stringify(districtsGeoJSON, null, 2)], { type: 'application/json' });
            const microdistrictsBlob = new Blob([JSON.stringify(microdistrictsGeoJSON, null, 2)], { type: 'application/json' });
            
            // Создаем ссылки для скачивания
            const districtsUrl = URL.createObjectURL(districtsBlob);
            const microdistrictsUrl = URL.createObjectURL(microdistrictsBlob);
            
            // Создаем элементы для скачивания
            const districtsLink = document.createElement('a');
            districtsLink.href = districtsUrl;
            districtsLink.download = 'districts.geojson';
            document.body.appendChild(districtsLink);
            districtsLink.click();
            document.body.removeChild(districtsLink);
            
            const microdistrictsLink = document.createElement('a');
            microdistrictsLink.href = microdistrictsUrl;
            microdistrictsLink.download = 'microdistricts.geojson';
            document.body.appendChild(microdistrictsLink);
            microdistrictsLink.click();
            document.body.removeChild(microdistrictsLink);
            
            // Освобождаем ресурсы
            URL.revokeObjectURL(districtsUrl);
            URL.revokeObjectURL(microdistrictsUrl);
            
            alert('Данные успешно сохранены в файлы');
        } catch (error) {
            console.error('Ошибка при сохранении файлов:', error);
            alert('Произошла ошибка при сохранении файлов. Подробности в консоли.');
        }
    },
    
    /**
     * Преобразует координаты LatLng в формат GeoJSON
     * @param {Array} latLngs - Массив координат LatLng
     * @returns {Array} Координаты в формате GeoJSON
     */
    _convertLatLngsToCoordinates: function(latLngs) {
        // Проверяем, является ли это массивом массивов (MultiPolygon)
        if (latLngs.length > 0 && Array.isArray(latLngs[0]) && latLngs[0].length > 0 && latLngs[0][0] && latLngs[0][0].lat) {
            // Это Polygon - массив колец
            const result = [];
            for (let i = 0; i < latLngs.length; i++) {
                const ring = [];
                for (let j = 0; j < latLngs[i].length; j++) {
                    ring.push([latLngs[i][j].lng, latLngs[i][j].lat]);
                }
                result.push(ring);
            }
            return result;
        } else if (latLngs.length > 0 && latLngs[0] && latLngs[0].lat) {
            // Это LineString - массив точек
            const result = [];
            for (let i = 0; i < latLngs.length; i++) {
                result.push([latLngs[i].lng, latLngs[i].lat]);
            }
            return [result]; // Для Polygon нужен массив колец
        }
        
        // Если не удалось определить формат, возвращаем пустой массив
        return [[]]; 
    },
    
    /**
     * Приближает карту к выбранному району
     */
    zoomToDistrict: function(districtName) {
        const districts = MapModule.districtLayer.getLayers();
        
        for (const layer of districts) {
            if (layer.feature && layer.feature.properties && layer.feature.properties.name === districtName) {
                MapModule.map.fitBounds(layer.getBounds());
                break;
            }
        }
    },
    
    /**
     * Приближает карту к выбранному микрорайону
     */
    zoomToMicrodistrict: function(microdistrictName) {
        const microdistricts = MapModule.microdistrictLayer.getLayers();
        
        for (const layer of microdistricts) {
            if (layer.feature && layer.feature.properties && layer.feature.properties.name === microdistrictName) {
                MapModule.map.fitBounds(layer.getBounds());
                break;
            }
        }
    },
    
    /**
     * Получает район по имени
     */
    getDistrictByName: function(districtName) {
        const districts = MapModule.districtLayer.getLayers();
        
        for (const layer of districts) {
            if (layer.feature && layer.feature.properties && layer.feature.properties.name === districtName) {
                return layer.feature;
            }
        }
        
        return null;
    },
    
    /**
     * Получает микрорайон по имени
     */
    getMicrodistrictByName: function(microdistrictName) {
        const microdistricts = MapModule.microdistrictLayer.getLayers();
        
        for (const layer of microdistricts) {
            if (layer.feature && layer.feature.properties && layer.feature.properties.name === microdistrictName) {
                return layer.feature;
            }
        }
        
        return null;
    },
    
    /**
     * Определяет, к какому микрорайону относится точка
     */
    getMicrodistrictForPoint: function(point) {
        const microdistricts = MapModule.microdistrictLayer.getLayers();
        
        for (const layer of microdistricts) {
            // Проверяем, что слой имеет валидный feature и свойства
            if (layer && layer.feature && layer.feature.properties && layer.feature.properties.type === 'microdistrict') {
                try {
                    if (Utils.isPointInPolygon(point, layer.feature)) {
                        return layer.feature.properties.name;
                    }
                } catch (error) {
                    console.error('Ошибка при проверке точки в микрорайоне:', error);
                }
            }
        }
        
        return null;
    },
    
    /**
     * Определяет, к какому району относится точка
     */
    getDistrictForPoint: function(point) {
        const districts = MapModule.districtLayer.getLayers();
        
        for (const layer of districts) {
            if (Utils.isPointInPolygon(point, layer.feature)) {
                return layer.feature.properties.name;
            }
        }
        
        return null;
    },
    
    /**
     * Создает пустой GeoJSON для районов
     */
    createEmptyDistrictsGeoJSON: function() {
        return Utils.createEmptyGeoJSON();
    },
    
    /**
     * Создает пустой GeoJSON для микрорайонов
     */
    createEmptyMicrodistrictsGeoJSON: function() {
        return Utils.createEmptyGeoJSON();
    }
};
