/**
 * Editor UI logic: company/city selectors and mini-editor modal
 */
(function(){
  function byId(id){ return document.getElementById(id); }

  async function populateCompanies(selectEl){
    selectEl.innerHTML = '<option value="">Выберите компанию</option>';
    
    try {
      const response = await ApiModule.getCompanies();
      if (response.success && response.data) {
        response.data.forEach(company => {
          const opt = document.createElement('option');
          opt.value = company.id;
          opt.textContent = company.name;
          selectEl.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Ошибка загрузки компаний:', e);
      // Fallback на CompanyManager если API не работает
      CompanyManager.getCompanies().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c; selectEl.appendChild(opt);
      });
    }
  }

  async function onCompanyChange(){
    const companySelect = byId('company-select');
    const company = companySelect.value;
    if (!company) return;
    
    // Загружаем города из API
    const citySel = byId('city-select');
    citySel.innerHTML = '<option value="">Выберите город</option>';
    
    try {
      const response = await ApiModule.getCities(company);
      if (response.success && response.data) {
        response.data.forEach(city => {
          const opt = document.createElement('option');
          opt.value = city.id;
          opt.textContent = city.name;
          opt.dataset.cityId = city.id;
          citySel.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Ошибка загрузки городов:', e);
    }
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
    const action = document.querySelector('input[name="mini-action"]:checked')?.value || 'create';
    const isCity = type === 'city';
    const isDistrict = type === 'district';
    const isMicro = type === 'microdistrict';
    const isEdit = action === 'edit';
    const isDelete = action === 'delete';
    
    // Проверяем существование элементов
    const nameWrapper = byId('mini-name-wrapper');
    const colorWrapper = byId('mini-color-wrapper');
    const coordsWrapper = byId('mini-coords-wrapper');
    const districtSelectWrapper = byId('mini-district-select-wrapper');
    const selectExistingWrapper = byId('mini-select-existing-wrapper');
    const editFields = byId('mini-edit-fields');
    
    // Показываем выбор существующего объекта для редактирования/удаления
    if (selectExistingWrapper) {
      selectExistingWrapper.style.display = (isEdit || isDelete) ? 'block' : 'none';
    }
    
    // Скрываем поля редактирования при удалении
    if (editFields) {
      editFields.style.display = isDelete ? 'none' : 'block';
    }
    
    // Город: только название, без цвета и координат
    // Район: название, цвет, координаты + выбор города (только при создании)
    // Микрорайон: название, цвет, координаты + выбор города + выбор района (только при создании)
    const citySelectWrapper = byId('mini-city-select-wrapper');
    
    if (nameWrapper) nameWrapper.style.display = 'block';
    if (colorWrapper) colorWrapper.style.display = isCity ? 'none' : 'block';
    if (coordsWrapper) coordsWrapper.style.display = isCity ? 'none' : 'block';
    
    // Показываем селекторы города и района только при создании, при редактировании/удалении используем фильтры
    if (action === 'create') {
      if (citySelectWrapper) citySelectWrapper.style.display = (isDistrict || isMicro) ? 'block' : 'none';
      if (districtSelectWrapper) districtSelectWrapper.style.display = isMicro ? 'block' : 'none';
    } else {
      // При редактировании/удалении скрываем эти поля, используем фильтры
      if (citySelectWrapper) citySelectWrapper.style.display = 'none';
      if (districtSelectWrapper) districtSelectWrapper.style.display = 'none';
    }
  }

  async function openMiniEditor(){
    // Проверяем авторизацию
    if (!ApiModule.isAuthenticated()) {
      // Открываем модальное окно авторизации
      const authModal = byId('auth-modal');
      authModal.style.display = 'block';
      return;
    }
    
    // Показываем кнопку "Выйти"
    const logoutBtn = byId('mini-logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    
    const modal = byId('mini-editor-modal');
    
    // Загружаем компании через API
    try {
      const response = await ApiModule.getCompanies();
      const companySelect = byId('mini-company');
      companySelect.innerHTML = '<option value="">Выберите компанию</option>';
      
      if (response.success && response.data) {
        response.data.forEach(company => {
          const opt = document.createElement('option');
          opt.value = company.id;
          opt.textContent = company.name;
          companySelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Ошибка загрузки компаний:', e);
      alert('Ошибка при загрузке компаний');
      return;
    }
    
    // Очищаем поля
    const nameInput = byId('mini-name');
    if (nameInput) nameInput.value = '';
    const coordsArea = byId('mini-coords');
    if (coordsArea) coordsArea.value = '';
    
    // Обработчик изменения компании - загружаем города
    const loadCitiesForCompany = async () => {
      const companyId = byId('mini-company').value;
      const citySelect = byId('mini-city-select');
      citySelect.innerHTML = '<option value="">Выберите город</option>';
      
      if (!companyId) return;
      
      try {
        const response = await ApiModule.getCities(companyId);
        if (response.success && response.data) {
          response.data.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city.id;
            opt.textContent = city.name;
            citySelect.appendChild(opt);
          });
        }
      } catch (e) {
        console.error('Ошибка загрузки городов:', e);
      }
    };
    
    // Загружаем районы для выбора при создании микрорайона
    const loadDistricts = async () => {
      const dSel = byId('mini-district-select');
      dSel.innerHTML = '<option value="">Выберите район</option>';
      
      try {
        const response = await ApiModule.getDistricts();
        if (response.success && response.data) {
          response.data.forEach(district => {
            const opt = document.createElement('option');
            opt.value = district.id;
            opt.textContent = district.name;
            dSel.appendChild(opt);
          });
        }
      } catch (e) {
        console.error('Ошибка загрузки районов:', e);
      }
    };
    
    await loadCitiesForCompany();
    await loadDistricts();
    
    // Применяем видимость полей по типу
    refreshMiniTypeUI();
    
    // Загружаем список существующих объектов если выбрано редактирование/удаление
    await loadExistingObjects();
    
    modal.style.display = 'block';
  }

  function oldOpenMiniEditor_backup(){
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

    // если выбран город — подгрузим районы через API
    const fillDistricts = async () => {
      const selCity = cityListSel.value;
      const dSel = byId('mini-district-select');
      dSel.innerHTML = '';
      
      try {
        const response = await ApiModule.getDistricts();
        if (response.success && response.data) {
          response.data.forEach(district => {
            const opt = document.createElement('option');
            opt.value = district.id;
            opt.textContent = district.name;
            dSel.appendChild(opt);
          });
        }
      } catch (e) {
        console.error('Ошибка загрузки районов:', e);
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

  // Загрузка списка существующих объектов для редактирования/удаления
  async function loadExistingObjects() {
    const action = document.querySelector('input[name="mini-action"]:checked')?.value;
    const type = document.querySelector('input[name="mini-type"]:checked')?.value;
    const companyId = byId('mini-company').value;
    const selectEl = byId('mini-select-existing');
    
    if (!selectEl || action === 'create' || !companyId) return;
    
    selectEl.innerHTML = '<option value="">Выберите...</option>';
    
    // Показываем/скрываем фильтры
    const filterCityWrapper = byId('mini-filter-city-wrapper');
    const filterDistrictWrapper = byId('mini-filter-district-wrapper');
    
    if (type === 'district' || type === 'microdistrict') {
      // Показываем фильтр города
      filterCityWrapper.style.display = 'block';
      
      // Загружаем города для фильтра
      const filterCitySelect = byId('mini-filter-city');
      filterCitySelect.innerHTML = '<option value="">Все города</option>';
      const cities = await ApiModule.getCities(companyId);
      if (cities.success && cities.data) {
        cities.data.forEach(city => {
          const opt = document.createElement('option');
          opt.value = city.id;
          opt.textContent = city.name;
          filterCitySelect.appendChild(opt);
        });
      }
      
      if (type === 'microdistrict') {
        filterDistrictWrapper.style.display = 'block';
      } else {
        filterDistrictWrapper.style.display = 'none';
      }
    } else {
      filterCityWrapper.style.display = 'none';
      filterDistrictWrapper.style.display = 'none';
    }
    
    // Загружаем объекты с учетом фильтров
    await filterAndLoadObjects();
  }
  
  // Фильтрация и загрузка объектов
  async function filterAndLoadObjects() {
    const action = document.querySelector('input[name="mini-action"]:checked')?.value;
    const type = document.querySelector('input[name="mini-type"]:checked')?.value;
    const companyId = byId('mini-company').value;
    const selectEl = byId('mini-select-existing');
    
    if (!selectEl || action === 'create' || !companyId) return;
    
    selectEl.innerHTML = '<option value="">Выберите...</option>';
    
    const filterCityId = byId('mini-filter-city')?.value;
    const filterDistrictId = byId('mini-filter-district')?.value;
    
    try {
      let response;
      if (type === 'city') {
        response = await ApiModule.getCities(companyId);
      } else if (type === 'district') {
        response = await ApiModule.getDistricts();
        // Фильтруем по компании и городу
        if (response.success && response.data) {
          const cities = await ApiModule.getCities(companyId);
          const cityIds = cities.data.map(c => c.id);
          response.data = response.data.filter(d => cityIds.includes(d.city_id));
          
          // Дополнительная фильтрация по выбранному городу
          if (filterCityId) {
            response.data = response.data.filter(d => d.city_id == filterCityId);
          }
        }
      } else if (type === 'microdistrict') {
        response = await ApiModule.getMicrodistricts();
        // Фильтруем по компании, городу и району
        if (response.success && response.data) {
          const cities = await ApiModule.getCities(companyId);
          const cityIds = cities.data.map(c => c.id);
          const districts = await ApiModule.getDistricts();
          let districtIds = districts.data.filter(d => cityIds.includes(d.city_id)).map(d => d.id);
          
          // Дополнительная фильтрация по выбранному городу
          if (filterCityId) {
            districtIds = districts.data.filter(d => d.city_id == filterCityId).map(d => d.id);
          }
          
          // Дополнительная фильтрация по выбранному району
          if (filterDistrictId) {
            districtIds = districtIds.filter(id => id == filterDistrictId);
          }
          
          response.data = response.data.filter(m => districtIds.includes(m.district_id));
        }
      }
      
      if (response && response.success && response.data) {
        response.data.forEach(obj => {
          const opt = document.createElement('option');
          opt.value = obj.id;
          opt.textContent = obj.name;
          opt.dataset.object = JSON.stringify(obj);
          selectEl.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Ошибка загрузки объектов:', e);
    }
  }
  
  // Загрузка данных объекта для редактирования
  async function loadObjectForEdit() {
    const selectEl = byId('mini-select-existing');
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    
    if (!selectedOption || !selectedOption.dataset.object) return;
    
    const obj = JSON.parse(selectedOption.dataset.object);
    const type = document.querySelector('input[name="mini-type"]:checked')?.value;
    
    // Для района - сначала загружаем город, потом заполняем название
    if (type === 'district' && obj.city_id) {
      byId('mini-city-select').value = obj.city_id;
    }
    
    // Заполняем поля
    byId('mini-name').value = obj.name || '';
    
    if (type !== 'city') {
      byId('mini-color').value = obj.color || '#3388ff';
      
      // Для районов и микрорайонов нужно загрузить координаты из geometry
      if (obj.geometry && obj.geometry.coordinates) {
        const coords = obj.geometry.coordinates[0]; // Polygon coordinates
        const coordsText = coords.map(c => `${c[1]}, ${c[0]}`).join('\n');
        byId('mini-coords').value = coordsText;
      }
    }
    
    // Для микрорайона выбираем район
    if (type === 'microdistrict' && obj.district_id) {
      byId('mini-district-select').value = obj.district_id;
    }
  }

  function setupMiniEditor(){
    // Обработчики переключения типа и действия
    document.querySelectorAll('input[name="mini-type"]').forEach(r => {
      r.addEventListener('change', async () => {
        refreshMiniTypeUI();
        await loadExistingObjects();
      });
    });
    
    document.querySelectorAll('input[name="mini-action"]').forEach(r => {
      r.addEventListener('change', async () => {
        refreshMiniTypeUI();
        await loadExistingObjects();
      });
    });
    
    // Обработчик выбора компании - перезагружаем города и список объектов
    byId('mini-company').addEventListener('change', async () => {
      const companyId = byId('mini-company').value;
      const citySelect = byId('mini-city-select');
      citySelect.innerHTML = '<option value="">Выберите город</option>';
      
      if (companyId) {
        try {
          const response = await ApiModule.getCities(companyId);
          if (response.success && response.data) {
            response.data.forEach(city => {
              const opt = document.createElement('option');
              opt.value = city.id;
              opt.textContent = city.name;
              citySelect.appendChild(opt);
            });
          }
        } catch (e) {
          console.error('Ошибка загрузки городов:', e);
        }
      }
      
      await loadExistingObjects();
    });
    
    // Обработчик выбора существующего объекта для редактирования
    byId('mini-select-existing').addEventListener('change', async () => {
      const action = document.querySelector('input[name="mini-action"]:checked')?.value;
      if (action === 'edit') {
        await loadObjectForEdit();
      }
    });
    
    // Обработчик фильтра по городу - перезагружаем список объектов и районов
    byId('mini-filter-city').addEventListener('change', async () => {
      const type = document.querySelector('input[name="mini-type"]:checked')?.value;
      const cityId = byId('mini-filter-city').value;
      
      // Если выбираем микрорайоны, загружаем районы для фильтра
      if (type === 'microdistrict') {
        const filterDistrictSelect = byId('mini-filter-district');
        filterDistrictSelect.innerHTML = '<option value="">Все районы</option>';
        
        if (cityId) {
          try {
            const response = await ApiModule.getDistricts();
            if (response.success && response.data) {
              const filteredDistricts = response.data.filter(d => d.city_id == cityId);
              filteredDistricts.forEach(district => {
                const opt = document.createElement('option');
                opt.value = district.id;
                opt.textContent = district.name;
                filterDistrictSelect.appendChild(opt);
              });
            }
          } catch (e) {
            console.error('Ошибка загрузки районов:', e);
          }
        }
      }
      
      await filterAndLoadObjects();
    });
    
    // Обработчик фильтра по району - перезагружаем список микрорайонов
    byId('mini-filter-district').addEventListener('change', async () => {
      await filterAndLoadObjects();
    });
    
    // Обработчик выбора города - фильтруем районы для микрорайона
    byId('mini-city-select').addEventListener('change', async () => {
      const cityId = byId('mini-city-select').value;
      const districtSelect = byId('mini-district-select');
      districtSelect.innerHTML = '<option value="">Выберите район</option>';
      
      if (!cityId) return;
      
      try {
        const response = await ApiModule.getDistricts();
        if (response.success && response.data) {
          // Фильтруем районы по выбранному городу
          const filteredDistricts = response.data.filter(d => d.city_id == cityId);
          filteredDistricts.forEach(district => {
            const opt = document.createElement('option');
            opt.value = district.id;
            opt.textContent = district.name;
            districtSelect.appendChild(opt);
          });
        }
      } catch (e) {
        console.error('Ошибка загрузки районов:', e);
      }
    });
    
    refreshMiniTypeUI();

    byId('open-mini-editor').addEventListener('click', openMiniEditor);
    const closes = document.querySelectorAll('.mini-editor-close');
    closes.forEach(c => c.addEventListener('click', closeMiniEditor));

    byId('mini-save').addEventListener('click', async () => {
      const action = document.querySelector('input[name="mini-action"]:checked').value;
      const type = document.querySelector('input[name="mini-type"]:checked').value;
      const companyId = byId('mini-company').value;
      
      if (!companyId) {
        alert('Выберите компанию');
        return;
      }

      try {
        // УДАЛЕНИЕ
        if (action === 'delete') {
          const objectId = byId('mini-select-existing').value;
          if (!objectId) {
            alert('Выберите объект для удаления');
            return;
          }
          
          if (!confirm(`Вы уверены, что хотите удалить этот объект?`)) {
            return;
          }
          
          let response;
          if (type === 'city') {
            response = await ApiModule.deleteCity(objectId);
          } else if (type === 'district') {
            response = await ApiModule.deleteDistrict(objectId);
          } else if (type === 'microdistrict') {
            response = await ApiModule.deleteMicrodistrict(objectId);
          }
          
          if (response && response.success) {
            alert('Объект успешно удален!');
            if (type === 'district' && DistrictsModule) await DistrictsModule.loadDistricts();
            if (type === 'microdistrict' && DistrictsModule) await DistrictsModule.loadMicrodistricts();
            closeMiniEditor();
          } else {
            alert('Ошибка при удалении: ' + (response?.message || 'Неизвестная ошибка'));
          }
          return;
        }
        
        // СОЗДАНИЕ И РЕДАКТИРОВАНИЕ
        const name = byId('mini-name').value.trim();
        if (!name) {
          alert('Введите название');
          return;
        }
        
        const color = byId('mini-color').value || '#3388ff';
        const coordsText = byId('mini-coords').value;
        
        // ГОРОД
        if (type === 'city') {
          if (action === 'create') {
            const response = await ApiModule.createCity({ name, company_id: companyId });
            if (response.success) {
              alert('Город успешно создан!');
              closeMiniEditor();
            } else {
              alert('Ошибка: ' + response.message);
            }
          } else if (action === 'edit') {
            const objectId = byId('mini-select-existing').value;
            if (!objectId) {
              alert('Выберите город для редактирования');
              return;
            }
            const response = await ApiModule.updateCity(objectId, { name });
            if (response.success) {
              alert('Город успешно обновлен!');
              closeMiniEditor();
            } else {
              alert('Ошибка: ' + response.message);
            }
          }
        }
        
        // РАЙОН
        else if (type === 'district') {
          const cityId = byId('mini-city-select').value;
          if (!cityId) {
            alert('Выберите город');
            return;
          }
          if (!coordsText) {
            alert('Введите координаты района');
            return;
          }
          
          const geometry = parseCoordinatesToPolygon(coordsText);
          if (!geometry) {
            alert('Неверный формат координат');
            return;
          }
          
          if (action === 'create') {
            const response = await ApiModule.createDistrict({
              name, city_id: cityId, color, geometry
            });
            if (response.success) {
              alert('Район успешно создан!');
              if (DistrictsModule) await DistrictsModule.loadDistricts();
              closeMiniEditor();
            } else {
              alert('Ошибка: ' + response.message);
            }
          } else if (action === 'edit') {
            const objectId = byId('mini-select-existing').value;
            if (!objectId) {
              alert('Выберите район для редактирования');
              return;
            }
            const response = await ApiModule.updateDistrict(objectId, {
              name, color, geometry
            });
            if (response.success) {
              alert('Район успешно обновлен!');
              if (DistrictsModule) await DistrictsModule.loadDistricts();
              closeMiniEditor();
            } else {
              alert('Ошибка: ' + response.message);
            }
          }
        }
        
        // МИКРОРАЙОН
        else if (type === 'microdistrict') {
          const parentDistrictId = byId('mini-district-select').value;
          if (!parentDistrictId) {
            alert('Выберите район');
            return;
          }
          if (!coordsText) {
            alert('Введите координаты микрорайона');
            return;
          }
          
          const geometry = parseCoordinatesToPolygon(coordsText);
          if (!geometry) {
            alert('Неверный формат координат');
            return;
          }
          
          if (action === 'create') {
            const response = await ApiModule.createMicrodistrict({
              name, district_id: parseInt(parentDistrictId), color, geometry
            });
            if (response.success) {
              alert('Микрорайон успешно создан!');
              if (DistrictsModule) await DistrictsModule.loadMicrodistricts();
              closeMiniEditor();
            } else {
              alert('Ошибка: ' + response.message);
            }
          } else if (action === 'edit') {
            const objectId = byId('mini-select-existing').value;
            if (!objectId) {
              alert('Выберите микрорайон для редактирования');
              return;
            }
            const response = await ApiModule.updateMicrodistrict(objectId, {
              name, color, geometry
            });
            if (response.success) {
              alert('Микрорайон успешно обновлен!');
              if (DistrictsModule) await DistrictsModule.loadMicrodistricts();
              closeMiniEditor();
            } else {
              alert('Ошибка: ' + response.message);
            }
          }
        }
      } catch (e) {
        console.error(e);
        alert('Ошибка: ' + e.message);
      }
    });
  }

  async function setupHeaderSelectors(){
    await populateCompanies(byId('company-select'));
    byId('company-select').addEventListener('change', onCompanyChange);
    byId('city-select').addEventListener('change', onCityChange);

    // Кнопки save-company-data и load-company-file удалены из UI
    const saveBtn = byId('save-company-data');
    if (saveBtn) {
      saveBtn.addEventListener('click', async ()=>{
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
    }

    const loadBtn = byId('load-company-file');
    if (loadBtn) {
      loadBtn.addEventListener('click', async ()=>{
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
    }

    // Не запоминаем последнюю компанию/город — начинать с пустых селекторов

    // Обработчик авторизации
    const authModal = byId('auth-modal');
    const authCloseBtn = authModal.querySelector('.auth-close');
    authCloseBtn.addEventListener('click', () => {
      authModal.style.display = 'none';
    });
    
    byId('auth-login').addEventListener('click', async () => {
      const username = byId('auth-username').value.trim();
      const password = byId('auth-password').value.trim();
      
      if (!username || !password) {
        alert('Введите логин и пароль');
        return;
      }
      
      try {
        const response = await ApiModule.login(username, password);
        if (response.success) {
          alert('Авторизация успешна!');
          authModal.style.display = 'none';
          // Очищаем поля
          byId('auth-username').value = '';
          byId('auth-password').value = '';
          // Открываем мини-редактор
          openMiniEditor();
        } else {
          alert('Ошибка авторизации: ' + response.message);
        }
      } catch (e) {
        console.error('Ошибка авторизации:', e);
        alert('Ошибка при авторизации: ' + e.message);
      }
    });
    
    // Обработчик кнопки "Выйти"
    byId('mini-logout-btn').addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите выйти?')) {
        // Удаляем токен
        localStorage.removeItem('auth_token');
        // Скрываем кнопку "Выйти"
        byId('mini-logout-btn').style.display = 'none';
        // Закрываем мини-редактор
        byId('mini-editor-modal').style.display = 'none';
        // Показываем сообщение
        alert('Вы вышли из системы');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Initialize with default company silently
    CompanyManager.init().then(()=>{
      setupHeaderSelectors();
      setupMiniEditor();
    });
  });
})();
