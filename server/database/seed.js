require('dotenv').config();
const crypto = require('node:crypto');
const db = require('./db');
const { hashPassword } = require('../middleware/authUtils');

function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vprotsenko.design';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePass2026!';

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!existingUser) {
        const { hash, salt } = hashPassword(adminPassword);
        const userId = crypto.randomUUID();
        db.prepare(`
            INSERT INTO users (id, email, password_hash, salt, role)
            VALUES (?, ?, ?, ?, 'admin')
        `).run(userId, adminEmail, hash, salt);
        console.log(`✅ Default admin created: ${adminEmail} (password: ${adminPassword})`);
    } else {
        console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
    }

    // 2. Seed Categories
    const categories = [
        { id: 'cat-branding', slug: 'branding', name_ua: 'Брендинг & Пакування', name_en: 'Branding & Packaging', sort_order: 1 },
        { id: 'cat-advertising', slug: 'advertising', name_ua: 'Реклама & Медіа', name_en: 'Advertising & Media', sort_order: 2 },
        { id: 'cat-outdoor', slug: 'outdoor', name_ua: 'Outdoor & Retail', name_en: 'Outdoor & Retail', sort_order: 3 },
        { id: 'cat-ai-visual', slug: 'ai-visual', name_ua: 'AI & CGI Продакшн', name_en: 'AI & CGI Production', sort_order: 4 }
    ];

    const insertCat = db.prepare(`
        INSERT OR IGNORE INTO categories (id, slug, name_ua, name_en, sort_order, is_visible)
        VALUES (?, ?, ?, ?, ?, 1)
    `);

    for (const cat of categories) {
        insertCat.run(cat.id, cat.slug, cat.name_ua, cat.name_en, cat.sort_order);
    }
    console.log(`✅ ${categories.length} categories verified`);

    // 3. Seed Projects
    const projects = [
        {
            id: 'proj-1-luxe-noir',
            category_id: 'cat-branding',
            slug: 'luxe-noir-jewelry',
            title_ua: 'Luxe Noir — Преміальне пакування & 3D/AI предметний візуал',
            title_en: 'Luxe Noir — Luxury Packaging & 3D/AI Product Visuals',
            task_ua: 'Створити преміальну концепцію упаковки ювелірних виробів та фотореалістичний предметний CGI-візуал для презентації колекції.',
            task_en: 'Design a premium jewelry packaging concept and photorealistic CGI/AI product visuals for a luxury collection launch.',
            direction_ua: 'Геометричні форми, глибокі матові текстури, акцентне золото та кінематографічне світло для підкреслення вишуканості виробу.',
            direction_en: 'Geometric forms, deep matte textures, luxury gold embossing, and cinematic lighting to highlight high-end craftsmanship.',
            solution_ua: 'Розроблено конструктив упаковки, розгортки під штамп та тиснення, а також серію 3D/AI-рендерів надвисокої деталізації.',
            solution_en: 'Crafted physical package dielines and prepress files alongside ultra-high-resolution 3D/AI scenes for multi-channel launch.',
            result_ua: 'Готовий до друку комплект та реалістичний контент для каталогу й соцмереж без необхідності дорогої студійної зйомки.',
            result_en: 'Production-ready packaging assets and photorealistic promotional visuals delivered without costly studio photography.',
            cover_image: 'projects/jewelry package/Minimalist_jewelry_packaging_202603191410.webp',
            sort_order: 1,
            client: 'Luxe Noir Atelier',
            year: '2026',
            images: [
                'projects/jewelry package/Minimalist_jewelry_packaging_202603191410.webp',
                'projects/jewelry package/Two_triangular_packages_202603191409.webp',
                'projects/jewelry package/Ultra-realistic_shot_of_202603191409.webp',
                'projects/jewelry package/Action-shot_CGI_of_202603191410.webp',
                'projects/jewelry package/High-end_professional_product_202603191410 (1).webp',
                'projects/jewelry package/Surreal_CGI_of_202603191410.webp'
            ]
        },
        {
            id: 'proj-2-techsmart-tv',
            category_id: 'cat-advertising',
            slug: 'techsmart-tv-campaign',
            title_ua: 'TechSmart TV — Серія промо-банерів та акційних креативів',
            title_en: 'TechSmart TV — Promo Banner Campaign & Digital Creatives',
            task_ua: 'Розробити комплексну серію акційних веб-банерів та креативів для сезонного розпродажу телевізійної техніки.',
            task_en: 'Develop a comprehensive series of promotional web banners and ad creatives for a seasonal Smart TV sales campaign.',
            direction_ua: 'Яскравий технологічний контраст, чітка візуальна ієрархія знижок, виразна типографіка та фокус на перевагах продукту.',
            direction_en: 'High-contrast tech aesthetics, clean price discount hierarchy, bold typography, and direct focus on 4K/OLED features.',
            solution_ua: 'Створено лінійку з 8 варіантів банерів під ключові плейсменти: веб-сайти, контекстні мережі, соцмережі та маркетплейси.',
            solution_en: 'Delivered an 8-layout responsive banner suite for digital media, Google Display Network, and e-commerce placements.',
            result_ua: 'Єдина дизайн-система кампанії з миттєвим зчитуванням комерційної пропозиції та високим показником CTR.',
            result_en: 'Unified high-conversion campaign system with instant message clarity and optimized visual impact.',
            cover_image: 'projects/veb banners for TV/Реклама телевизоры баннера скидки-01.webp',
            sort_order: 2,
            client: 'TechSmart Retail',
            year: '2026',
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
            id: 'proj-3-grand-odesa',
            category_id: 'cat-outdoor',
            slug: 'grand-odesa-billboard',
            title_ua: 'Grand Odesa — Великоформатна фасадна реклама та білборд',
            title_en: 'Grand Odesa — Large Format Facade Billboard & Advertising',
            task_ua: 'Створити дизайн великоформатного фасадного банера для міського середовища з реалістичною архітектурною візуалізацією.',
            task_en: 'Design a large-scale outdoor facade banner for an urban landmark featuring photorealistic interior visualization.',
            direction_ua: 'Панорамна просторова композиція, відмінна читабельність контактів з великої відстані та баланс брендових акцентів.',
            direction_en: 'Panoramic spatial composition, maximum legibility from 50+ meters distance, and harmonious architectural integration.',
            solution_ua: 'Розроблено деталізований макет у надвисокій роздільній здатності з повною додрукарською підготовкою під сольвентний друк.',
            solution_en: 'Crafted ultra-high-resolution print artwork with complete color management and prepress compliance for outdoor solvent printing.',
            result_ua: 'Макет успішно надруковано та змонтовано; забезпечено високу помітність серед автомобільного та пішохідного трафіку.',
            result_en: 'Successfully printed and mounted on-site; achieved maximum visual engagement across high-traffic urban corridors.',
            cover_image: 'projects/big size banner 1/Баннер одесская.PSD).webp',
            sort_order: 3,
            client: 'Grand Odesa Complex',
            year: '2026',
            images: [
                'projects/big size banner 1/Баннер одесская.PSD).webp',
                'projects/big size banner 1/A_hyper-realistic_wide_202603192157.webp',
                'projects/big size banner 1/A_hyper-realistic_architectural_202603192205.webp',
                'projects/big size banner 1/A_realistic_low-angle_202603192205.webp',
                'projects/big size banner 1/A_professional_interior_202603192158.webp'
            ]
        },
        {
            id: 'proj-4-smart-entrance',
            category_id: 'cat-outdoor',
            slug: 'smart-entrance-signage',
            title_ua: 'Smart Entrance — Брендування вхідних груп та фасадних вивісок',
            title_en: 'Smart Entrance — Retail Door Ads & Facade Signage System',
            task_ua: 'Оформити фасадне брендування дверей та вивісок вхідної групи для залучення офлайн-трафіку покупців.',
            task_en: 'Create a branded entrance door signage and signage system for commercial retail space to boost offline customer footfall.',
            direction_ua: 'Строга контрастна стилістика, чітке зонування інформації (графік, послуги, навігація) та адаптація під пропорції скла.',
            direction_en: 'Clean high-contrast styling, structured informational hierarchy (hours, services, contacts), and seamless glass fit.',
            solution_ua: 'Підготовлено комплект із 4 макетів під плотерну порізку плівки та світлові панелі з урахуванням технічних монтажних зазорів.',
            solution_en: 'Delivered 4 precision-measured vector files for vinyl plotter cutting and illuminated acrylic signage.',
            result_ua: 'Презентабельний вхідний простір, що формує довіру клієнта ще до моменту входу в приміщення.',
            result_en: 'Polished and cohesive entrance experience establishing strong brand trust right at the storefront.',
            cover_image: 'projects/Door ads design/Вывески для входа 1.webp',
            sort_order: 4,
            client: 'Smart Entrance Retail',
            year: '2026',
            images: [
                'projects/Door ads design/Вывески для входа 1.webp',
                'projects/Door ads design/Вывески для входа 2.webp',
                'projects/Door ads design/Вывески для входа 3.webp',
                'projects/Door ads design/Вывески для входа 4.webp'
            ]
        }
    ];

    const insertProj = db.prepare(`
        INSERT OR IGNORE INTO projects (
            id, category_id, slug, title_ua, title_en, task_ua, task_en,
            direction_ua, direction_en, solution_ua, solution_en, result_ua, result_en,
            cover_image, sort_order, is_published, client, year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const insertImg = db.prepare(`
        INSERT OR IGNORE INTO project_images (id, project_id, image_url, sort_order)
        VALUES (?, ?, ?, ?)
    `);

    for (const p of projects) {
        insertProj.run(
            p.id, p.category_id, p.slug, p.title_ua, p.title_en, p.task_ua, p.task_en,
            p.direction_ua, p.direction_en, p.solution_ua, p.solution_en, p.result_ua, p.result_en,
            p.cover_image, p.sort_order, p.client, p.year
        );

        let imgIndex = 0;
        for (const imgUrl of p.images) {
            insertImg.run(crypto.randomUUID(), p.id, imgUrl, imgIndex++);
        }
    }
    console.log(`✅ ${projects.length} initial projects seeded with galleries`);

    // 4. Seed Site Content
    const siteContent = {
        hero: {
            status_ua: 'Доступний для нових проєктів',
            status_en: 'Available for new projects',
            role_badge_ua: 'Brand Visuals & Commercial Advertising',
            role_badge_en: 'Brand Visuals & Commercial Advertising',
            slogan_1_ua: 'Створюю виразний візуальний дизайн,',
            slogan_1_en: 'Crafting expressive visual design,',
            slogan_2_ua: 'ЩО ПЕРЕТВОРЮЄ УВАГУ АУДИТОРІЇ НА ПРОДАЖІ.',
            slogan_2_en: 'TURNING AUDIENCE ATTENTION INTO MEASURABLE SALES.'
        },
        contacts: {
            title_ua: 'Готові підсилити візуал вашого бренду?',
            title_en: 'Ready to elevate your brand\'s visual impact?',
            desc_ua: 'Напишіть мені в зручний месенджер або заповніть форму. Я повернуся з відповіддю та пропозицією протягом 2–3 годин.',
            desc_en: 'Reach out directly via your preferred messenger or submit an inquiry. I will respond within 2–3 business hours.',
            telegram_url: 'https://t.me/v_47_p',
            telegram_handle: '@v_47_p',
            instagram_url: 'https://www.instagram.com/vprotsenko_design/',
            instagram_handle: '@vprotsenko_design',
            linkedin_url: 'https://www.linkedin.com/in/%D0%B2%D0%BB%D0%B0%D0%B4%D0%B8%D1%81%D0%BB%D0%B0%D0%B2-%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D0%BD%D0%BA%D0%BE-2aa722246/',
            email: 'vladyslav.protsenko.design@gmail.com'
        },
        metrics: {
            m1_num: '50+',
            m1_label_ua: 'Реалізованих комерційних макетів та систем',
            m1_label_en: 'Delivered commercial design projects and systems',
            m2_num: '48 год',
            m2_label_ua: 'Середній час на презентацію перших концепцій',
            m2_label_en: 'Average time to deliver initial concepts',
            m3_num: '100%',
            m3_label_ua: 'Технічна відповідність стандартам друку та веб',
            m3_label_en: 'Technical compliance for print and digital standards',
            m4_num: '3x',
            m4_label_ua: 'Прискорення продакшну завдяки AI-технологіям',
            m4_label_en: 'Production speedup powered by AI workflows'
        },
        services: {
            s1_title_ua: 'РЕКЛАМНІ СИСТЕМИ ТА КРЕАТИВИ',
            s1_title_en: 'COMMERCIAL ADVERTISING & ADS',
            s1_tag: '[ad_systems]',
            s1_term_ua: 'від 2 до 5 робочих днів',
            s1_term_en: '2 to 5 business days',
            s1_desc_ua: 'Конверсійний візуал для таргетованих кампаній та digital-запусків.',
            s1_desc_en: 'Conversion-driven visuals for paid traffic campaigns and digital launches.',

            s2_title_ua: 'AI-ВІЗУАЛ ТА CGI ПРОДАКШН',
            s2_title_en: 'AI VISUALS & CGI PRODUCTION',
            s2_tag: '[ai_cgi_production]',
            s2_term_ua: 'від 3 до 7 робочих днів',
            s2_term_en: '3 to 7 business days',
            s2_desc_ua: 'Преміальний контент без витрат на оренду студій та довгий знімальний процес.',
            s2_desc_en: 'High-end visual content without expensive studio rentals and prolonged shoots.',

            s3_title_ua: 'БРЕНДИНГ, УПАКОВКА ТА ПОЛІГРАФІЯ',
            s3_title_en: 'BRAND IDENTITY, PACKAGING & PRINT',
            s3_tag: '[identity_packaging]',
            s3_term_ua: 'від 5 до 14 робочих днів',
            s3_term_en: '5 to 14 business days',
            s3_desc_ua: 'Цілісна візуальна мова та фірмова поліграфія, що виділяють продукт на полиці та в житті.',
            s3_desc_en: 'A unified brand presence and premium print collateral commanding attention across retail and offline touchpoints.',

            s4_title_ua: 'OUTDOOR ТА RETAIL ДИЗАЙН',
            s4_title_en: 'OUTDOOR & RETAIL SIGNAGE',
            s4_tag: '[outdoor_retail]',
            s4_term_ua: 'від 2 до 6 робочих днів',
            s4_term_en: '2 to 6 business days',
            s4_desc_ua: 'Ефектне просторове оформлення для залучення офлайн-потоку клієнтів.',
            s4_desc_en: 'High-impact environmental graphics engineered to convert offline foot traffic.'
        },
        faq: {
            q1_title_ua: 'З чого починається співпраця?',
            q1_title_en: 'How does our collaboration start?',
            q1_desc_ua: 'З короткого знайомства: ви описуєте задачу, цілі та дедлайни (у Telegram або через форму). Я аналізую вхідні дані та пропоную оптимальний формат і кошторис.',
            q1_desc_en: 'With a quick intro: share your goals, deliverables, and timeline (via Telegram or contact form). I evaluate requirements and suggest the optimal format and estimate.',

            q2_title_ua: 'У яких форматах ви передаєте готові матеріали?',
            q2_title_en: 'What file formats will I receive?',
            q2_desc_ua: 'Ви отримуєте повний комплект: вихідні файли (PSD/AI/Figma), векторні криві під порізку, препрес PDF для друку за стандартами типографії та оптимізовані WebP/PNG/JPG для діджитал.',
            q2_desc_en: 'You get a comprehensive package: master files (PSD/AI/Figma), cut-ready vector outlines, print-ready PDFs certified for prepress, and optimized WebP/PNG/JPG for digital channels.',

            q3_title_ua: 'Як саме у ваших проєктах використовується штучний інтелект?',
            q3_title_en: 'How is artificial intelligence integrated into your work?',
            q3_desc_ua: 'ШІ виступає як високошвидкісна продакшн-лабораторія для створення складних текстур, фотореалістичних сцен та 3D-композицій. Фінальна композиція, типографіка, ретуш та колір завжди доопрацьовуються вручну.',
            q3_desc_en: 'AI serves as a rapid production studio for generating complex textures, 3D scenes, and photorealistic elements. Final composition, typography, and retouching are meticulously hand-crafted.',

            q4_title_ua: 'Чи можлива робота з уже наявним брендбуком?',
            q4_title_en: 'Can you work with our existing brand guidelines?',
            q4_desc_ua: 'Так. Я суворо дотримуюся ваших фірмових кольорів, шрифтів та гайдлайнів або можу допомогти систематизувати візуальну мову, якщо вона ще не закріплена.',
            q4_desc_en: 'Absolutely. I adhere strictly to your brand book, color palettes, and fonts, or help standardize visual assets if your brand guide is still evolving.'
        }
    };

    const insertContent = db.prepare(`
        INSERT OR REPLACE INTO site_content (section_key, content_json, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    for (const [key, val] of Object.entries(siteContent)) {
        insertContent.run(key, JSON.stringify(val));
    }
    console.log('✅ Site content sections initialized in database');
    console.log('🎉 Seeding complete successfully!');
}

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
