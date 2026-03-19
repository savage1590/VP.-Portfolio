/**
 * UI Translations Object
 */
const translations = {
    ua: {
        nav_home: "Головна",
        nav_portfolio: "Портфоліо",
        nav_about: "Про мене",
        nav_contacts: "Контакти",
        hero_title: "Владислав Проценко",
        hero_subtitle: "Graphic Designer",
        hero_subtitle_2: "AI Creator",
        btn_work: "Дивитись роботи",
        btn_contact: "Зв'язатися",
        portfolio_title: "Портфоліо",
        portfolio_desc: "Натисніть на категорію, щоб відфільтрувати проєкти",
        filter_all: "Всі",
        filter_pack: "Дизайн пакування",
        filter_print: "Дизайн друкованої продукції",
        filter_web_banner: "Веб-банери",
        filter_large_banner: "Широкоформатні банери",
        filter_instagram: "Візуал Instagram",
        filter_logo: "Логотипи",
        filter_illustration: "Ілюстрації",
        filter_clothing: "Принти для одягу",
        filter_ai_photo: "AI фотосесії",
        filter_ai_video: "AI відео-креативи",
        filter_ai_image: "Іміджеві AI відео",
        empty_portfolio: "Проєкти в даній категорії скоро з'являться...",
        about_title: "Про мене",
        about_text_1: "Мене звати <strong>Владислав</strong>, я - професійний графічний дизайнер та AI-кріейтор",
        about_text_2: "Мій профіль — це симбіоз передових нейромережевих технологій з класичними принципами дизайну. Я створюю візуальні концепції, які не тільки виглядають стильно, але й виділяють бренди на тлі конкурентів.",
        stat_years: "Років досвіду",
        stat_projects: "Проєктів",
        stat_expert: "Експерт",
        skills_title: "Інструменти & Технології",
        skills_design: "Графічні редактори",
        skills_ai: "AI Інструменти",
        contacts_title: "Зв'язатися зі мною",
        contacts_desc: "Відкритий до нових проєктів та співпраці",
        contact_social: "Соцмережі & Месенджери",
        contact_write: "Написати мені",
        form_name: "Ваше ім'я",
        form_email: "Ваш Email",
        form_msg: "Повідомлення",
        form_msg_placeholder: "Опишіть завдання...",
        form_submit: "Відправити заявку"
    },
    en: {
        nav_home: "Home",
        nav_portfolio: "Portfolio",
        nav_about: "About",
        nav_contacts: "Contacts",
        hero_title: "Vladislav Protsenko",
        hero_subtitle: "Graphic Designer",
        hero_subtitle_2: "AI Creator",
        btn_work: "View Work",
        btn_contact: "Contact Me",
        portfolio_title: "Portfolio",
        portfolio_desc: "Click on a category to filter projects",
        filter_all: "All",
        filter_pack: "Packaging Design",
        filter_print: "Print Design",
        filter_web_banner: "Web Banners",
        filter_large_banner: "Large Format Banners",
        filter_instagram: "Instagram Visuals",
        filter_logo: "Logos",
        filter_illustration: "Illustrations",
        filter_clothing: "Apparel Prints",
        filter_ai_photo: "AI Photoshoots",
        filter_ai_video: "AI Video Creatives",
        filter_ai_image: "AI Brand Videos",
        empty_portfolio: "Projects in this category are coming soon...",
        about_title: "About Me",
        about_text_1: "My name is <strong>Vladislav</strong>, I am a professional graphic designer and AI creator.",
        about_text_2: "My profile is a synthesis of advanced neural network technologies with classic design principles. I create visual concepts that not only look stylish but also make brands stand out from the competition.",
        stat_years: "Years Experience",
        stat_projects: "Projects",
        stat_expert: "Expert",
        skills_title: "Tools & Technologies",
        skills_design: "Graphic Design",
        skills_ai: "AI Tools",
        contacts_title: "Contact Me",
        contacts_desc: "Open to new projects and cooperation",
        contact_social: "Social & Messengers",
        contact_write: "Write a Message",
        form_name: "Your Name",
        form_email: "Your Email",
        form_msg: "Message",
        form_msg_placeholder: "Describe your project...",
        form_submit: "Send Request"
    }
};

let currentLang = 'ua';

/**
 * Translations Applier
 */
function applyTranslations(lang) {
    const texts = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            if (el.tagName.toLowerCase() !== 'input' && el.tagName.toLowerCase() !== 'textarea') {
                el.innerHTML = texts[key];
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) {
            el.placeholder = texts[key];
        }
    });

    // Re-render portfolio fully to apply translations to titles & categories inside cards
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    if (activeFilterBtn) {
        const activeFilter = activeFilterBtn.getAttribute('data-filter');
        renderPortfolio(activeFilter === 'all' ? portfolioData : portfolioData.filter(i => i.category === activeFilter), false);
    }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLang = btn.getAttribute('data-lang');
        applyTranslations(currentLang);
    });
});

/**
 * Custom Cursor Logic
 */
const cursor = document.querySelector('.custom-cursor');
const follower = document.querySelector('.custom-cursor-follower');
let posX = 0, posY = 0;
let mouseX = 0, mouseY = 0;

let addHoverListeners = () => { };

if (window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    });

    function animateFollower() {
        posX += (mouseX - posX) / 5;
        posY += (mouseY - posY) / 5;

        follower.style.left = `${posX}px`;
        follower.style.top = `${posY}px`;

        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    addHoverListeners = () => {
        const interactables = document.querySelectorAll('a, button, input, textarea, .portfolio-item, .modal-close, .carousel-btn, .dot, .lang-btn');
        interactables.forEach(el => {
            el.removeEventListener('mouseenter', window.onMouseEnterGlobal);
            el.removeEventListener('mouseleave', window.onMouseLeaveGlobal);

            el.addEventListener('mouseenter', window.onMouseEnterGlobal);
            el.addEventListener('mouseleave', window.onMouseLeaveGlobal);
        });
    };

    window.onMouseEnterGlobal = function (e) {
        document.body.classList.add('cursor-hover');
        if (e.currentTarget && e.currentTarget.querySelector && e.currentTarget.querySelector('video')) {
            document.body.classList.add('cursor-video');
        }
    };

    window.onMouseLeaveGlobal = function () {
        document.body.classList.remove('cursor-hover');
        document.body.classList.remove('cursor-video');
    };

    addHoverListeners();
}

/**
 * Header Scroll & Active Links effect
 */
const header = document.querySelector('.header');
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

/**
 * Mobile Navigation Menu
 */
const burger = document.querySelector('.burger-menu');
const nav = document.querySelector('.nav');

burger.addEventListener('click', () => {
    nav.classList.toggle('active');
    burger.classList.toggle('active');
    document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        burger.classList.remove('active');
        document.body.style.overflow = '';
    });
});

/**
 * Reveal Animations on Scroll
 */
const revealElements = document.querySelectorAll('.reveal-element');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
};

const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach(el => {
    revealObserver.observe(el);
});

// Trigger immediately for what is inside viewport at load
setTimeout(() => {
    revealElements.forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('active');
        }
    });
}, 100);

/**
 * Project Modal Logic
 */
const modal = document.getElementById('projectModal');
const modalClose = document.querySelector('.modal-close');
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');
const prevBtn = document.getElementById('carouselPrev');
const nextBtn = document.getElementById('carouselNext');
const modalContactBtn = document.getElementById('modalContactBtn');

let currentSlideIndex = 0;
let slideCount = 0;

function openModal(item) {
    document.getElementById('modalCategory').textContent = item.catName[currentLang];
    document.getElementById('modalTitle').textContent = item.title[currentLang];
    document.getElementById('modalDesc').innerHTML = item.description[currentLang] || '';

    carouselTrack.innerHTML = '';
    carouselDots.innerHTML = '';
    currentSlideIndex = 0;

    if (item.images && item.images.length > 0) {
        slideCount = item.images.length;
        item.images.forEach((src, idx) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            let media = '';

            if (src.endsWith('.mp4') || src.includes('video')) {
                media = `<video loop autoplay muted playsinline src="${src}"></video>`;
            } else {
                media = `<img src="${src}" alt="Slide ${idx + 1}">`;
            }
            slide.innerHTML = media;
            carouselTrack.appendChild(slide);

            const dot = document.createElement('button');
            dot.className = `dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
            dot.addEventListener('click', () => goToSlide(idx));
            carouselDots.appendChild(dot);
        });

        if (slideCount > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            carouselDots.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            carouselDots.style.display = 'none';
        }
    } else {
        // Fallback or empty state
        carouselTrack.innerHTML = `<div class="carousel-slide"><img src="${item.preview}" alt="Missing images"></div>`;
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        carouselDots.style.display = 'none';
    }

    updateCarousel();

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    addHoverListeners(); // Rebind custom cursors for the modal buttons
}

function updateCarousel() {
    carouselTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlideIndex);
    });
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateCarousel();
}

prevBtn.addEventListener('click', () => {
    currentSlideIndex = (currentSlideIndex > 0) ? currentSlideIndex - 1 : slideCount - 1;
    updateCarousel();
});

nextBtn.addEventListener('click', () => {
    currentSlideIndex = (currentSlideIndex < slideCount - 1) ? currentSlideIndex + 1 : 0;
    updateCarousel();
});

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
        // Clear track so videos stop playing
        carouselTrack.innerHTML = '';
    }, 400);
}

modalClose.addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
modalContactBtn.addEventListener('click', closeModal);

/**
 * Portfolio Data & Filtering Logic
 * -------------------------------------------------------------
 * ІНСТРУКЦІЯ (ЯК ЗАМІНИТИ ДАНІ НА ВЛАСНІ):
 * 1. Знайдіть поле `preview` - воно відповідає за обкладинку в сітці.
 *    Замініть URL на свій: preview: 'шлях/до/моєї-картинки-обкладинки.jpg'
 * 2. Знайдіть поле `images` - це масив зображень для каруселі в модалці.
 *    Замініть його на свої: images: ['шлях/картинка1.jpg', 'шлях/картинка2.jpg']
 *    Якщо це відео-категорія, можна вставити '.mp4' файл.
 * -------------------------------------------------------------
 */
const portfolioData = [
    {
        id: 'pack-1',
        title: { ua: 'Ювелірне пакування "TSATSKY"', en: '"TSATSKY" Jewelry Packaging' },
        category: 'pack',
        catName: { ua: 'Дизайн пакування', en: 'Packaging Design' },
        type: 'image',
        description: {
            ua: 'Дизайн пакування трикутної форми для компанії TSATSKY.',
            en: 'Design of premium holographic triangular packaging for the Kharkiv jewelry factory TSATSKY.'
        },
        preview: 'projects/jewelry package/Two_triangular_packages_202603191409.webp',
        images: [
            'projects/jewelry package/Two_triangular_packages_202603191409.webp',
            'projects/jewelry package/Action-shot_CGI_of_202603191410.webp',
            'projects/jewelry package/High-end_professional_product_202603191410 (1).webp',
            'projects/jewelry package/Minimalist_jewelry_packaging_202603191410.webp',
            'projects/jewelry package/Surreal_CGI_of_202603191410.webp',
            'projects/jewelry package/Ultra-realistic_shot_of_202603191409.webp'
        ]
    },
    {
        id: 'print-1',
        title: { ua: 'Брендбук для IT-компанії', en: 'IT Company BrandBook' },
        category: 'print',
        catName: { ua: 'Дизайн друкованої продукції', en: 'Print Design' },
        type: 'image',
        description: {
            ua: 'Дизайн поліграфії та загальний гайдлайн компанії.',
            en: 'Print design and general brand guideline for the company.'
        },
        preview: 'https://via.placeholder.com/600x450/111115/00ff88?text=Brandbook+Preview', // ЗАМІНИТИ ПРЕВ'Ю ТУТ
        images: [ // ЗАМІНИТИ ФОТО ДЛЯ МОДАЛКИ ТУТ
            'https://via.placeholder.com/1200x800/111115/00ff88?text=Brandbook+1'
        ]
    },
    {
        id: 'web-banner-1',
        title: { ua: 'Рекламні Digital банери для бренду "TSATSKY"', en: 'Digital Advertising Banners for "TSATSKY"' },
        category: 'web-banner',
        catName: { ua: 'Веб-банери', en: 'Web Banners' },
        type: 'image',
        description: {
            ua: 'Серія акційних веб-банерів для реклами знижок на ювелірні прикраси.',
            en: 'A series of promotional web banners for jewelry discounts.'
        },
        preview: 'projects/veb banners for TV/Реклама телевизоры баннера скидки-01.webp',
        images: [
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-01.webp',
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-02.webp',
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-03.webp',
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-04.webp',
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-05.webp',
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-06.webp',
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-07.webp',
            'projects/veb banners for TV/Реклама телевизоры баннера скидки-08.webp'
        ]
    },
    {
        id: 'large-banner-1',
        title: { ua: 'Music Fest Billboard', en: 'Music Fest Billboard' },
        category: 'large-banner',
        catName: { ua: 'Широкоформатні банери', en: 'Large Format Banners' },
        type: 'image',
        description: {
            ua: 'Дизайн білбордів для масштабного музичного фестивалю.',
            en: 'Billboard design for a massive music festival.'
        },
        preview: 'https://via.placeholder.com/600x450/111115/00ff88?text=Billboard', // ЗАМІНИТИ ПРЕВ'Ю ТУТ
        images: [ // ЗАМІНИТИ ФОТО ДЛЯ МОДАЛКИ ТУТ
            'https://via.placeholder.com/1200x800/111115/00ff88?text=Billboard+Mockup'
        ]
    },
    {
        id: 'instagram-1',
        title: { ua: 'Стрічка для Бренду Одягу', en: 'Clothing Brand Feed' },
        category: 'instagram',
        catName: { ua: 'Візуал Instagram', en: 'Instagram Visuals' },
        type: 'image',
        description: {
            ua: 'Креативний підхід до розробки безшовної Instagram-стрічки.',
            en: 'Creative approach to developing a seamless Instagram feed.'
        },
        preview: 'https://via.placeholder.com/600x450/111115/00ff88?text=Instagram+Feed', // ЗАМІНИТИ ПРЕВ'Ю ТУТ
        images: [ // ЗАМІНИТИ ФОТО ДЛЯ МОДАЛКИ ТУТ
            'https://via.placeholder.com/1200x800/111115/00ff88?text=Feed+1',
            'https://via.placeholder.com/1200x800/111115/00ff88?text=Feed+2'
        ]
    },
    {
        id: 'logo-1',
        title: { ua: 'Логотип Future Agency', en: 'Future Agency Logo' },
        category: 'logo',
        catName: { ua: 'Логотипи', en: 'Logos' },
        type: 'image',
        description: {
            ua: 'Мінімалістичний векторний логотип, що символізує цифрову трансформацію.',
            en: 'Minimalist vector logo symbolizing digital transformation.'
        },
        preview: 'https://via.placeholder.com/600x450/111115/00ff88?text=Logo', // ЗАМІНИТИ ПРЕВ'Ю ТУТ
        images: [ // ЗАМІНИТИ ФОТО ДЛЯ МОДАЛКИ ТУТ
            'https://via.placeholder.com/1200x800/111115/00ff88?text=Logo+Variation+1',
            'https://via.placeholder.com/1200x800/111115/00bbff?text=Logo+Variation+2'
        ]
    },
    {
        id: 'illustration-1',
        title: { ua: 'Sci-Fi Персонажі', en: 'Sci-Fi Characters' },
        category: 'illustration',
        catName: { ua: 'Ілюстрації', en: 'Illustrations' },
        type: 'image',
        description: {
            ua: 'Серія деталізованих ілюстрацій в стилі кіберпанк.',
            en: 'A series of detailed illustrations in cyberpunk style.'
        },
        preview: 'https://via.placeholder.com/600x450/111115/00ff88?text=Illustration', // ЗАМІНИТИ ПРЕВ'Ю ТУТ
        images: [ // ЗАМІНИТИ ФОТО ДЛЯ МОДАЛКИ ТУТ
            'https://via.placeholder.com/1200x800/111115/00ff88?text=Illustration+1'
        ]
    },
    {
        id: 'clothing-1',
        title: { ua: 'Мерч "Neon Series"', en: '"Neon Series" Merch' },
        category: 'clothing',
        catName: { ua: 'Принти для одягу', en: 'Apparel Prints' },
        type: 'image',
        description: {
            ua: 'Дизайн принтів для лімітованої колекції худі та футболок.',
            en: 'Print design for a limited collection of hoodies and t-shirts.'
        },
        preview: 'https://via.placeholder.com/600x450/111115/00ff88?text=Clothing', // ЗАМІНИТИ ПРЕВ'Ю ТУТ
        images: [ // ЗАМІНИТИ ФОТО ДЛЯ МОДАЛКИ ТУТ
            'https://via.placeholder.com/1200x800/111115/00ff88?text=Hoodie+Print'
        ]
    },
    {
        id: 'ai-photo-1',
        title: { ua: 'AI Fashion Віжн', en: 'AI Fashion Vision' },
        category: 'ai-photo',
        catName: { ua: 'AI фотосесії', en: 'AI Photoshoots' },
        type: 'image',
        description: {
            ua: 'Генерація fashion-фотографій з використанням Midjourney V6.',
            en: 'Generation of fashion photography using Midjourney V6.'
        },
        preview: 'https://via.placeholder.com/600x450/111115/00bbff?text=AI+Photo', // ЗАМІНИТИ ПРЕВ'Ю ТУТ
        images: [ // ЗАМІНИТИ ФОТО ДЛЯ МОДАЛКИ ТУТ
            'https://via.placeholder.com/1200x800/111115/00bbff?text=AI+Photo+1',
            'https://via.placeholder.com/1200x800/111115/00bbff?text=AI+Photo+2'
        ]
    },
    {
        id: 'ai-video-1',
        title: { ua: 'Генеративний AI Флоу', en: 'Generative AI Flow' },
        category: 'ai-video',
        catName: { ua: 'AI відео-креативи', en: 'AI Video Creatives' },
        type: 'video',
        description: {
            ua: 'Креативне промо відео створене за допомогою RunwayML Gen-2.',
            en: 'Creative promo video generated using RunwayML Gen-2.'
        },
        // ЗАМІНІТЬ .mp4 ПОСИЛАННЯ (ПреВ'ю)
        preview: 'https://www.w3schools.com/html/mov_bbb.mp4',
        images: [ // ЗАМІНИТИ ВІДЕО/ФОТО ДЛЯ МОДАЛКИ ТУТ (додавайте .mp4 файли або картинки)
            'https://www.w3schools.com/html/mov_bbb.mp4',
            'https://via.placeholder.com/1200x800/111115/00bbff?text=Storyboard+1'
        ]
    },
    {
        id: 'ai-image-video-1',
        title: { ua: 'Brand AI Storyteller', en: 'Brand AI Storyteller' },
        category: 'ai-image-video',
        catName: { ua: 'Іміджеві AI відео', en: 'AI Brand Videos' },
        type: 'video',
        description: {
            ua: 'Створення унікальної історії бренду через AI-анімацію.',
            en: 'Creating a unique brand story through AI animation.'
        },
        // ЗАМІНІТЬ .mp4 ПОСИЛАННЯ (ПреВ'ю)
        preview: 'https://www.w3schools.com/html/mov_bbb.mp4',
        images: [ // ЗАМІНИТИ ВІДЕО ДЛЯ МОДАЛКИ ТУТ
            'https://www.w3schools.com/html/mov_bbb.mp4'
        ]
    }
];

const portfolioGrid = document.querySelector('.portfolio-grid');
const filterBtns = document.querySelectorAll('.filter-btn');

function renderPortfolio(data, animate = true) {
    portfolioGrid.innerHTML = '';

    if (data.length === 0) {
        portfolioGrid.innerHTML = `<p style="color: var(--color-text-muted); grid-column: 1/-1; text-align:center; padding: 40px;">${translations[currentLang].empty_portfolio}</p>`;
        return;
    }

    data.forEach((item, index) => {
        const delay = (index % 4) * 0.1;

        let mediaContent = '';
        if (item.type === 'video') {
            mediaContent = `
                <video loop muted playsinline>
                    <source src="${item.preview}" type="video/mp4">
                </video>
                <div class="video-indicator">▶</div>`;
        } else {
            mediaContent = `<img src="${item.preview}" alt="${item.title[currentLang]}" loading="lazy">`;
        }

        const card = document.createElement('div');
        card.className = 'portfolio-item' + (animate ? ' reveal-element' : ' active');
        if (animate) card.style.animationDelay = `${delay}s`;

        card.innerHTML = `
            ${mediaContent}
            <div class="portfolio-overlay">
                <span class="portfolio-category">${item.catName[currentLang]}</span>
                <h3 class="portfolio-title">${item.title[currentLang]}</h3>
            </div>
        `;

        if (item.type === 'video') {
            const video = card.querySelector('video');
            if (window.innerWidth > 768) {
                card.addEventListener('mouseenter', () => video.play().catch(e => { }));
                card.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
            } else {
                video.setAttribute('autoplay', 'true');
            }
        }

        card.addEventListener('click', () => {
            openModal(item);
        });

        portfolioGrid.appendChild(card);

        if (animate) {
            setTimeout(() => {
                card.classList.add('active');
            }, 50);
        }
    });

    addHoverListeners();
}

// Initial render
renderPortfolio(portfolioData);

// Filtering logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        portfolioGrid.style.opacity = '0';
        portfolioGrid.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            if (filterValue === 'all') {
                renderPortfolio(portfolioData, true);
            } else {
                const filteredData = portfolioData.filter(item => item.category === filterValue);
                renderPortfolio(filteredData, true);
            }
            portfolioGrid.style.opacity = '1';
        }, 300);
    });
});
