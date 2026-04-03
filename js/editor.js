/**
 * Editor UI logic: company/city selectors and mini-editor modal
 */
(function(){
  function byId(id){ return document.getElementById(id); }

  function populateCompanies(selectEl){
    selectEl.innerHTML = '<option value="">Выберите компанию</option>';
    CompanyManager.getCompanies().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c; selectEl.appendChild(opt);
    });
  }

  async function onCompanyChange(){
    const company = byId('company-select').value;
    if (!company) return;
    await CompanyManager.loadCompany(company);
    // fill city list
    const citySel = byId('city-select');
    citySel.innerHTML = '<option value="">Выберите город</option>';
    CompanyManager.getCities(company).forEach(city => {
      const opt = document.createElement('option');
      opt.value = city; opt.textContent = city; citySel.appendChild(opt);
    });
    // also fill mini-editor company
    populateCompanies(byId('mini-company'));
  }

  function onCityChange(){
    const company = byId('company-select').value;
    const city = byId('city-select').value;
    if (!company || !city) return;
    CompanyManager.setCity(city);
    const districtsFC = CompanyManager.getDistrictsFC(company, city);
    const microFC = CompanyManager.getMicrodistrictsFC(company, city);
    if (MapModule && MapModule.renderFromFeatureCollections){
      MapModule.renderFromFeatureCollections(districtsFC, microFC);
    }
    // Сбрасываем фильтр при выборе города
    if (MapModule && MapModule.filterMapBySelection) {
      MapModule.filterMapBySelection('city', city);
    }
  }

  function refreshMiniTypeUI(){
    const type = document.querySelector('input[name="mini-type"]:checked')?.value || 'district';
    const isCity = type === 'city';
    const isDistrict = type === 'district';
    const isMicro = type === 'microdistrict';
    // поля
    byId('mini-name-wrapper').style.display = isCity ? 'none' : 'block';
    byId('mini-color-wrapper').style.display = isCity ? 'none' : 'block';
    byId('mini-coords-wrapper').style.display = isCity ? 'none' : 'block';
    // выборы города: либо текст для города, либо селект для район/микрорайон
    byId('mini-city-text-wrapper').style.display = isCity ? 'block' : 'none';
    byId('mini-city-select-wrapper').style.display = (isDistrict || isMicro) ? 'block' : 'none';
    // выбор района только для микрорайона
    byId('mini-district-select-wrapper').style.display = isMicro ? 'block' : 'none';
    // устаревшее поле района всегда скрыто
    byId('mini-district-wrapper').style.display = 'none';
  }

  function openMiniEditor(){
    const modal = byId('mini-editor-modal');
    // sync company list
    populateCompanies(byId('mini-company'));
    // preselect current
    const mainCompany = byId('company-select').value;
    if (mainCompany) byId('mini-company').value = mainCompany;
    const mainCity = byId('city-select').value;
    byId('mini-city').value = mainCity || '';
    // очистим поля имени и координат при открытии
    const nameInput = byId('mini-name');
    if (nameInput) nameInput.value = '';
    const coordsArea = byId('mini-coords');
    if (coordsArea) coordsArea.value = '';
    // заполним выпадающий список городов
    const cityListSel = byId('mini-city-select');
    cityListSel.innerHTML = '';
    const cities = CompanyManager.getCities(mainCompany || CompanyManager.getCurrentCompany());
    cities.forEach(c => { const opt = document.createElement('option'); opt.value=c; opt.textContent=c; cityListSel.appendChild(opt); });

    // если выбран город — подгрузим районы
    const fillDistricts = () => {
      const selCity = cityListSel.value;
      const dSel = byId('mini-district-select');
      dSel.innerHTML = '';
      const districtsFC = CompanyManager.getDistrictsFC(mainCompany || CompanyManager.getCurrentCompany(), selCity);
      if (districtsFC && districtsFC.features){
        districtsFC.features.forEach(f=>{
          if (f.properties && f.properties.name){
            const opt = document.createElement('option'); opt.value=f.properties.name; opt.textContent=f.properties.name; dSel.appendChild(opt);
          }
        });
      }
    };
    cityListSel.onchange = fillDistricts;
    if (cityListSel.options.length>0){ cityListSel.value = mainCity || cityListSel.options[0].value; fillDistricts(); }

    // По умолчанию включаем тип 'district' и применим видимость
    const defaultType = document.querySelector('input[name="mini-type"][value="district"]');
    if (defaultType) defaultType.checked = true;
    // Применим текущую видимость по типу сразу
    refreshMiniTypeUI();

    modal.style.display = 'block';
  }

  function closeMiniEditor(){
    const modal = byId('mini-editor-modal');
    if (modal) modal.style.display = 'none';
  }

  function setupMiniEditor(){
    // toggle inputs visibility by type
    document.querySelectorAll('input[name="mini-type"]').forEach(r => {
      r.addEventListener('change', refreshMiniTypeUI);
    });
    refreshMiniTypeUI(); // call once on open

    byId('open-mini-editor').addEventListener('click', openMiniEditor);
    const closes = document.querySelectorAll('.mini-editor-close');
    closes.forEach(c => c.addEventListener('click', closeMiniEditor));

    byId('mini-save').addEventListener('click', () => {
      const company = byId('mini-company').value;
      const type = document.querySelector('input[name="mini-type"]:checked').value;
      let name = byId('mini-name').value.trim();
      const color = byId('mini-color').value || '#3388ff';
      const coordsText = byId('mini-coords').value;

      try {
        if (type === 'city') {
          // создаем пустой город
          const cityName = byId('mini-city').value.trim();
          if (!cityName){ alert('Введите название города'); return; }
          CompanyManager.ensureCity(company, cityName);
          // обновим селект города приложения
          const citySel = byId('city-select');
          if (![...citySel.options].some(o => o.value === cityName)){
            const opt = document.createElement('option'); opt.value = cityName; opt.textContent = cityName; citySel.appendChild(opt);
          }
          citySel.value = cityName;
          CompanyManager.setCity(cityName);
          onCityChange();
        } else if (type === 'district') {
          const selCity = byId('mini-city-select').value || byId('mini-city').value.trim();
          if (!company || !selCity){ alert('Пожалуйста, выберите город.'); return; }
          if (!name){ alert('Введите название района'); return; }
          if (!coordsText){ alert('Введите координаты района'); return; }
          CompanyManager.addDistrict({ company, city: selCity, name, color, coordinates: coordsText });
          // если редактируем текущий город — перерисуем
          if (byId('city-select').value === selCity) onCityChange();
        } else if (type === 'microdistrict') {
          const selCity = byId('mini-city-select').value || byId('mini-city').value.trim();
          const parentDistrict = byId('mini-district-select').value || byId('mini-parent-district').value.trim();
          if (!company || !selCity){ alert('Пожалуйста, выберите город.'); return; }
          if (!parentDistrict){ alert('Пожалуйста, выберите район.'); return; }
          if (!name){ alert('Введите название микрорайона'); return; }
          if (!coordsText){ alert('Введите координаты микрорайона'); return; }
          CompanyManager.addMicrodistrict({ company, city: selCity, districtName: parentDistrict, name, color, coordinates: coordsText });
          if (byId('city-select').value === selCity) onCityChange();
        }
        // If current selection matches, re-render
        if (byId('company-select').value === company){
          // ensure city exists in dropdown
          const citySel = byId('city-select');
          // nothing extra, handled above per type
        }
        closeMiniEditor();
      } catch (e) {
        console.error(e);
        alert('Ошибка при добавлении объекта. Подробности в консоли.');
      }
    });
  }

  function setupHeaderSelectors(){
    populateCompanies(byId('company-select'));
    byId('company-select').addEventListener('change', onCompanyChange);
    byId('city-select').addEventListener('change', onCityChange);

    byId('save-company-data').addEventListener('click', async ()=>{
      // Открываем модальное окно выбора формата
      const modal = document.getElementById('save-format-modal');
      modal.style.display = 'block';
      
      // Обработчик закрытия модального окна
      const closeBtn = modal.querySelector('.close');
      closeBtn.onclick = () => { modal.style.display = 'none'; };
      
      // Закрытие при клике вне окна
      window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };
      
      // Обработчик кнопки подтверждения
      const confirmBtn = document.getElementById('confirm-save-format');
      confirmBtn.onclick = async () => {
        const format = document.querySelector('input[name="save-format"]:checked').value;
        modal.style.display = 'none';
        
        try {
          if (format === 'json') {
            const ok = await CompanyManager.saveCurrentCompanyToFile();
            if (!ok) alert('Ошибка сохранения файла компании');
            else alert('Файл компании сохранен в формате JSON');
          } else if (format === 'geojson') {
            const ok = await CompanyManager.saveCurrentCompanyToGeoJSON();
            if (!ok) alert('Ошибка сохранения файла GeoJSON');
            else alert('Файл сохранен в формате GeoJSON');
          }
        } catch(e){ 
          console.error(e); 
          alert('Ошибка сохранения файла компании'); 
        }
      };
    });

    byId('load-company-file').addEventListener('click', async ()=>{
      try {
        const company = byId('company-select').value;
        if (!company){ alert('Сначала выберите компанию.'); return; }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const txt = await file.text();
          try {
            const data = JSON.parse(txt);
            // Обновляем кэш менеджера и сохраняем в localStorage
            CompanyManager._ensureStructure(data, company);
            CompanyManager.dataCache[company] = data;
            // Пересобираем списки городов
            await CompanyManager.loadCompany(company);
            // Восстановим селектор городов
            await onCompanyChange();
            // Если выбран город — перерисуем
            const city = byId('city-select').value;
            if (city){ onCityChange(); }
            alert('Файл компании загружен');
          } catch(err){ console.error(err); alert('Некорректный JSON файла компании'); }
        };
        input.click();
      } catch(e){ console.error(e); alert('Ошибка загрузки файла компании'); }
    });

    // Не запоминаем последнюю компанию/город — начинать с пустых селекторов

    // Fill mode toggle: show/hide adding tools only
    const fillToggle = byId('fill-mode-toggle');
    const miniEditorBtn = byId('open-mini-editor');
    const editModeBtn = document.getElementById('toggle-edit-mode');
    const miniModal = document.getElementById('mini-editor-modal');
    const applyFillMode = () => {
      const on = fillToggle.checked;
      // Мини-редактор
      miniEditorBtn.style.display = on ? 'block' : 'none';
      if (!on && miniModal && miniModal.style.display === 'block') miniModal.style.display = 'none';
      // Режим рисования
      if (editModeBtn){
        editModeBtn.style.display = on ? 'inline-block' : 'none';
        if (!on && MapModule && MapModule.editMode){
          // выключим редактирование, если активно
          MapModule.toggleEditMode();
        }
      }
    };
    fillToggle.addEventListener('change', applyFillMode);
    applyFillMode();
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Initialize with default company silently
    CompanyManager.init().then(()=>{
      setupHeaderSelectors();
      setupMiniEditor();
    });
  });
})();
