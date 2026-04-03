/**
 * Конфигурационный файл приложения
 */
const CONFIG = {
    // Начальные координаты и масштаб карты (центр Ташкента)
    map: {
        center: [41.2995, 69.2401],
        zoom: 12,
        minZoom: 10,
        maxZoom: 18
    },
    
    // Настройки тайлов карты (используем OpenStreetMap)
    tiles: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    
    // Пути к GeoJSON файлам
    geojson: {
        districts: 'map/district1.geojson',
        microdistricts: 'mini-map/microdistrict1.geojson',
        // Дополнительные районы
        district1: 'map/district1.geojson',
        district2: 'map/district2.geojson',
        district3: 'map/district3.geojson',
        district4: 'map/district4.geojson',
        district5: 'map/district5.geojson',
        district6: 'map/district6.geojson',
        district7: 'map/district7.geojson',
        district8: 'map/district8.geojson',
        district9: 'map/district9.geojson',
        district10: 'map/district10.geojson',
        district11: 'map/district11.geojson',
        district12: 'map/district12.geojson'
    },
    
    // Настройки стилей для районов и микрорайонов
    styles: {
        districts: {
            weight: 2,
            opacity: 1,
            color: '#3388ff',
            fillOpacity: 0.2
        },
        microdistricts: {
            weight: 2,
            opacity: 1,
            color: '#e74c3c',
            fillOpacity: 0.2,
            dashArray: '3'
        },
        selected: {
            weight: 3,
            color: '#ff7800',
            dashArray: '',
            fillOpacity: 0.5
        },
        hover: {
            weight: 3,
            color: '#0078ff',
            dashArray: '',
            fillOpacity: 0.3
        }
    },
    
    // Настройки для маркеров клиентов
    markers: {
        radius: 6,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    },
    
    // Цвета для дней недели (для маркеров клиентов)
    dayColors: {
        1: '#e74c3c', // Понедельник
        2: '#3498db', // Вторник
        3: '#2ecc71', // Среда
        4: '#f39c12', // Четверг
        5: '#9b59b6', // Пятница
        6: '#1abc9c', // Суббота
        7: '#34495e'  // Воскресенье
    },
    
    // Настройки для алгоритма построения маршрута
    route: {
        lineColor: '#e74c3c',
        lineWeight: 3,
        lineOpacity: 0.7
    },
    
    // Настройки для сохранения данных
    storage: {
        districtsKey: 'tashkent_districts',
        microdistrictsKey: 'tashkent_microdistricts',
        clientsKey: 'tashkent_clients'
    }
};
