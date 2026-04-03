/**
 * Модуль для предварительного просмотра маршрутов
 */

const PreviewModule = {
    /**
     * Показывает предварительный просмотр маршрута
     * @param {Array} route - Маршрут (массив клиентов)
     * @param {string} districtName - Название района
     * @param {string} microdistrictName - Название микрорайона
     */
    showRoutePreview: function(route, districtName, microdistrictName) {
        // Перенаправляем на функцию в Utils
        Utils.showRoutePreview(route, districtName, microdistrictName);
    }
};

// Экспортируем модуль для использования в других файлах
window.PreviewModule = PreviewModule;
