/**
 * Основной файл приложения
 */

/**
 * Создает пустые GeoJSON файлы для районов и микрорайонов
 */
function createEmptyGeoJSONFiles() {
    // Проверяем, есть ли данные в localStorage
    const districts = Utils.loadFromLocalStorage(CONFIG.storage.districtsKey);
    const microdistricts = Utils.loadFromLocalStorage(CONFIG.storage.microdistrictsKey);
    
    // Если нет данных, создаем пустые GeoJSON файлы
    if (!districts) {
        const emptyDistricts = DistrictsModule.createEmptyDistrictsGeoJSON();
        Utils.saveToLocalStorage(CONFIG.storage.districtsKey, emptyDistricts);
        
        // Создаем Blob и URL для файла
        const blob = new Blob([JSON.stringify(emptyDistricts)], { type: 'application/json' });
        CONFIG.geojson.districts = URL.createObjectURL(blob);
    }
    
    if (!microdistricts) {
        const emptyMicrodistricts = DistrictsModule.createEmptyMicrodistrictsGeoJSON();
        Utils.saveToLocalStorage(CONFIG.storage.microdistrictsKey, emptyMicrodistricts);
        
        // Создаем Blob и URL для файла
        const blob = new Blob([JSON.stringify(emptyMicrodistricts)], { type: 'application/json' });
        CONFIG.geojson.microdistricts = URL.createObjectURL(blob);
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация приложения...');
    
    // Выводим версию приложения и время загрузки
    console.log('Версия приложения: 1.1.0 (с поддержкой HTML и Excel экспорта)');
    console.log('Время загрузки:', new Date().toLocaleString());
    
    // Проверяем данные в localStorage
    console.log('Данные в localStorage:');
    console.log('- Клиенты:', localStorage.getItem(CONFIG.storage.clientsKey) ? 'есть' : 'нет');
    console.log('- Районы:', localStorage.getItem(CONFIG.storage.districtsKey) ? 'есть' : 'нет');
    console.log('- Микрорайоны:', localStorage.getItem(CONFIG.storage.microdistrictsKey) ? 'есть' : 'нет');
    
    // Инициализируем карту
    MapModule.init();
    
    // Инициализируем модуль районов
    DistrictsModule.init();
    
    // Инициализируем модуль клиентов
    ClientsModule.init();
    
    // Инициализируем модуль маршрутов
    RoutesModule.init();
    
    // Добавляем обработчик для кнопки "Очистить карту"
    document.getElementById('clear-map').addEventListener('click', function() {
        MapModule.clearMap();
    });
    
    // Добавляем обработчик для кнопки "Очистить данные"
    document.getElementById('clear-storage').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
            // Очищаем localStorage
            localStorage.clear();
            console.log('Все данные очищены');
            
            // Перезагружаем страницу
            alert('Данные очищены. Страница будет перезагружена.');
            window.location.reload();
        }
    });
    
    console.log('Приложение успешно инициализировано');
    
    // Создаем пустые GeoJSON файлы, если их нет
    createEmptyGeoJSONFiles();
    
    // Инициализация модального окна с инструкцией
    const instructionsModal = document.getElementById('instructions-modal');
    const showInstructionsBtn = document.getElementById('show-instructions');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    const closeInstructionsX = instructionsModal.querySelector('.close');
    
    // Открытие модального окна с инструкцией
    showInstructionsBtn.addEventListener('click', function() {
        instructionsModal.style.display = 'block';
    });
    
    // Закрытие модального окна по кнопке "Закрыть"
    closeInstructionsBtn.addEventListener('click', function() {
        instructionsModal.style.display = 'none';
    });
    
    // Закрытие модального окна по клику на крестик
    closeInstructionsX.addEventListener('click', function() {
        instructionsModal.style.display = 'none';
    });
    
    // Закрытие модального окна при клике вне окна
    window.addEventListener('click', function(event) {
        if (event.target === instructionsModal) {
            instructionsModal.style.display = 'none';
        }
    });
});
