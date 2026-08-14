/**
 * Логика приложения "Известные люди V"
 */

document.addEventListener('DOMContentLoaded', () => {
  // Элементы интерфейса
  const homeView = document.getElementById('homeView');
  const characterView = document.getElementById('characterView');
  const charactersGrid = document.getElementById('charactersGrid');
  const sortFilterSelect = document.getElementById('sortFilterSelect');
  
  // Элементы детального просмотра
  const detailPhoto = document.getElementById('detailPhoto');
  const detailNameSide = document.getElementById('detailNameSide');
  const detailRole = document.getElementById('detailRole');
  const detailNameMain = document.getElementById('detailNameMain');
  const detailBio = document.getElementById('detailBio');
  const detailStatusWrap = document.getElementById('detailStatusWrap');
  const backBtn = document.getElementById('backBtn');
  const logoLink = document.getElementById('logoLink');

  // Элементы модального окна
  const helpBtn = document.getElementById('helpBtn');
  const infoModal = document.getElementById('infoModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalOkBtn = document.getElementById('modalOkBtn');

  // Элементы музыки
  const bgAudio = document.getElementById('bgAudio');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const iconMusicOn = musicToggleBtn.querySelector('.icon-music-on');
  const iconMusicOff = musicToggleBtn.querySelector('.icon-music-off');

  // Элементы фонового слайдера и кнопки статичного фона
  const bgSlider = document.getElementById('bgSlider');
  const bgSlideA = document.getElementById('bgSlideA');
  const bgSlideB = document.getElementById('bgSlideB');
  const bgToggleBtn = document.getElementById('bgToggleBtn');
  const iconBgDynamic = bgToggleBtn ? bgToggleBtn.querySelector('.icon-bg-dynamic') : null;
  const iconBgStatic = bgToggleBtn ? bgToggleBtn.querySelector('.icon-bg-static') : null;

  // Элементы цитат в шапке
  const headerQuoteText = document.getElementById('headerQuoteText');
  const headerQuoteContainer = document.getElementById('headerQuoteContainer');

  // Дефолтное изображение, если картинка персонажа не загрузилась
  const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80';

  // Ключ для сохранения настройки сортировки в LocalStorage
  const SORT_STORAGE_KEY = 'famous_people_sort_option';

  /* =========================================================
     1. Логика фоновой музыки (Автовоспроизведение и Пауза/Возобновление)
     ========================================================= */
  let isMusicPlaying = false;

  if (typeof BACKGROUND_MUSIC !== 'undefined' && BACKGROUND_MUSIC.trim() !== '') {
    bgAudio.src = BACKGROUND_MUSIC;
  }

  function updateMusicButtonUI(isPlaying) {
    if (isPlaying) {
      musicToggleBtn.classList.add('playing');
      musicToggleBtn.classList.remove('paused');
      iconMusicOn.classList.remove('hidden-icon');
      iconMusicOff.classList.add('hidden-icon');
      musicToggleBtn.setAttribute('title', 'Поставить музыку на паузу');
    } else {
      musicToggleBtn.classList.remove('playing');
      musicToggleBtn.classList.add('paused');
      iconMusicOn.classList.add('hidden-icon');
      iconMusicOff.classList.remove('hidden-icon');
      musicToggleBtn.setAttribute('title', 'Включить музыку');
    }
  }

  function attemptPlayMusic() {
    if (!bgAudio.src) return;
    
    bgAudio.play()
      .then(() => {
        isMusicPlaying = true;
        updateMusicButtonUI(true);
      })
      .catch(() => {
        isMusicPlaying = false;
        updateMusicButtonUI(false);
        
        const onFirstInteraction = () => {
          if (!isMusicPlaying) {
            bgAudio.play().then(() => {
              isMusicPlaying = true;
              updateMusicButtonUI(true);
            }).catch(() => {});
          }
          document.removeEventListener('click', onFirstInteraction);
        };
        document.addEventListener('click', onFirstInteraction, { once: true });
      });
  }

  musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!bgAudio.src) return;

    if (bgAudio.paused) {
      bgAudio.play().then(() => {
        isMusicPlaying = true;
        updateMusicButtonUI(true);
      }).catch(err => console.log('Audio playback prevented:', err));
    } else {
      bgAudio.pause();
      isMusicPlaying = false;
      updateMusicButtonUI(false);
    }
  });

  attemptPlayMusic();

  /* =========================================================
     2. Фоновые изображения (7 сек) + Кнопка Статичного Фона
     ========================================================= */
  let currentBgIndex = 0;
  let activeSlide = bgSlideA;
  let inactiveSlide = bgSlideB;
  let bgTimer = null;
  let isBgStatic = false;

  const bgList = (typeof BACKGROUND_IMAGES !== 'undefined' && Array.isArray(BACKGROUND_IMAGES) && BACKGROUND_IMAGES.length > 0)
    ? BACKGROUND_IMAGES
    : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80'];

  function setSlideBackground(slideElement, url) {
    slideElement.style.backgroundImage = `url("${url}")`;
  }

  function stepBackground() {
    if (bgList.length <= 1) return;

    currentBgIndex = (currentBgIndex + 1) % bgList.length;
    const nextImageUrl = bgList[currentBgIndex];

    setSlideBackground(inactiveSlide, nextImageUrl);

    inactiveSlide.classList.add('active');
    activeSlide.classList.remove('active');

    const temp = activeSlide;
    activeSlide = inactiveSlide;
    inactiveSlide = temp;
  }

  function startBgTimer() {
    if (bgTimer) clearInterval(bgTimer);
    if (bgList.length > 1) {
      bgTimer = setInterval(stepBackground, 7000);
    }
  }

  function stopBgTimer() {
    if (bgTimer) {
      clearInterval(bgTimer);
      bgTimer = null;
    }
  }

  function updateBgButtonUI(isStatic) {
    if (!bgToggleBtn) return;
    if (isStatic) {
      bgToggleBtn.classList.add('static-active');
      if (iconBgDynamic) iconBgDynamic.classList.add('hidden-icon');
      if (iconBgStatic) iconBgStatic.classList.remove('hidden-icon');
      bgToggleBtn.setAttribute('title', 'Возобновить смену фона');
      bgSlider.classList.add('frozen');
    } else {
      bgToggleBtn.classList.remove('static-active');
      if (iconBgDynamic) iconBgDynamic.classList.remove('hidden-icon');
      if (iconBgStatic) iconBgStatic.classList.add('hidden-icon');
      bgToggleBtn.setAttribute('title', 'Сделать фон статичным');
      bgSlider.classList.remove('frozen');
    }
  }

  if (bgToggleBtn) {
    bgToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isBgStatic = !isBgStatic;
      if (isBgStatic) {
        stopBgTimer();
      } else {
        startBgTimer();
      }
      updateBgButtonUI(isBgStatic);
    });
  }

  function initBackgroundSlider() {
    setSlideBackground(activeSlide, bgList[0]);
    activeSlide.classList.add('active');
    inactiveSlide.classList.remove('active');
    startBgTimer();
  }

  initBackgroundSlider();

  /* =========================================================
     3. Умная ротация цитат в шапке (каждые 5 сек, без повторов подряд)
     ========================================================= */
  let quoteTimer = null;
  let quotePool = [];
  let lastQuoteIndex = -1;

  const quoteList = (typeof SITE_QUOTES !== 'undefined' && Array.isArray(SITE_QUOTES) && SITE_QUOTES.length > 0)
    ? SITE_QUOTES
    : [
        "«Я смог и вы сможете.» — Григорий",
        "«Я стал тем, кем даже не мечтал быть...» — Мопс Мопсович",
        "«Главное это деньги и люди. Шучу, не люди.» — Барон ДеШон",
        "«Быть умным не значит быть впереди всех.» — Прокофий"
      ];

  // Создаем колоду (shuffle bag) со случайным порядком, исключая повторы на стыке колод
  function refillQuoteBag() {
    const indices = Array.from({ length: quoteList.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Если первая цитата новой колоды совпадает с последней цитатой предыдущей колоды, меняем её
    if (indices.length > 1 && indices[0] === lastQuoteIndex) {
      const swapIndex = Math.floor(Math.random() * (indices.length - 1)) + 1;
      [indices[0], indices[swapIndex]] = [indices[swapIndex], indices[0]];
    }

    quotePool = indices;
  }

  function getNextQuote() {
    if (quoteList.length === 0) return '';
    if (quoteList.length === 1) return quoteList[0];

    if (quotePool.length === 0) {
      refillQuoteBag();
    }

    const nextIndex = quotePool.shift();
    lastQuoteIndex = nextIndex;
    return quoteList[nextIndex];
  }

  function updateQuoteSmoothly() {
    if (!headerQuoteText || quoteList.length === 0) return;

    // Плавно растворяем текущую цитату
    headerQuoteText.classList.remove('fade-in');
    headerQuoteText.classList.add('fade-out');

    // Через время анимации исчезновения меняем текст и плавно проявляем
    setTimeout(() => {
      const nextQuote = getNextQuote();
      headerQuoteText.textContent = nextQuote;
      if (headerQuoteContainer) {
        headerQuoteContainer.setAttribute('title', nextQuote);
      }
      headerQuoteText.classList.remove('fade-out');
      headerQuoteText.classList.add('fade-in');
    }, 450);
  }

  function initQuoteRotator() {
    if (!headerQuoteText || quoteList.length === 0) {
      if (headerQuoteContainer) headerQuoteContainer.style.display = 'none';
      return;
    }

    // Показываем первую случайную цитату
    const firstQuote = getNextQuote();
    headerQuoteText.textContent = firstQuote;
    if (headerQuoteContainer) {
      headerQuoteContainer.setAttribute('title', firstQuote);
    }
    headerQuoteText.classList.add('fade-in');

    // Каждые 5 секунд меняем цитату
    if (quoteList.length > 1) {
      quoteTimer = setInterval(updateQuoteSmoothly, 5000);
    }
  }

  initQuoteRotator();

  /* =========================================================
     4. Сортировка, фильтрация и отрисовка карточек персонажей
     ========================================================= */
  function isCharacterAlive(char) {
    if (char.status === undefined || char.status === null) return true;
    if (typeof char.status === 'boolean') return char.status;
    const str = String(char.status).trim().toLowerCase();
    return str === 'alive' || str === 'жив' || str === 'true' || str === '1';
  }

  function getProcessedCharacters(sortOption) {
    if (!Array.isArray(CHARACTERS)) return [];

    let result = [...CHARACTERS];

    switch (sortOption) {
      case 'alive':
        // Только живые
        result = result.filter(c => isCharacterAlive(c));
        break;

      case 'dead':
        // Только мертвые
        result = result.filter(c => !isCharacterAlive(c));
        break;

      case 'alphabetical':
        // По алфавиту (русский/английский)
        result.sort((a, b) => {
          const nameA = (a.name || '').trim();
          const nameB = (b.name || '').trim();
          return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
        });
        break;

      case 'default':
      default:
        // Стандартная (порядок как в data.js)
        break;
    }

    return result;
  }

  function renderCharacterCards() {
    const currentSort = sortFilterSelect ? sortFilterSelect.value : 'default';
    const displayList = getProcessedCharacters(currentSort);

    charactersGrid.innerHTML = '';

    if (displayList.length === 0) {
      charactersGrid.innerHTML = `
        <div class="empty-state">
          <p>Персонажи по выбранному фильтру не найдены.</p>
        </div>
      `;
      return;
    }

    displayList.forEach(char => {
      const card = document.createElement('a');
      card.className = 'character-card';
      card.href = `#/${char.id}`;
      
      const photoUrl = char.photo && char.photo.trim() !== '' ? char.photo : DEFAULT_PHOTO;
      const alive = isCharacterAlive(char);
      const statusClass = alive ? 'alive' : 'dead';
      const statusTooltip = alive ? 'Статус: Жив' : 'Статус: Мертв';

      card.innerHTML = `
        <div class="card-img-container">
          <img class="card-img" src="${photoUrl}" alt="${char.name}" loading="lazy" onerror="this.onerror=null;this.src='${DEFAULT_PHOTO}';">
        </div>
        <div class="card-content">
          <div class="card-name-row">
            <h3 class="card-name">${char.name}</h3>
            <span class="status-dot ${statusClass}" title="${statusTooltip}"></span>
          </div>
          ${char.role ? `<span class="card-role">${char.role}</span>` : ''}
          <span class="card-arrow">
            Подробнее 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      `;

      card.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToCharacter(char.id);
      });

      charactersGrid.appendChild(card);
    });
  }

  // Инициализация сортировки с сохранением в localStorage
  function initSortControls() {
    if (!sortFilterSelect) return;

    // Восстанавливаем сохраненное значение или ставим default
    const savedSort = localStorage.getItem(SORT_STORAGE_KEY) || 'default';
    sortFilterSelect.value = savedSort;

    sortFilterSelect.addEventListener('change', () => {
      const selectedValue = sortFilterSelect.value;
      localStorage.setItem(SORT_STORAGE_KEY, selectedValue);
      renderCharacterCards();
    });
  }

  /* =========================================================
     5. Переход к детальному просмотру персонажа
     ========================================================= */
  function showCharacterDetails(characterId) {
    const char = CHARACTERS.find(c => String(c.id) === String(characterId));
    
    if (!char) {
      navigateToHome();
      return;
    }

    const photoUrl = char.photo && char.photo.trim() !== '' ? char.photo : DEFAULT_PHOTO;
    detailPhoto.src = photoUrl;
    detailPhoto.alt = char.name;
    detailPhoto.onerror = () => {
      detailPhoto.src = DEFAULT_PHOTO;
    };

    detailNameSide.textContent = char.name;
    detailNameMain.textContent = char.name;
    
    if (char.role && char.role.trim() !== '') {
      detailRole.textContent = char.role;
      detailRole.style.display = 'inline-block';
    } else {
      detailRole.style.display = 'none';
    }

    detailBio.innerHTML = char.bio || '<p>Биография пока не заполнена.</p>';

    // Блок статуса жизни внизу биографии
    const alive = isCharacterAlive(char);
    const statusText = alive ? 'Жив' : 'Мертв';
    const statusClass = alive ? 'alive' : 'dead';

    detailStatusWrap.innerHTML = `
      <div class="status-badge-detailed ${statusClass}">
        <span class="status-dot ${statusClass}"></span>
        <span>${statusText}</span>
      </div>
    `;

    homeView.classList.add('hidden-view');
    homeView.classList.remove('active-view');
    
    characterView.classList.remove('hidden-view');
    characterView.classList.add('active-view');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${char.name} — Известные люди V`;
  }

  function navigateToHome() {
    window.location.hash = '#/';
    characterView.classList.add('hidden-view');
    characterView.classList.remove('active-view');
    
    homeView.classList.remove('hidden-view');
    homeView.classList.add('active-view');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Известные люди V — База знаний';
  }

  function navigateToCharacter(id) {
    window.location.hash = `#/${id}`;
    showCharacterDetails(id);
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('/')) {
      const param = hash.slice(1);
      if (param && param !== '') {
        showCharacterDetails(param);
        return;
      }
    }
    navigateToHome();
  }

  backBtn.addEventListener('click', navigateToHome);
  logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToHome();
  });

  window.addEventListener('hashchange', handleRoute);

  /* =========================================================
     6. Модальное окно информации (Кнопка ?)
     ========================================================= */
  function openModal() {
    infoModal.classList.add('open');
    infoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    infoModal.classList.remove('open');
    infoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  helpBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  modalOkBtn.addEventListener('click', closeModal);
  
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && infoModal.classList.contains('open')) {
      closeModal();
    }
  });

  // Первоначальный рендер
  initSortControls();
  renderCharacterCards();
  handleRoute();
});
