/**
 * Скрипт для генерации примера Excel-файла с клиентами
 * Для запуска требуется Node.js и библиотека xlsx
 * npm install xlsx
 */

const XLSX = require('xlsx');

// Функция для генерации случайных координат в пределах Ташкента
function getRandomCoordinates() {
    // Примерные границы Ташкента
    const minLat = 41.25;
    const maxLat = 41.35;
    const minLng = 69.20;
    const maxLng = 69.30;
    
    const lat = minLat + Math.random() * (maxLat - minLat);
    const lng = minLng + Math.random() * (maxLng - minLng);
    
    return [lat.toFixed(6), lng.toFixed(6)];
}

// Генерация случайного дня недели (1-7)
function getRandomDay() {
    return Math.floor(Math.random() * 7) + 1;
}

// Генерация случайной территории
function getRandomTerritory() {
    const territories = [
        'Северная зона',
        'Южная зона',
        'Западная зона',
        'Восточная зона',
        'Центральная зона'
    ];
    
    return territories[Math.floor(Math.random() * territories.length)];
}

// Генерация имени клиента
function getClientName(index) {
    const prefixes = ['Магазин', 'Супермаркет', 'Киоск', 'Аптека', 'Кафе', 'Ресторан'];
    const names = ['Восток', 'Юлдуз', 'Барака', 'Лаззат', 'Шарк', 'Ташкент', 'Узбекистан'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    return `${prefix} "${name}-${index}"`;
}

// Создаем данные для Excel
function generateExcelData(count) {
    // Заголовки
    const headers = ['Наименование клиента', 'Широта', 'Долгота', 'День посещения', 'Территория агента'];
    
    // Данные
    const data = [headers];
    
    for (let i = 1; i <= count; i++) {
        const coords = getRandomCoordinates();
        const row = [
            getClientName(i),
            coords[0],
            coords[1],
            getRandomDay(),
            getRandomTerritory()
        ];
        
        data.push(row);
    }
    
    return data;
}

// Создаем Excel-файл
function createExcelFile(data, filename) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Клиенты');
    XLSX.writeFile(wb, filename);
    
    console.log(`Файл ${filename} успешно создан`);
}

// Генерируем данные и создаем файл
const data = generateExcelData(50); // 50 клиентов
createExcelFile(data, 'sample_clients.xlsx');
