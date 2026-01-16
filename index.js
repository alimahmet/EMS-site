document.addEventListener('DOMContentLoaded', () => {
  init2GisMap();     // интерактивная карта 2ГИС в блоке
  bindContactScroll();
});

// ===== 2ГИС: обратное геокодирование (нужно твой ключ) =====
function init2GisGeocode() {
const API_KEY = 'a4df93fe-e32f-46fe-8f87-c0f5a4c23c29'; // <-- вставь свой демо-ключ 2ГИС

const contactSection = document.getElementById('contactForm');
const lat = parseFloat(contactSection?.dataset.lat) || 47.0609364728903;
const lon = parseFloat(contactSection?.dataset.lon) || 51.88073062496536;

const titleEl = document.getElementById('contactTitle');
const mapBox  = document.getElementById('mapPlaceholder');
if (!titleEl || !mapBox) return;

// чёрный фон не нужен, карту нарисуем сами
mapBox.style.background = 'transparent';

const url = new URL('https://catalog.api.2gis.ru/3.0/items/geocode');
url.searchParams.set('key', API_KEY);
url.searchParams.set('type', 'street,adm_div.district,adm_div.city,adm_div.place,station_platform,attraction,building');
url.searchParams.set('fields', 'items.point,items.region_id,items.segment_id');
url.searchParams.set('locale', 'ru_KZ');
url.searchParams.set('lon', String(lon));
url.searchParams.set('lat', String(lat));

fetch(url.toString())
  .then(r => {
    if (!r.ok) throw new Error('2GIS API error ' + r.status);
    return r.json();
  })
  .then(data => {
    const items = data?.result?.items || data?.items || [];
    const place = items[0] || {};
    const name = place.full_name || place.address_name || place.name || '';
    const adm = Array.isArray(place.adm_divs) ? place.adm_divs.map(d => d.name).filter(Boolean).join(', ') : '';
    const readable = [name, adm].filter(Boolean).join(' — ') || 'Адрес не найден';

    // адрес под заголовком
    const addrP = document.createElement('p');
    addrP.className = 'contact-address';
    addrP.textContent = `📍 ${readable}`;
    titleEl.insertAdjacentElement('afterend', addrP);

    // кнопка "Открыть в 2ГИС"
    mapBox.insertAdjacentHTML(
      'afterbegin',
      `<a href="https://2gis.kz/?m=${lon}%2C${lat}%2F17.0" target="_blank" rel="noopener" class="open-2gis-link" style="display:inline-block;margin-bottom:10px;">
         Открыть в 2ГИС
       </a>`
    );
  })
  .catch(() => {
    // если адрес не подтянулся — просто не пишем его, карта всё равно будет
    const mapBox  = document.getElementById('mapPlaceholder');
    mapBox.insertAdjacentHTML('afterbegin','<p style="margin-bottom:10px;">Адрес не получен из 2ГИС.</p>');
  });

// синхронизируем href телефона с текстом (чтобы клики были корректные)
const phoneEl = document.querySelector('.phone-large');
if (phoneEl && phoneEl.textContent) {
  const digits = phoneEl.textContent.replace(/[^\d+]/g, '');
  phoneEl.setAttribute('href', `tel:${digits}`);
}
}

// ===== 2ГИС карта внутри блока (без Leaflet/OSM) =====
function init2GisMap() {
const contactSection = document.getElementById('contactForm');
const lat = parseFloat(contactSection?.dataset.lat) || 47.0609364728903;
const lon = parseFloat(contactSection?.dataset.lon) || 51.88073062496536;

const el = document.getElementById('mapPlaceholder');
if (!el) return;

// на всякий: обеспечим высоту
if (!el.style.height) el.style.height = '300px';

// ждём загрузки 2ГИС SDK (loader.js)
DG.then(function () {
  // чистим контейнер от заглушек
  el.innerHTML = '';

  const map = DG.map(el, {
    center: [lat, lon],
    zoom: 17,
    // если когда-то понадобится указать ключ именно для карт — добавишь:
    // key: 'YOUR_REAL_2GIS_KEY'
  });

  DG.marker([lat, lon]).addTo(map).bindPopup('Мы здесь');
});
}

// ===== плавный скролл к форме =====
function bindContactScroll() {
  const contactForm = document.getElementById('contactForm');

  // Если формы нет (например, на about.html) — НЕ перехватываем клики,
  // чтобы ссылка href="index.html#contactForm" работала.
  if (!contactForm) return;

  const go = (e) => {
    e?.preventDefault?.();
    contactForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  document.getElementById('contactBtn')?.addEventListener('click', go);
  document.getElementById('contactBtn2')?.addEventListener('click', go);
}

// === Отправка формы в Google Sheets ===
const submitBtn = document.querySelector('.btn-submit');
if (submitBtn) {
  submitBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    const form = document.querySelector('#contactForm form');
    const name = form.querySelector('[name="name"]').value.trim();
    const company = form.querySelector('[name="company"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    const url = 'https://script.google.com/macros/s/AKfycbxsc4-LRWrxYYi_yl-yth-JVOb8OLLHIwPzuVojlzZLBtR3lPMTeys88v9oMev8M6M/exec';

    const dataObject = {
      'ФИО': name,
      'Компания': company,
      'Номер': phone,
      'Почта': email,
      'Сообщение': message
    };

    try {
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(dataObject),
        headers: { 'Content-Type': 'text/plain' },
        mode: 'no-cors'
      });

      alert('Сообщение отправлено!');
      form.reset();

    } catch (err) {
      alert('Ошибка при отправке. Попробуйте ещё раз.');
      console.error('Fetch error:', err);
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("contactModal");
  const overlay = document.getElementById("contactModalOverlay");
  const closeBtn = document.getElementById("contactModalClose");

  const contactBtn = document.getElementById("contactBtn");
  const requestBtn = document.getElementById("requestBtn");

  const openModal = () => {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (contactBtn) contactBtn.addEventListener("click", openModal);
  if (requestBtn) requestBtn.addEventListener("click", openModal);

  if (overlay) overlay.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});
document.addEventListener("DOMContentLoaded", () => {
  if (location.hash === "#contactForm") {
    const el = document.getElementById("contactForm");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  const faqModal = document.getElementById("faqModal");
  const faqOverlay = document.getElementById("faqModalOverlay");
  const faqClose = document.getElementById("faqModalClose");
  const faqTitle = document.getElementById("faqModalTitle");
  const faqBody = document.getElementById("faqModalBody");

  const hasFaqModal = faqModal && faqOverlay && faqClose && faqTitle && faqBody;

  const openFaqModal = (title, body) => {
    faqTitle.textContent = title || "";
    faqBody.textContent = body || "";
    faqModal.classList.add("is-open");
    faqModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeFaqModal = () => {
    faqModal.classList.remove("is-open");
    faqModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (hasFaqModal) {
    items.forEach((item) => {
      const q = item.querySelector(".faq-question");
      const qText = item.querySelector("[data-i18n$='.question']") || item.querySelector(".faq-question span");
      const aText = item.querySelector("[data-i18n$='.answer']") || item.querySelector(".faq-answer p");
      if (!q || !qText || !aText) return;

      q.addEventListener("click", () => {
        openFaqModal(qText.textContent.trim(), aText.textContent.trim());
      });
    });

    faqOverlay.addEventListener("click", closeFaqModal);
    faqClose.addEventListener("click", closeFaqModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFaqModal();
    });

    return;
  }

  // Если модалки нет — оставляем accordion
  items.forEach((item) => {
    const q = item.querySelector(".faq-question");
    if (!q) return;

    q.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      items.forEach((i) => i.classList.remove("active"));
      if (!isActive) item.classList.add("active");
    });
  });
});


// ===== NAV FIX (ТОЛЬКО ЭТО ИЗМЕНЕНО): active по URL + label по активной ссылке =====
(function () {
  function currentFile() {
    // '/path/about.html' -> 'about.html', '/' -> 'index.html'
    const file = (location.pathname || "").split("/").filter(Boolean).pop() || "";
    return file || "index.html";
  }

  function fileFromHref(href) {
    if (!href) return "";
    const clean = href.split("#")[0].split("?")[0];
    const file = clean.split("/").filter(Boolean).pop() || "";
    return file || "index.html";
  }

  function setActiveNavByUrl() {
    const links = document.querySelectorAll(".nav-links a.nav-link");
    if (!links.length) return;

    const cur = currentFile();

    links.forEach((a) => {
      const target = fileFromHref(a.getAttribute("href"));
      a.classList.toggle("active", target === cur);
    });
  }

  function syncNavDropdownLabel() {
    const label = document.querySelector(".nav-dd__label");
    if (!label) return;

    const activeLink = document.querySelector(".nav-links a.nav-link.active");
    if (activeLink && activeLink.textContent.trim()) {
      label.textContent = activeLink.textContent.trim();
      return;
    }

    label.textContent = label.getAttribute("data-fallback") || "Страницы";
  }

  function closeDropdownOnClick() {
    // закрываем dropdown после выбора ссылки (если checkbox-версия)
    const toggle = document.querySelector(".nav-dd__toggle");
    if (!toggle) return;

    document.querySelectorAll(".nav-links a.nav-link").forEach((a) => {
      a.addEventListener("click", () => {
        toggle.checked = false;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNavByUrl();
    syncNavDropdownLabel();
    closeDropdownOnClick();
  });

  // После переключения языка тексты ссылок меняются — обновляем label
  document.addEventListener("langChanged", () => {
    // active не меняем, только текст label (он берётся из active ссылки)
    syncNavDropdownLabel();
  });
})();
