/**
 * Модуль для работы с картой
 */

const MapModule = {
    // Объект карты Leaflet
    map: null,
    
    // Слои для районов и микрорайонов
    districtLayer: null,
    microdistrictLayer: null,
    
    // Слой для клиентов
    clientLayer: null,
    
    // Слой для маршрута
    routeLayer: null,
    
    // Контрол для рисования
    drawControl: null,
    
    // Флаг режима редактирования
    editMode: false,
    
    // Кэш всех слоев для фильтрации
    allDistrictLayers: [],
    allMicrodistrictLayers: [],
    
    /**
     * Инициализирует карту
     */
    init: function() {
        // Создаем карту
        this.map = L.map('map', {
            center: CONFIG.map.center,
            zoom: CONFIG.map.zoom,
            minZoom: CONFIG.map.minZoom,
            maxZoom: CONFIG.map.maxZoom
        });
        
        // Добавляем тайлы OpenStreetMap
        L.tileLayer(CONFIG.tiles.url, {
            attribution: CONFIG.tiles.attribution
        }).addTo(this.map);
        
        // Инициализируем слои
        // Сначала создаем слой районов (будет ниже)
        this.districtLayer = L.geoJSON(null, {
            style: this._styleDistrict,
            onEachFeature: this._onEachDistrict.bind(this),
            // Делаем районы всегда интерактивными
            interactive: true
        }).addTo(this.map);
        
        // Затем создаем слой микрорайонов (будет выше)
        this.microdistrictLayer = L.geoJSON(null, {
            style: this._styleMicrodistrict,
            onEachFeature: this._onEachMicrodistrict.bind(this),
            // Устанавливаем более высокий z-index для микрорайонов
            zIndex: 450,
            // Делаем микрорайоны всегда интерактивными
            interactive: true
        }).addTo(this.map);
        
        // Устанавливаем более низкий z-index для районов
        this.districtLayer.setZIndex(400);
        
        this.clientLayer = L.featureGroup().addTo(this.map);
        this.routeLayer = L.featureGroup().addTo(this.map);
        
        // Инициализируем контрол для рисования
        this._initDrawControl();
        
        // Нет загрузки из localStorage, всегда загружаем свежие данные из GeoJSON файлов
    },
    
    /**
     * Инициализирует контрол для рисования
     */
    _initDrawControl: function() {
        // Опции для рисования
        const drawOptions = {
            position: 'topright',
            draw: {
                polyline: false,
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polygon: {
                    allowIntersection: false,
                    drawError: {
                        color: '#e74c3c',
                        message: '<strong>Ошибка:</strong> полигоны не могут пересекаться!'
                    },
                    shapeOptions: {
                        color: '#3498db'
                    }
                }
            },
            edit: {
                featureGroup: L.featureGroup([this.districtLayer, this.microdistrictLayer]),
                remove: true
            }
        };
        
        // Создаем контрол
        this.drawControl = new L.Control.Draw(drawOptions);
    },
    
    /**
     * Загружает сохраненные данные из localStorage
     */
    _loadSavedData: function() {
        try {
            // Загружаем районы
            const districts = Utils.loadFromLocalStorage(CONFIG.storage.districtsKey);
            if (districts && districts.type === 'FeatureCollection' && Array.isArray(districts.features)) {
                this.districtLayer.addData(districts);
                this._updateLayersControl();
            } else {
                console.warn('Данные районов в localStorage имеют неверный формат');
                // Очищаем поврежденные данные
                localStorage.removeItem(CONFIG.storage.districtsKey);
            }
            
            // Загружаем микрорайоны
            const microdistricts = Utils.loadFromLocalStorage(CONFIG.storage.microdistrictsKey);
            if (microdistricts && microdistricts.type === 'FeatureCollection' && Array.isArray(microdistricts.features)) {
                this.microdistrictLayer.addData(microdistricts);
            } else {
                console.warn('Данные микрорайонов в localStorage имеют неверный формат');
                // Очищаем поврежденные данные
                localStorage.removeItem(CONFIG.storage.microdistrictsKey);
            }
            
            // Загружаем клиентов
            const clients = Utils.loadFromLocalStorage(CONFIG.storage.clientsKey);
            if (clients && Array.isArray(clients)) {
                ClientsModule.loadClients(clients);
            } else if (clients) {
                console.warn('Данные клиентов в localStorage имеют неверный формат');
                // Очищаем поврежденные данные
                localStorage.removeItem(CONFIG.storage.clientsKey);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных из localStorage:', error);
            // Очищаем все данные в случае критической ошибки
            localStorage.removeItem(CONFIG.storage.districtsKey);
            localStorage.removeItem(CONFIG.storage.microdistrictsKey);
            localStorage.removeItem(CONFIG.storage.clientsKey);
        }
    },
    
    /**
     * Стиль для районов
     */
    _styleDistrict: function(feature) {
        return {
            weight: CONFIG.styles.districts.weight,
            opacity: CONFIG.styles.districts.opacity,
            color: feature.properties.color || CONFIG.styles.districts.color,
            fillOpacity: CONFIG.styles.districts.fillOpacity,
            fillColor: feature.properties.color || CONFIG.styles.districts.color
        };
    },
    
    /**
     * Стиль для микрорайонов
     */
    _styleMicrodistrict: function(feature) {
        return {
            weight: CONFIG.styles.microdistricts.weight,
            opacity: CONFIG.styles.microdistricts.opacity,
            color: feature.properties.color || CONFIG.styles.microdistricts.color,
            fillOpacity: CONFIG.styles.microdistricts.fillOpacity,
            fillColor: feature.properties.color || CONFIG.styles.microdistricts.color
        };
    },
    
    /**
     * Обработчик для каждого района
     */
    _onEachDistrict: function(feature, layer) {
        // Устанавливаем тип объекта
        if (!feature.properties) {
            feature.properties = {};
        }
        feature.properties.type = 'district';
        
        // Добавляем всплывающее окно
        if (feature.properties && feature.properties.name) {
            layer.bindTooltip(feature.properties.name, {
                permanent: false,
                direction: 'center',
                className: 'district-tooltip'
            });
        }
        
        // Сначала удаляем все обработчики, чтобы избежать дублирования
        layer.off('click');
        layer.off('mouseover');
        layer.off('mouseout');
        
        // Добавляем обработчики событий
        const self = this;
        
        // Обработчик клика
        layer.on('click', function(e) {
            // Если включен режим редактирования, открываем модальное окно для редактирования
            if (self.editMode) {
                self._openEditModal(layer, feature);
                return;
            }
            
            // Вызываем функцию приближения
            self._zoomToFeature(e);
            
            // Выделяем район
            self._highlightFeature(e);
            
            // Добавляем класс выделения
            layer.setStyle(CONFIG.styles.selected);
        });
        
        // Обработчики наведения и ухода мыши
        layer.on('mouseover', function(e) {
            self._highlightFeature(e);
        });
        
        layer.on('mouseout', function(e) {
            self._resetHighlight(e);
        });
        
        // Не сохраняем ссылку на слой внутри свойств, чтобы избежать циклических ссылок
    },
    
    /**
     * Обработчик для каждого микрорайона
     */
    _onEachMicrodistrict: function(feature, layer) {
        // Устанавливаем тип объекта
        if (!feature.properties) {
            feature.properties = {};
        }
        feature.properties.type = 'microdistrict';
        
        // Делаем микрорайоны всегда интерактивными и с высоким приоритетом
        layer.setStyle({
            interactive: true,
            bubblingMouseEvents: false  // Отключаем всплытие событий мыши
        });
        
        // Добавляем всплывающее окно
        if (feature.properties && feature.properties.name) {
            layer.bindTooltip(feature.properties.name, {
                permanent: false,
                direction: 'center',
                className: 'microdistrict-tooltip'
            });
        }
        
        // Сначала удаляем все обработчики, чтобы избежать дублирования
        layer.off('click');
        layer.off('mouseover');
        layer.off('mouseout');
        
        // Добавляем обработчики событий с приоритетом
        const self = this;
        
        // Обработчик клика с предотвращением всплытия
        layer.on('click', function(e) {
            // Останавливаем распространение события на районы
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            // Если включен режим редактирования, открываем модальное окно для редактирования
            if (self.editMode) {
                self._openEditModal(layer, feature);
                return;
            }
            
            // Вызываем функцию приближения
            self._zoomToFeature(e);
            
            // Выделяем микрорайон
            self._highlightFeature(e);
            
            // Добавляем класс выделения
            layer.setStyle(CONFIG.styles.selected);
        });
        
        // Обработчики наведения и ухода мыши
        layer.on('mouseover', function(e) {
            L.DomEvent.stopPropagation(e);
            self._highlightFeature(e);
        });
        
        layer.on('mouseout', function(e) {
            L.DomEvent.stopPropagation(e);
            self._resetHighlight(e);
        });
        
        // Не сохраняем ссылку на слой внутри свойств, чтобы избежать циклических ссылок
    },
    
    /**
     * Подсвечивает объект при наведении
     */
    _highlightFeature: function(e) {
        const layer = e.target;
        
        layer.setStyle(CONFIG.styles.hover);
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    },
    
    /**
     * Сбрасывает подсветку объекта
     */
    _resetHighlight: function(e) {
        const layer = e.target;
        const feature = layer.feature;
        
        // Проверяем, к какому слою относится объект
        if (this.districtLayer.hasLayer(layer)) {
            // Это район
            this.districtLayer.resetStyle(layer);
        } else if (this.microdistrictLayer.hasLayer(layer)) {
            // Это микрорайон
            this.microdistrictLayer.resetStyle(layer);
        } else {
            // Если не удалось определить слой, просто сбрасываем стиль
            if (feature) {
                if (feature.properties && feature.properties.type === 'microdistrict') {
                    layer.setStyle(this._styleMicrodistrict(feature));
                } else {
                    layer.setStyle(this._styleDistrict(feature));
                }
            }
        }
    },
    
    /**
     * Приближает карту к объекту при клике
     */
    _zoomToFeature: function(e) {
        const layer = e.target;
        
        this.map.fitBounds(layer.getBounds());
        
        // Если в режиме редактирования, открываем модальное окно
        if (this.editMode) {
            this._openEditModal(layer);
        }
    },
    
    /**
     * Открывает модальное окно для редактирования свойств объекта
     */
    _openEditModal: function(layer) {
        const feature = layer.feature;
        const modal = document.getElementById('edit-modal');
        const nameInput = document.getElementById('edit-name');
        const colorInput = document.getElementById('edit-color');
        const saveButton = document.getElementById('save-edit');
        const deleteButton = document.getElementById('delete-item');
        
        // Заполняем поля
        nameInput.value = feature.properties.name || '';
        colorInput.value = feature.properties.color || '#3388ff';
        
        // Показываем модальное окно
        modal.style.display = 'block';
        
        // Обработчик закрытия
        const closeModal = document.querySelector('.close');
        closeModal.onclick = function() {
            modal.style.display = 'none';
        };
        
        // Обработчик клика вне модального окна
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Обработчик сохранения
        saveButton.onclick = () => {
            feature.properties.name = nameInput.value;
            feature.properties.color = colorInput.value;
            
            // Обновляем стиль
            layer.setStyle({
                color: feature.properties.color,
                fillColor: feature.properties.color
            });
            
            // Обновляем всплывающее окно
            layer.unbindTooltip();
            layer.bindTooltip(feature.properties.name, {
                permanent: false,
                direction: 'center'
            });
            
            // Сохраняем изменения
            this._saveChanges();
            
            // Закрываем модальное окно
            modal.style.display = 'none';
        };
        
        // Обработчик удаления
        deleteButton.onclick = () => {
            if (feature.properties.type === 'district') {
                this.districtLayer.removeLayer(layer);
            } else {
                this.microdistrictLayer.removeLayer(layer);
            }
            
            // Сохраняем изменения
            this._saveChanges();
            
            // Закрываем модальное окно
            modal.style.display = 'none';
        };
    },
    
    /**
     * Сохраняет изменения в localStorage
     */
    _saveChanges: function() {
        try {
            // Создаем чистый GeoJSON для районов
            const districtsGeoJSON = {
                type: 'FeatureCollection',
                features: []
            };
            
            // Получаем все районы, избегая использования методов Leaflet
            const districtLayers = this.districtLayer.getLayers();
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
            const microdistrictLayers = this.microdistrictLayer.getLayers();
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
            
            // Сохраняем в localStorage через Utils.saveToLocalStorage
            Utils.saveToLocalStorage(CONFIG.storage.districtsKey, districtsGeoJSON);
            Utils.saveToLocalStorage(CONFIG.storage.microdistrictsKey, microdistrictsGeoJSON);
            
            // Обновляем контрол слоев
            this._updateLayersControl();
            
            console.log('Данные успешно сохранены в localStorage');
        } catch (error) {
            console.error('Ошибка при сохранении данных:', error);
            alert('Произошла ошибка при сохранении данных. Подробности в консоли.');
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
     * Обновляет контрол слоев
     */
    _updateLayersControl: function() {
        const layersControl = document.getElementById('layers-control');
        layersControl.innerHTML = '';
        
        // Получаем все районы
        const districts = this.districtLayer.getLayers();
        
        // Создаем чекбоксы для каждого района
        districts.forEach(layer => {
            const feature = layer.feature;
            if (feature && feature.properties && feature.properties.name) {
                const layerItem = document.createElement('div');
                layerItem.className = 'layer-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.id = `layer-${feature.properties.name.replace(/\s+/g, '-')}`;
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = feature.properties.name;
                
                // Стилизуем метку цветом района
                if (feature.properties.color) {
                    label.style.color = feature.properties.color;
                    label.style.fontWeight = 'bold';
                }
                
                // Обработчик изменения состояния чекбокса
                checkbox.onchange = (e) => {
                    if (e.target.checked) {
                        // Показываем район
                        if (!this.map.hasLayer(layer)) {
                            this.districtLayer.addLayer(layer);
                        }
                        
                        // Показываем микрорайоны этого района
                        this._toggleMicrodistrictsForDistrict(feature.properties.name, true);
                    } else {
                        // Скрываем район
                        this.districtLayer.removeLayer(layer);
                        
                        // Скрываем микрорайоны этого района
                        this._toggleMicrodistrictsForDistrict(feature.properties.name, false);
                    }
                };
                
                layerItem.appendChild(checkbox);
                layerItem.appendChild(label);
                layersControl.appendChild(layerItem);
            }
        });
    },
    
    /**
     * Включает/выключает отображение микрорайонов для указанного района
     */
    _toggleMicrodistrictsForDistrict: function(districtName, show) {
        const microdistricts = this.microdistrictLayer.getLayers();
        
        microdistricts.forEach(layer => {
            const feature = layer.feature;
            if (feature && feature.properties && feature.properties.district === districtName) {
                if (show) {
                    if (!this.map.hasLayer(layer)) {
                        this.microdistrictLayer.addLayer(layer);
                    }
                } else {
                    this.microdistrictLayer.removeLayer(layer);
                }
            }
        });
    },
    
    /**
     * Загружает районы из GeoJSON файла
     */
    loadDistricts: function() {
        Utils.loadGeoJSON(CONFIG.geojson.districts)
            .then(data => {
                // Очищаем текущий слой
                this.districtLayer.clearLayers();
                
                // Добавляем тип к каждому объекту
                data.features.forEach(feature => {
                    if (!feature.properties) {
                        feature.properties = {};
                    }
                    feature.properties.type = 'district';
                    
                    // Если нет цвета, генерируем случайный
                    if (!feature.properties.color) {
                        feature.properties.color = Utils.getRandomColor();
                    }
                });
                
                // Добавляем данные на карту
                this.districtLayer.addData(data);
                
                // Приближаем карту к границам районов
                this.map.fitBounds(this.districtLayer.getBounds());
                
                // Сохраняем данные - только исходный GeoJSON, без циклических ссылок
                try {
                    // Создаем копию данных без свойств Leaflet
                    const cleanData = {
                        type: data.type,
                        features: data.features.map(feature => ({
                            type: feature.type,
                            properties: { ...feature.properties },
                            geometry: { ...feature.geometry }
                        }))
                    };
                    Utils.saveToLocalStorage(CONFIG.storage.districtsKey, cleanData);
                } catch (error) {
                    console.error('Ошибка при сохранении районов:', error);
                }
                
                // Обновляем контрол слоев
                this._updateLayersControl();
                
                console.log('Районы успешно загружены');
            })
            .catch(error => {
                console.error('Ошибка при загрузке районов:', error);
                alert('Ошибка при загрузке районов. Проверьте консоль для деталей.');
            });
    },
    
    /**
     * Загружает микрорайоны из GeoJSON файла
     */
    loadMicrodistricts: function() {
        Utils.loadGeoJSON(CONFIG.geojson.microdistricts)
            .then(data => {
                // Очищаем текущий слой
                this.microdistrictLayer.clearLayers();
                
                // Получаем районы для определения принадлежности
                const districts = this.districtLayer.getLayers();
                
                // Добавляем тип и район к каждому объекту
                data.features.forEach(feature => {
                    if (!feature.properties) {
                        feature.properties = {};
                    }
                    feature.properties.type = 'microdistrict';
                    
                    // Если в свойствах уже есть район, используем его
                    if (!feature.properties.district) {
                        // Если нет, устанавливаем значение по умолчанию
                        feature.properties.district = 'Неизвестный район';
                    }
                    
                    // Если цвет не указан, генерируем случайный
                    if (!feature.properties.color) {
                        feature.properties.color = Utils.getRandomColor();
                    }
                });
                
                // Добавляем данные на карту
                this.microdistrictLayer.addData(data);
                
                // Сохраняем данные - только исходный GeoJSON, без циклических ссылок
                try {
                    // Создаем копию данных без свойств Leaflet
                    const cleanData = {
                        type: data.type,
                        features: data.features.map(feature => ({
                            type: feature.type,
                            properties: { ...feature.properties },
                            geometry: { ...feature.geometry }
                        }))
                    };
                    Utils.saveToLocalStorage(CONFIG.storage.microdistrictsKey, cleanData);
                } catch (error) {
                    console.error('Ошибка при сохранении микрорайонов:', error);
                }
                
                console.log('Микрорайоны успешно загружены');
            })
            .catch(error => {
                console.error('Ошибка при загрузке микрорайонов:', error);
                alert('Ошибка при загрузке микрорайонов. Проверьте консоль для деталей.');
            });
    },
    
    /**
     * Включает/выключает режим редактирования
     */
    toggleEditMode: function() {
        this.editMode = !this.editMode;
        
        if (this.editMode) {
            // Добавляем контрол для рисования
            this.map.addControl(this.drawControl);
            
            // Добавляем обработчик события создания объекта
            this.map.on(L.Draw.Event.CREATED, this._onDrawCreated.bind(this));
            
            // Добавляем обработчики событий редактирования
            this.map.on(L.Draw.Event.EDITED, this._onDrawEdited.bind(this));
            this.map.on(L.Draw.Event.DELETED, this._onDrawDeleted.bind(this));
            
            console.log('Режим редактирования включен');
        } else {
            // Удаляем контрол для рисования
            this.map.removeControl(this.drawControl);
            
            // Удаляем обработчики событий
            this.map.off(L.Draw.Event.CREATED);
            this.map.off(L.Draw.Event.EDITED);
            this.map.off(L.Draw.Event.DELETED);
            
            console.log('Режим редактирования выключен');
        }
    },
    
    /**
     * Обработчик события создания объекта
     */
    _onDrawCreated: function(e) {
        const layer = e.layer;
        const type = e.layerType;
        
        // Создаем модальное окно для ввода свойств
        const modal = document.getElementById('edit-modal');
        const nameInput = document.getElementById('edit-name');
        const colorInput = document.getElementById('edit-color');
        const saveButton = document.getElementById('save-edit');
        const deleteButton = document.getElementById('delete-item');
        
        // Скрываем кнопку удаления для нового объекта
        deleteButton.style.display = 'none';
        
        // Показываем модальное окно
        modal.style.display = 'block';
        
        // Обработчик закрытия
        const closeModal = document.querySelector('.close');
        closeModal.onclick = function() {
            modal.style.display = 'none';
        };
        
        // Обработчик клика вне модального окна
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Обработчик сохранения
        saveButton.onclick = () => {
            // Создаем GeoJSON объект
            const feature = layer.toGeoJSON();
            feature.properties = {
                name: nameInput.value,
                color: colorInput.value
            };
            
            // Определяем тип объекта (район или микрорайон)
            const objectType = document.querySelector('input[name="object-type"]:checked').value;
            feature.properties.type = objectType;
            
            // Если это микрорайон, определяем район
            if (objectType === 'microdistrict') {
                // Используем центроид для определения района
                const centroid = turf.centroid(feature);
                const point = [centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]];
                
                const districts = this.districtLayer.getLayers();
                for (const district of districts) {
                    if (Utils.isPointInPolygon(point, district.feature)) {
                        feature.properties.district = district.feature.properties.name;
                        break;
                    }
                }
                
                // Если не удалось определить район
                if (!feature.properties.district) {
                    feature.properties.district = 'Неизвестный район';
                }
                
                // Добавляем на слой микрорайонов
                this.microdistrictLayer.addData(feature);
            } else {
                // Добавляем на слой районов
                this.districtLayer.addData(feature);
                
                // Обновляем контрол слоев
                this._updateLayersControl();
            }
            
            // Сохраняем изменения
            this._saveChanges();
            
            // Закрываем модальное окно
            modal.style.display = 'none';
            
            // Возвращаем кнопку удаления
            deleteButton.style.display = 'block';
        };
    },
    
    /**
     * Обработчик события редактирования объекта
     */
    _onDrawEdited: function(e) {
        const layers = e.layers;
        
        // Сохраняем изменения
        this._saveChanges();
        
        console.log('Объекты отредактированы');
    },
    
    /**
     * Обработчик события удаления объекта
     */
    _onDrawDeleted: function(e) {
        const layers = e.layers;
        
        // Сохраняем изменения
        this._saveChanges();
        
        console.log('Объекты удалены');
    },
    
    /**
     * Очищает все слои карты
     */
    clearMap: function() {
        // Очищаем все слои
        this.districtLayer.clearLayers();
        this.microdistrictLayer.clearLayers();
        this.clientLayer.clearLayers();
        this.routeLayer.clearLayers();
        
        // Очищаем контрол слоев
        const layersControl = document.getElementById('layers-control');
        if (layersControl) {
            layersControl.innerHTML = '';
        }
        
        console.log('Карта очищена');
    },
    
    /**
     * Очищает маршрут
     */
    clearRoute: function() {
        this.routeLayer.clearLayers();
        
        // Восстанавливаем видимость маркеров клиентов
        this.clientLayer.eachLayer(function(layer) {
            layer.setOpacity(1); // Возвращаем полную видимость
        });
    },
    
    /**
     * Отображает маршрут на карте
     */
    showRoute: function(route) {
        // Очищаем текущий маршрут
        this.clearRoute();
        
        // Скрываем маркеры клиентов, чтобы они не мешали маркерам маршрута
        this.clientLayer.eachLayer(function(layer) {
            layer.setOpacity(0); // Делаем маркеры прозрачными
        });
        
        // Создаем маркеры для каждой точки маршрута
        route.forEach((client, index) => {
            // Создаем маркер
            const marker = L.marker([client.lat, client.lng], {
                icon: L.divIcon({
                    className: 'custom-marker route-marker',
                    html: `<div>${index + 1}</div>`,
                    iconSize: [28, 28],  // Уменьшаем размер иконки еще больше
                    iconAnchor: [14, 14] // Центрируем иконку
                })
            });
            
            // Добавляем всплывающее окно с увеличенным шрифтом
            const popupContent = `
                <div style="font-size: 16px;">
                    <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">
                        <span style="display: inline-block; width: 30px; height: 30px; background-color: #e74c3c; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 10px;">${index + 1}</span>
                        ${client.name}
                    </div>
                    <div>
                        <strong>Подотдел:</strong> ${client.territory || 'Не указан'}<br>
                        <strong>Категория ТТ:</strong> ${client.category || 'Не указана'}<br>
                        <strong>Тип ТТ:</strong> ${client.type || 'Не указан'}<br>
                        <strong>Телефон:</strong> ${client.phone || '-'}<br>
                        <strong>Координаты:</strong> ${client.lat.toFixed(6)}, ${client.lng.toFixed(6)}
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent, { minWidth: 250 });
            
            // Добавляем на слой маршрута
            this.routeLayer.addLayer(marker);
        });
        
        // Линии маршрута отключены по запросу пользователя
        // При необходимости раскомментируйте код ниже, чтобы вернуть линии
        /*
        const routePoints = route.map(client => [client.lat, client.lng]);
        if (routePoints.length > 1) {
            const routeLine = L.polyline(routePoints, {
                color: CONFIG.route.lineColor,
                weight: CONFIG.route.lineWeight,
                opacity: CONFIG.route.lineOpacity
            });
            
            this.routeLayer.addLayer(routeLine);
        }
        */
        
        // Приближаем карту к маршруту
        if (this.routeLayer.getLayers().length > 0) {
            this.map.fitBounds(this.routeLayer.getBounds());
        }
    },

    /**
     * Отрисовывает районы и микрорайоны из FeatureCollection
     * @param {Object} districtsFC - GeoJSON FeatureCollection с районами
     * @param {Object} microdistrictsFC - GeoJSON FeatureCollection с микрорайонами
     */
    renderFromFeatureCollections: function(districtsFC, microdistrictsFC) {
        try {
            // Санитарная копия без свойств layer/функций
            const sanitizeFC = (fc, type, defaultColor) => ({
                type: 'FeatureCollection',
                features: (fc.features || []).map(src => {
                    const props = { ...(src.properties || {}) };
                    if (props.layer) delete props.layer;
                    props.type = type;
                    if (!props.color && defaultColor) props.color = defaultColor;
                    return {
                        type: 'Feature',
                        geometry: src.geometry ? JSON.parse(JSON.stringify(src.geometry)) : null,
                        properties: props
                    };
                })
            });

            // Если переданы районы — обновляем их (очищаем только слой районов)
            if (districtsFC && Array.isArray(districtsFC.features)) {
                this.districtLayer.clearLayers();
                this.allDistrictLayers = []; // Очищаем кэш
                const districtsCopy = sanitizeFC(districtsFC, 'district', CONFIG.styles.districts.color);
                this.districtLayer.addData(districtsCopy);
                // Сохраняем все слои в кэш
                this.allDistrictLayers = this.districtLayer.getLayers();
            }
            // Если переданы микрорайоны — обновляем их (очищаем только слой микрорайонов)
            if (microdistrictsFC && Array.isArray(microdistrictsFC.features)) {
                this.microdistrictLayer.clearLayers();
                this.allMicrodistrictLayers = []; // Очищаем кэш
                const microCopy = sanitizeFC(microdistrictsFC, 'microdistrict', CONFIG.styles.microdistricts.color);
                this.microdistrictLayer.addData(microCopy);
                // Сохраняем все слои в кэш
                this.allMicrodistrictLayers = this.microdistrictLayer.getLayers();
            }
            // Fit bounds при наличии данных
            const bounds = L.latLngBounds();
            if (this.districtLayer.getLayers().length) bounds.extend(this.districtLayer.getBounds());
            if (this.microdistrictLayer.getLayers().length) bounds.extend(this.microdistrictLayer.getBounds());
            if (bounds.isValid()) this.map.fitBounds(bounds);
            // Обновить контрол слоев и селекты
            this._updateLayersControl();
            if (typeof DistrictsModule !== 'undefined' && DistrictsModule.initSelects) {
                DistrictsModule.initSelects();
            }
        } catch (e) {
            console.error('Ошибка отрисовки данных компании/города:', e);
        }
    },
    
    /**
     * Фильтрует отображение районов и микрорайонов на карте
     * @param {string} filterType - Тип фильтра: 'city', 'district', 'microdistrict'
     * @param {string} filterValue - Значение фильтра (название района или микрорайона)
     */
    filterMapBySelection: function(filterType, filterValue) {
        // Используем кэш всех слоев вместо getLayers()
        const districtLayers = this.allDistrictLayers;
        const microdistrictLayers = this.allMicrodistrictLayers;
        
        if (filterType === 'city' || !filterValue) {
            // Показываем все районы и микрорайоны
            districtLayers.forEach(layer => {
                if (!this.map.hasLayer(layer)) {
                    this.districtLayer.addLayer(layer);
                }
            });
            microdistrictLayers.forEach(layer => {
                if (!this.map.hasLayer(layer)) {
                    this.microdistrictLayer.addLayer(layer);
                }
            });
        } else if (filterType === 'district') {
            // Показываем только выбранный район и его микрорайоны
            districtLayers.forEach(layer => {
                if (layer.feature && layer.feature.properties && layer.feature.properties.name === filterValue) {
                    // Выбранный район - показываем
                    if (!this.map.hasLayer(layer)) {
                        this.districtLayer.addLayer(layer);
                    }
                } else {
                    // Остальные районы - скрываем
                    if (this.map.hasLayer(layer)) {
                        this.districtLayer.removeLayer(layer);
                    }
                }
            });
            
            microdistrictLayers.forEach(layer => {
                if (layer.feature && layer.feature.properties && layer.feature.properties.district === filterValue) {
                    // Микрорайоны выбранного района - показываем
                    if (!this.map.hasLayer(layer)) {
                        this.microdistrictLayer.addLayer(layer);
                    }
                } else {
                    // Остальные микрорайоны - скрываем
                    if (this.map.hasLayer(layer)) {
                        this.microdistrictLayer.removeLayer(layer);
                    }
                }
            });
        } else if (filterType === 'microdistrict') {
            // Показываем только выбранный микрорайон
            districtLayers.forEach(layer => {
                // Скрываем все районы
                if (this.map.hasLayer(layer)) {
                    this.districtLayer.removeLayer(layer);
                }
            });
            
            microdistrictLayers.forEach(layer => {
                if (layer.feature && layer.feature.properties && layer.feature.properties.name === filterValue) {
                    // Выбранный микрорайон - показываем
                    if (!this.map.hasLayer(layer)) {
                        this.microdistrictLayer.addLayer(layer);
                    }
                } else {
                    // Остальные микрорайоны - скрываем
                    if (this.map.hasLayer(layer)) {
                        this.microdistrictLayer.removeLayer(layer);
                    }
                }
            });
        }
    },
    
    /**
     * Открывает модальное окно для редактирования существующего района или микрорайона
     */
    _openEditModal: function(layer, feature) {
        const modal = document.getElementById('edit-modal');
        const nameInput = document.getElementById('edit-name');
        const colorInput = document.getElementById('edit-color');
        const saveButton = document.getElementById('save-edit');
        const deleteButton = document.getElementById('delete-item');
        const districtRadio = document.querySelector('input[name="object-type"][value="district"]');
        const microdistrictRadio = document.querySelector('input[name="object-type"][value="microdistrict"]');
        
        // Заполняем поля текущими значениями
        nameInput.value = feature.properties.name || '';
        colorInput.value = feature.properties.color || '#3388ff';
        
        // Устанавливаем тип объекта
        if (feature.properties.type === 'microdistrict') {
            microdistrictRadio.checked = true;
        } else {
            districtRadio.checked = true;
        }
        
        // Показываем кнопку удаления
        deleteButton.style.display = 'inline-block';
        
        // Показываем модальное окно
        modal.style.display = 'block';
        
        // Обработчик закрытия
        const closeModal = document.querySelector('#edit-modal .close');
        closeModal.onclick = function() {
            modal.style.display = 'none';
        };
        
        // Обработчик клика вне модального окна
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Удаляем старые обработчики
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        const newDeleteButton = deleteButton.cloneNode(true);
        deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
        
        // Обработчик сохранения
        newSaveButton.onclick = () => {
            // Обновляем свойства объекта
            feature.properties.name = nameInput.value;
            feature.properties.color = colorInput.value;
            
            // Обновляем тип объекта
            const newType = document.querySelector('input[name="object-type"]:checked').value;
            const oldType = feature.properties.type;
            
            // Если тип изменился, нужно переместить объект на другой слой
            if (newType !== oldType) {
                // Удаляем из старого слоя
                if (oldType === 'district') {
                    this.districtLayer.removeLayer(layer);
                } else {
                    this.microdistrictLayer.removeLayer(layer);
                }
                
                // Обновляем тип
                feature.properties.type = newType;
                
                // Добавляем на новый слой
                if (newType === 'district') {
                    this.districtLayer.addData(feature);
                } else {
                    // Для микрорайона определяем район
                    const centroid = turf.centroid(feature);
                    const point = [centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]];
                    
                    const districts = this.districtLayer.getLayers();
                    for (const district of districts) {
                        if (Utils.isPointInPolygon(point, district.feature)) {
                            feature.properties.district = district.feature.properties.name;
                            break;
                        }
                    }
                    
                    if (!feature.properties.district) {
                        feature.properties.district = 'Неизвестный район';
                    }
                    
                    this.microdistrictLayer.addData(feature);
                }
            } else {
                // Обновляем стиль существующего слоя
                layer.setStyle({
                    color: feature.properties.color,
                    fillColor: feature.properties.color
                });
                
                // Обновляем tooltip
                if (layer.getTooltip()) {
                    layer.unbindTooltip();
                }
                layer.bindTooltip(feature.properties.name, {
                    permanent: false,
                    direction: 'center',
                    className: oldType === 'district' ? 'district-tooltip' : 'microdistrict-tooltip'
                });
            }
            
            // Сохраняем изменения в CompanyManager
            if (typeof CompanyManager !== 'undefined' && CompanyManager.saveCurrentData) {
                CompanyManager.saveCurrentData();
            }
            
            // Обновляем контрол слоев и селекты
            this._updateLayersControl();
            if (typeof DistrictsModule !== 'undefined' && DistrictsModule.initSelects) {
                DistrictsModule.initSelects();
            }
            
            // Закрываем модальное окно
            modal.style.display = 'none';
        };
        
        // Обработчик удаления
        newDeleteButton.onclick = () => {
            if (confirm(`Вы уверены, что хотите удалить "${feature.properties.name}"?`)) {
                // Удаляем из соответствующего слоя
                if (feature.properties.type === 'district') {
                    this.districtLayer.removeLayer(layer);
                } else {
                    this.microdistrictLayer.removeLayer(layer);
                }
                
                // Сохраняем изменения в CompanyManager
                if (typeof CompanyManager !== 'undefined' && CompanyManager.saveCurrentData) {
                    CompanyManager.saveCurrentData();
                }
                
                // Обновляем контрол слоев и селекты
                this._updateLayersControl();
                if (typeof DistrictsModule !== 'undefined' && DistrictsModule.initSelects) {
                    DistrictsModule.initSelects();
                }
                
                // Закрываем модальное окно
                modal.style.display = 'none';
            }
        };
    }
};
