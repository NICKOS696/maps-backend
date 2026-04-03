/**
 * Новая функция для предварительного просмотра маршрута
 */
function showRoutePreview(route, districtName, microdistrictName) {
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
    listContainer.style.width = '300px';
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
    
    // Создаем таблицу с клиентами
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
    route.forEach((client, index) => {
        const row = document.createElement('tr');
        row.style.backgroundColor = index % 2 === 0 ? 'white' : '#f2f2f2';
        
        const cellNum = document.createElement('td');
        cellNum.style.padding = '4px';
        cellNum.style.textAlign = 'center';
        cellNum.style.border = '1px solid #ddd';
        cellNum.textContent = index + 1;
        
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
    });
    
    table.appendChild(tbody);
    listContent.appendChild(table);
    listContainer.appendChild(listContent);
    
    // Создаем кнопки
    const buttons = document.createElement('div');
    buttons.style.padding = '10px';
    buttons.style.borderTop = '1px solid #ddd';
    buttons.style.textAlign = 'center';
    
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Экспортировать';
    exportBtn.style.padding = '8px 16px';
    exportBtn.style.backgroundColor = '#3498db';
    exportBtn.style.color = 'white';
    exportBtn.style.border = 'none';
    exportBtn.style.borderRadius = '4px';
    exportBtn.style.cursor = 'pointer';
    exportBtn.style.marginRight = '10px';
    
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
        document.body.removeChild(modal);
        // Вызываем функцию экспорта
        Utils._saveRouteToPDF(route, districtName, microdistrictName);
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
        
        const markers = [];
        const latlngs = [];
        
        route.forEach((client, index) => {
            const latlng = [client.lat, client.lng];
            latlngs.push(latlng);
            
            const icon = L.divIcon({
                className: 'route-marker',
                html: `<div style="background-color: #3498db; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold;">${index + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const marker = L.marker(latlng, { icon: icon }).addTo(map);
            marker.bindPopup(`<b>№${index + 1}: ${client.name}</b>`);
            markers.push(marker);
        });
        
        if (latlngs.length > 1) {
            const routeLine = L.polyline(latlngs, { color: '#3498db', weight: 3 }).addTo(map);
            map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
        } else if (latlngs.length === 1) {
            map.setView(latlngs[0], 15);
        }
    }, 100);
    
    return modal;
}

// Экспортируем функцию
if (typeof Utils !== 'undefined') {
    Utils.showRoutePreview = showRoutePreview;
}
