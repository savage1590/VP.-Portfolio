const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { hashPassword } = require('../middleware/authUtils');

// Initial seed data definitions
const defaultAdmin = {
    email: process.env.ADMIN_EMAIL || 'admin@vprotsenko.design',
    password: process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePass2026!'
};

const defaultCategories = [
    { id: 'cat-branding', slug: 'branding', name_ua: 'Брендинг & Пакування', name_en: 'Branding & Packaging', sort_order: 1, is_visible: 1 },
    { id: 'cat-advertising', slug: 'advertising', name_ua: 'Реклама & Медіа', name_en: 'Advertising & Media', sort_order: 2, is_visible: 1 },
    { id: 'cat-outdoor', slug: 'outdoor', name_ua: 'Outdoor & Retail', name_en: 'Outdoor & Retail', sort_order: 3, is_visible: 1 },
    { id: 'cat-ai-visual', slug: 'ai-visual', name_ua: 'AI & CGI Продакшн', name_en: 'AI & CGI Production', sort_order: 4, is_visible: 1 }
];

const defaultProjects = [
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
        is_published: 1,
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
        is_published: 1,
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
        is_published: 1,
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
        is_published: 1,
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

const defaultSiteContent = {
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

let db = null;

// Safe dynamic loader for node:sqlite without triggering bundler trace failures
function initSqlite() {
    try {
        // Obfuscate module name from static AST scanners
        const mod = ['node', 'sqlite'].join(':');
        const sqliteModule = require(mod);
        if (!sqliteModule || !sqliteModule.DatabaseSync) return null;

        const isVercel = Boolean(process.env.VERCEL);
        const dataDir = isVercel ? '/tmp' : path.join(__dirname, '../../data');
        const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');

        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const dbPath = path.join(dataDir, 'portfolio.db');
        const sqliteDb = new sqliteModule.DatabaseSync(dbPath);

        sqliteDb.exec(`
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                slug TEXT UNIQUE NOT NULL,
                name_ua TEXT NOT NULL,
                name_en TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_visible INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                category_id TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                title_ua TEXT NOT NULL,
                title_en TEXT NOT NULL,
                task_ua TEXT,
                task_en TEXT,
                direction_ua TEXT,
                direction_en TEXT,
                solution_ua TEXT,
                solution_en TEXT,
                result_ua TEXT,
                result_en TEXT,
                cover_image TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_published INTEGER NOT NULL DEFAULT 1,
                client TEXT,
                year TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS project_images (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                image_url TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS site_content (
                section_key TEXT PRIMARY KEY,
                content_json TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT NOT NULL,
                entity TEXT NOT NULL,
                entity_id TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Self-contained seeding for SQLite
        const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get();
        if (!userCount || userCount.count === 0) {
            const { hash, salt } = hashPassword(defaultAdmin.password);
            const adminId = crypto.randomUUID();
            sqliteDb.prepare('INSERT INTO users (id, email, password_hash, salt, role) VALUES (?, ?, ?, ?, "admin")')
                .run(adminId, defaultAdmin.email.toLowerCase().trim(), hash, salt);

            const insertCat = sqliteDb.prepare('INSERT OR IGNORE INTO categories (id, slug, name_ua, name_en, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)');
            for (const cat of defaultCategories) {
                insertCat.run(cat.id, cat.slug, cat.name_ua, cat.name_en, cat.sort_order, cat.is_visible);
            }

            const insertProj = sqliteDb.prepare(`
                INSERT OR IGNORE INTO projects (id, category_id, slug, title_ua, title_en, task_ua, task_en, direction_ua, direction_en, solution_ua, solution_en, result_ua, result_en, cover_image, sort_order, is_published, client, year)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const insertImg = sqliteDb.prepare('INSERT OR IGNORE INTO project_images (id, project_id, image_url, sort_order) VALUES (?, ?, ?, ?)');

            for (const p of defaultProjects) {
                insertProj.run(p.id, p.category_id, p.slug, p.title_ua, p.title_en, p.task_ua, p.task_en, p.direction_ua, p.direction_en, p.solution_ua, p.solution_en, p.result_ua, p.result_en, p.cover_image, p.sort_order, p.is_published, p.client, p.year);
                let imgIdx = 0;
                for (const img of p.images) {
                    insertImg.run(crypto.randomUUID(), p.id, img, imgIdx++);
                }
            }

            const insertContent = sqliteDb.prepare('INSERT OR REPLACE INTO site_content (section_key, content_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
            for (const [k, v] of Object.entries(defaultSiteContent)) {
                insertContent.run(k, JSON.stringify(v));
            }
        }

        return sqliteDb;
    } catch (e) {
        return null;
    }
}

db = initSqlite();

if (!db) {
    // Initial pre-populated state for serverless execution
    const adminHashed = hashPassword(defaultAdmin.password);
    const initialAdminUser = {
        id: crypto.randomUUID(),
        email: defaultAdmin.email.toLowerCase().trim(),
        password_hash: adminHashed.hash,
        salt: adminHashed.salt,
        role: 'admin'
    };

    const initialProjectImages = [];
    defaultProjects.forEach(p => {
        let i = 0;
        p.images.forEach(img => {
            initialProjectImages.push({ id: crypto.randomUUID(), project_id: p.id, image_url: img, sort_order: i++ });
        });
    });

    const state = {
        users: [initialAdminUser],
        sessions: [],
        categories: [...defaultCategories],
        projects: defaultProjects.map(p => ({ ...p })),
        project_images: initialProjectImages,
        site_content: { ...defaultSiteContent },
        audit_logs: []
    };

    db = {
        exec(sql) {},
        prepare(sql) {
            const cleanSql = sql.trim().replace(/\s+/g, ' ');

            return {
                get(...params) {
                    if (cleanSql.includes('FROM users WHERE email = ?')) {
                        const target = (params[0] || '').toLowerCase().trim();
                        return state.users.find(u => u.email === target) || null;
                    }
                    if (cleanSql.includes('FROM users WHERE id = ?')) {
                        return state.users.find(u => u.id === params[0]) || null;
                    }
                    if (cleanSql.includes('FROM sessions WHERE id = ?')) {
                        const s = state.sessions.find(x => x.id === params[0] && new Date(x.expires_at) > new Date());
                        if (s) {
                            const u = state.users.find(u => u.id === s.user_id);
                            return { ...s, email: u?.email, role: u?.role };
                        }
                        return null;
                    }
                    if (cleanSql.includes('FROM projects') && (cleanSql.includes('p.id = ?') || cleanSql.includes('id = ?')) && !cleanSql.includes('slug = ?')) {
                        const p = state.projects.find(x => x.id === params[0]);
                        if (!p) return null;
                        const c = state.categories.find(cat => cat.id === p.category_id);
                        return { ...p, category_name_ua: c?.name_ua, category_name_en: c?.name_en, category_slug: c?.slug };
                    }
                    if (cleanSql.includes('FROM projects') && cleanSql.includes('slug = ?')) {
                        const p = state.projects.find(x => x.slug === params[0]);
                        if (!p) return null;
                        const c = state.categories.find(cat => cat.id === p.category_id);
                        return { ...p, category_name_ua: c?.name_ua, category_name_en: c?.name_en, category_slug: c?.slug };
                    }
                    if (cleanSql.includes('FROM categories WHERE slug = ?')) {
                        return state.categories.find(c => c.slug === params[0]) || null;
                    }
                    if (cleanSql.includes('FROM categories') && (cleanSql.includes('id = ?') || cleanSql.includes('c.id = ?'))) {
                        return state.categories.find(c => c.id === params[0]) || null;
                    }
                    if (cleanSql.includes('FROM site_content WHERE section_key = ?')) {
                        const content = state.site_content[params[0]];
                        return content ? { content_json: JSON.stringify(content) } : null;
                    }
                    if (cleanSql.includes('COUNT(*) as count FROM users')) {
                        return { count: state.users.length };
                    }
                    return null;
                },

                all(...params) {
                    if (cleanSql.includes('FROM categories')) {
                        return state.categories.map(c => ({
                            ...c,
                            project_count: state.projects.filter(p => p.category_id === c.id).length
                        })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                    }
                    if (cleanSql.includes('FROM projects')) {
                        let list = [...state.projects];
                        return list.map(p => {
                            const c = state.categories.find(cat => cat.id === p.category_id);
                            const images = state.project_images.filter(img => img.project_id === p.id).map(img => img.image_url);
                            return {
                                ...p,
                                category_name_ua: c?.name_ua,
                                category_name_en: c?.name_en,
                                category_slug: c?.slug,
                                image_count: images.length,
                                images
                            };
                        }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                    }
                    if (cleanSql.includes('FROM project_images')) {
                        return state.project_images
                            .filter(img => img.project_id === params[0])
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map(img => ({ image_url: img.image_url, sort_order: img.sort_order, id: img.id, project_id: img.project_id }));
                    }
                    if (cleanSql.includes('FROM site_content')) {
                        return Object.entries(state.site_content).map(([k, v]) => ({
                            section_key: k,
                            content_json: JSON.stringify(v)
                        }));
                    }
                    return [];
                },

                run(...params) {
                    if (cleanSql.includes('INSERT INTO users')) {
                        state.users.push({ id: params[0], email: params[1], password_hash: params[2], salt: params[3], role: params[4] });
                    } else if (cleanSql.includes('UPDATE users SET password_hash')) {
                        const u = state.users.find(x => x.id === params[3]);
                        if (u) { u.password_hash = params[0]; u.salt = params[1]; }
                    } else if (cleanSql.includes('INSERT INTO sessions')) {
                        state.sessions.push({ id: params[0], user_id: params[1], expires_at: params[2] });
                    } else if (cleanSql.includes('DELETE FROM sessions WHERE id = ?')) {
                        state.sessions = state.sessions.filter(s => s.id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR IGNORE INTO categories') || cleanSql.includes('INSERT INTO categories')) {
                        state.categories.push({ id: params[0], slug: params[1], name_ua: params[2], name_en: params[3], sort_order: params[4], is_visible: params[5] ?? 1 });
                    } else if (cleanSql.includes('UPDATE categories SET')) {
                        const c = state.categories.find(x => x.id === params[4]);
                        if (c) { c.slug = params[0]; c.name_ua = params[1]; c.name_en = params[2]; c.is_visible = params[3]; }
                    } else if (cleanSql.includes('DELETE FROM categories WHERE id = ?')) {
                        state.categories = state.categories.filter(c => c.id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR IGNORE INTO projects') || cleanSql.includes('INSERT INTO projects')) {
                        state.projects.push({
                            id: params[0], category_id: params[1], slug: params[2], title_ua: params[3], title_en: params[4],
                            task_ua: params[5], task_en: params[6], direction_ua: params[7], direction_en: params[8],
                            solution_ua: params[9], solution_en: params[10], result_ua: params[11], result_en: params[12],
                            cover_image: params[13], sort_order: params[14], client: params[15], year: params[16], is_published: 1
                        });
                    } else if (cleanSql.includes('UPDATE projects SET')) {
                        const p = state.projects.find(x => x.id === params[16]);
                        if (p) {
                            p.category_id = params[0]; p.slug = params[1]; p.title_ua = params[2]; p.title_en = params[3];
                            p.task_ua = params[4]; p.task_en = params[5]; p.direction_ua = params[6]; p.direction_en = params[7];
                            p.solution_ua = params[8]; p.solution_en = params[9]; p.result_ua = params[10]; p.result_en = params[11];
                            p.cover_image = params[12]; p.is_published = params[13]; p.client = params[14]; p.year = params[15];
                        }
                    } else if (cleanSql.includes('UPDATE projects SET is_published = ? WHERE id = ?')) {
                        const p = state.projects.find(x => x.id === params[1]);
                        if (p) p.is_published = params[0];
                    } else if (cleanSql.includes('DELETE FROM projects WHERE id = ?')) {
                        state.projects = state.projects.filter(p => p.id !== params[0]);
                        state.project_images = state.project_images.filter(img => img.project_id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR IGNORE INTO project_images') || cleanSql.includes('INSERT INTO project_images')) {
                        state.project_images.push({ id: params[0], project_id: params[1], image_url: params[2], sort_order: params[3] });
                    } else if (cleanSql.includes('DELETE FROM project_images WHERE project_id = ?')) {
                        state.project_images = state.project_images.filter(img => img.project_id !== params[0]);
                    } else if (cleanSql.includes('INSERT OR REPLACE INTO site_content')) {
                        state.site_content[params[0]] = JSON.parse(params[1]);
                    } else if (cleanSql.includes('INSERT INTO audit_logs')) {
                        state.audit_logs.push({ id: params[0], user_id: params[1], action: params[2], entity: params[3], ip_address: params[4] });
                    }
                    return { changes: 1 };
                }
            };
        }
    };
}

module.exports = db;
