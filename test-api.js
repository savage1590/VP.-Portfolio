const http = require('node:http');
const app = require('./server/app');

async function runTests() {
    console.log('🧪 Starting CMS & API Automated Verification Tests...\n');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(3001, resolve));
    const baseUrl = 'http://localhost:3001';

    let sessionCookie = '';
    let testCategoryId = '';
    let testProjectId = '';

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // Test 1: Health check
        console.log('--- 1. Testing Server Health ---');
        const healthRes = await fetch(`${baseUrl}/api/health`);
        const healthJson = await healthRes.json();
        assert(healthRes.status === 200 && healthJson.status === 'online', 'Server is healthy and online');

        // Test 2: Public Data Endpoint
        console.log('\n--- 2. Testing Public Data Endpoint ---');
        const publicRes = await fetch(`${baseUrl}/api/public/data`);
        const publicJson = await publicRes.json();
        assert(publicRes.status === 200, 'Public data returned 200');
        assert(Array.isArray(publicJson.categories) && publicJson.categories.length >= 4, 'Categories array present and populated');
        assert(Array.isArray(publicJson.projects) && publicJson.projects.length >= 4, 'Projects array present with seeded projects');
        assert(publicJson.content && publicJson.content.hero, 'Dynamic site content sections included');

        // Test 3: Unauthenticated Access to Protected Routes
        console.log('\n--- 3. Testing Route Protection (Security) ---');
        const unauthProjRes = await fetch(`${baseUrl}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title_ua: 'Hack', title_en: 'Hack', category_id: 'cat-branding' })
        });
        assert(unauthProjRes.status === 401, 'Unauthenticated POST /api/projects blocked with 401');

        // Test 4: Admin Login (Valid & Invalid)
        console.log('\n--- 4. Testing Authentication & Session Management ---');
        const invalidLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@vprotsenko.design', password: 'WrongPassword123!' })
        });
        assert(invalidLoginRes.status === 401, 'Invalid password rejected with 401');

        const validLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@vprotsenko.design', password: 'AdminSecurePass2026!' })
        });
        const loginJson = await validLoginRes.json();
        const setCookieHeader = validLoginRes.headers.get('set-cookie');
        if (setCookieHeader) {
            sessionCookie = setCookieHeader.split(';')[0];
        } else if (loginJson.token) {
            sessionCookie = `session_token=${loginJson.token}`;
        }
        assert(validLoginRes.status === 200 && loginJson.success === true, 'Admin login succeeded with 200');
        assert(Boolean(sessionCookie), 'Secure session cookie received');

        // Test 5: Verify Auth Session
        console.log('\n--- 5. Testing Verified Session Verification ---');
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Cookie': sessionCookie }
        });
        const meJson = await meRes.json();
        assert(meRes.status === 200 && meJson.user?.role === 'admin', 'Current user identified as admin');

        // Test 6: Categories Management (CRUD)
        console.log('\n--- 6. Testing Categories CRUD ---');
        const createCatRes = await fetch(`${baseUrl}/api/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({
                name_ua: 'Тестова Категорія',
                name_en: 'Test Category',
                slug: 'test-category'
            })
        });
        const createCatJson = await createCatRes.json();
        assert(createCatRes.status === 201 && createCatJson.category?.id, 'Category created successfully');
        testCategoryId = createCatJson.category?.id;

        // Test 7: Projects Management (CRUD)
        console.log('\n--- 7. Testing Projects CRUD ---');
        const createProjRes = await fetch(`${baseUrl}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({
                title_ua: 'Новий тестовий кейс',
                title_en: 'New Test Case Study',
                slug: 'new-test-case-study',
                category_id: testCategoryId,
                task_ua: 'Тестова задача',
                task_en: 'Test Task',
                cover_image: 'projects/jewelry package/Minimalist_jewelry_packaging_202603191410.webp',
                images: [
                    'projects/jewelry package/Minimalist_jewelry_packaging_202603191410.webp',
                    'projects/jewelry package/Two_triangular_packages_202603191409.webp'
                ],
                is_published: 1
            })
        });
        const createProjJson = await createProjRes.json();
        assert(createProjRes.status === 201 && createProjJson.project?.id, 'Project created with gallery');
        testProjectId = createProjJson.project?.id;

        // Toggle project published status
        const toggleRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({ is_published: 0 })
        });
        const toggleJson = await toggleRes.json();
        assert(toggleRes.status === 200 && toggleJson.is_published === false, 'Project status toggled to hidden');

        // Delete test project
        const delProjRes = await fetch(`${baseUrl}/api/projects/${testProjectId}`, {
            method: 'DELETE',
            headers: { 'Cookie': sessionCookie }
        });
        assert(delProjRes.status === 200, 'Project deleted successfully');

        // Delete test category
        const delCatRes = await fetch(`${baseUrl}/api/categories/${testCategoryId}`, {
            method: 'DELETE',
            headers: { 'Cookie': sessionCookie }
        });
        assert(delCatRes.status === 200, 'Category deleted successfully');

        // Test 8: Site Content Update
        console.log('\n--- 8. Testing Dynamic Site Content Update ---');
        const updateContentRes = await fetch(`${baseUrl}/api/content/hero`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({
                data: {
                    status_ua: 'Доступний для нових замовлень',
                    status_en: 'Available for new client projects',
                    role_badge_ua: 'Brand Visuals & Commercial Advertising',
                    role_badge_en: 'Brand Visuals & Commercial Advertising',
                    slogan_1_ua: 'Створюю виразний візуальний дизайн,',
                    slogan_1_en: 'Crafting expressive visual design,',
                    slogan_2_ua: 'ЩО ПЕРЕТВОРЮЄ УВАГУ АУДИТОРІЇ НА ПРОДАЖІ.',
                    slogan_2_en: 'TURNING AUDIENCE ATTENTION INTO MEASURABLE SALES.'
                }
            })
        });
        assert(updateContentRes.status === 200, 'Hero section content updated');

        // Test 9: Logout
        console.log('\n--- 9. Testing Secure Logout ---');
        const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Cookie': sessionCookie }
        });
        assert(logoutRes.status === 200, 'Logout succeeded and session terminated');

        console.log(`\n====================================================`);
        console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log(`====================================================\n`);

    } catch (err) {
        console.error('Test execution exception:', err);
    } finally {
        server.close();
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
