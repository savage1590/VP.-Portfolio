// Main Admin Application Controller
const app = {
    currentView: 'dashboard',
    categories: [],
    projects: [],
    siteContent: {},
    currentProjectImages: [],
    currentCoverImage: '',
    isProjectFormDirty: false,

    init() {
        auth.init();
        this.bindGlobalEvents();
        this.setupDropzone();
        this.handleInitialHash();
    },

    bindGlobalEvents() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Hash change event (Browser Back/Forward buttons)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && ['dashboard', 'projects', 'categories', 'content'].includes(hash)) {
                this.switchView(hash, false);
            }
        });

        // Quick create button in header
        document.getElementById('btnQuickCreateProject')?.addEventListener('click', () => {
            this.openProjectEditor();
        });

        document.getElementById('btnCreateProject')?.addEventListener('click', () => {
            this.openProjectEditor();
        });

        document.getElementById('btnCreateCategory')?.addEventListener('click', () => {
            this.openCategoryModal();
        });

        // Password modal trigger
        document.getElementById('btnOpenPasswordModal')?.addEventListener('click', () => {
            this.openModal('passwordModal');
        });

        // Modal close buttons (with dirty check for project form)
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.admin-modal');
                if (modal) {
                    if (modal.id === 'projectEditorModal' && this.isProjectFormDirty) {
                        this.confirmDialog({
                            title: 'Незбережені зміни',
                            message: 'У формі є незбережені дані. Ви дійсно бажаєте закрити редактор без збереження?',
                            confirmText: 'Закрити без збереження',
                            onConfirm: () => {
                                this.isProjectFormDirty = false;
                                this.closeModal(modal.id);
                            }
                        });
                    } else {
                        this.closeModal(modal.id);
                    }
                }
            });
        });

        // Search & Filters for projects
        const searchInput = document.getElementById('projectSearchInput');
        const catFilter = document.getElementById('projectCategoryFilter');
        const statusFilter = document.getElementById('projectStatusFilter');

        const triggerProjectFilter = () => {
            this.loadProjectsTable({
                search: searchInput?.value.trim() || '',
                category_id: catFilter?.value || '',
                is_published: statusFilter?.value || ''
            });
        };

        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(triggerProjectFilter, 300);
            });
        }
        if (catFilter) catFilter.addEventListener('change', triggerProjectFilter);
        if (statusFilter) statusFilter.addEventListener('change', triggerProjectFilter);

        // Project Form dirty tracker & submit
        const projectForm = document.getElementById('projectForm');
        if (projectForm) {
            projectForm.addEventListener('input', () => {
                this.isProjectFormDirty = true;
            });
            projectForm.addEventListener('submit', (e) => this.handleProjectSave(e));
        }

        // Live Preview in Project Editor
        document.getElementById('btnPreviewProject')?.addEventListener('click', () => {
            this.openLivePreview();
        });

        // Category Form submit
        document.getElementById('categoryForm')?.addEventListener('submit', (e) => this.handleCategorySave(e));

        // Editor tab switching
        document.querySelectorAll('.editor-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.editor-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.editor-tab-content').forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = btn.dataset.editorTab;
                if (targetTab === 'main') document.getElementById('editorTabMain')?.classList.add('active');
                if (targetTab === 'details') document.getElementById('editorTabDetails')?.classList.add('active');
                if (targetTab === 'media') document.getElementById('editorTabMedia')?.classList.add('active');
            });
        });

        // Content Editor tab switching
        document.querySelectorAll('.content-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.content-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.content-tab-pane').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const tab = btn.dataset.tab;
                if (tab === 'hero') document.getElementById('tabContentHero')?.classList.add('active');
                if (tab === 'services') document.getElementById('tabContentServices')?.classList.add('active');
                if (tab === 'faq') document.getElementById('tabContentFaq')?.classList.add('active');
                if (tab === 'metrics') document.getElementById('tabContentMetrics')?.classList.add('active');
                if (tab === 'contacts') document.getElementById('tabContentContacts')?.classList.add('active');
            });
        });

        // Content Forms submits
        document.getElementById('formContentHero')?.addEventListener('submit', (e) => this.handleContentSave(e, 'hero'));
        document.getElementById('formContentServices')?.addEventListener('submit', (e) => this.handleContentSave(e, 'services'));
        document.getElementById('formContentFaq')?.addEventListener('submit', (e) => this.handleContentSave(e, 'faq'));
        document.getElementById('formContentMetrics')?.addEventListener('submit', (e) => this.handleContentSave(e, 'metrics'));
        document.getElementById('formContentContacts')?.addEventListener('submit', (e) => this.handleContentSave(e, 'contacts'));
    },

    handleInitialHash() {
        const hash = window.location.hash.replace('#', '');
        if (hash && ['dashboard', 'projects', 'categories', 'content'].includes(hash)) {
            this.switchView(hash, false);
        } else {
            this.switchView('dashboard', false);
        }
    },

    switchView(viewName, updateHash = true) {
        this.currentView = viewName;

        if (updateHash) {
            history.replaceState(null, null, `#${viewName}`);
        }

        // Update nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
        const activeViewEl = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
        if (activeViewEl) activeViewEl.classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Огляд системи',
            projects: 'Керування проєктами',
            categories: 'Категорії портфоліо',
            content: 'Редагування контенту сайту'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = titles[viewName] || 'Адмін-панель';

        // Load data for view
        if (viewName === 'dashboard') this.initDashboard();
        if (viewName === 'projects') this.initProjectsView();
        if (viewName === 'categories') this.initCategoriesView();
        if (viewName === 'content') this.initContentView();
    },

    // ================= DASHBOARD =================
    async initDashboard() {
        try {
            const [projRes, catRes] = await Promise.all([
                API.getProjects(),
                API.getCategories()
            ]);

            this.projects = projRes.projects || [];
            this.categories = catRes.categories || [];

            // Update stats
            const totalProjects = this.projects.length;
            const publishedProjects = this.projects.filter(p => p.is_published).length;
            const totalCategories = this.categories.length;

            document.getElementById('statTotalProjects').textContent = totalProjects;
            document.getElementById('statPublishedProjects').textContent = publishedProjects;
            document.getElementById('statTotalCategories').textContent = totalCategories;

            // Render Recent Projects in Dashboard
            const tbody = document.getElementById('dashboardProjectsList');
            if (tbody) {
                tbody.innerHTML = '';
                const recent = this.projects.slice(0, 5);

                if (recent.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">Проєктів ще немає. Створіть перший проєкт!</td></tr>`;
                    return;
                }

                recent.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <img src="${p.cover_image || '../img/logo.svg'}" alt="${p.title_ua}" class="table-thumb" onerror="this.src='../img/logo.svg'">
                        </td>
                        <td>
                            <strong>${p.title_ua}</strong><br>
                            <small style="color: var(--text-muted);">${p.title_en}</small>
                        </td>
                        <td>
                            <span class="badge-pill" style="background: rgba(229,128,19,0.15); color: var(--color-accent);">${p.category_name_ua}</span>
                        </td>
                        <td>
                            <button class="badge-pill ${p.is_published ? 'published' : 'hidden'}" onclick="app.toggleProjectPublish('${p.id}', ${p.is_published ? 0 : 1})">
                                ${p.is_published ? '🟢 Опубліковано' : '⚪ Приховано'}
                            </button>
                        </td>
                        <td style="text-align: right;">
                            <button class="btn-action-sm" onclick="app.openProjectEditor('${p.id}')">Редагувати</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (err) {
            this.showToast('Помилка завантаження даних огляду', 'error');
        }
    },

    // ================= PROJECTS =================
    async initProjectsView() {
        await this.loadCategoryFilterDropdown();
        await this.loadProjectsTable();
    },

    async loadCategoryFilterDropdown() {
        try {
            const res = await API.getCategories();
            this.categories = res.categories || [];

            const catFilter = document.getElementById('projectCategoryFilter');
            if (catFilter) {
                catFilter.innerHTML = '<option value="">Усі категорії</option>';
                this.categories.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.name_ua;
                    catFilter.appendChild(opt);
                });
            }
        } catch (e) {}
    },

    async loadProjectsTable(params = {}) {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">Завантаження списку проєктів...</td></tr>`;

        try {
            const res = await API.getProjects(params);
            this.projects = res.projects || [];

            tbody.innerHTML = '';

            if (this.projects.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--text-muted);">Проєктів за вашим запитом не знайдено.</td></tr>`;
                return;
            }

            this.projects.forEach((p, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 800; color: var(--color-accent);">${p.sort_order || index + 1}</td>
                    <td>
                        <img src="${p.cover_image || '../img/logo.svg'}" alt="${p.title_ua}" class="table-thumb" onerror="this.src='../img/logo.svg'">
                    </td>
                    <td>
                        <strong>${p.title_ua}</strong><br>
                        <small style="color: var(--text-muted);">${p.title_en}</small>
                    </td>
                    <td>
                        <span class="badge-pill" style="background: rgba(229,128,19,0.15); color: var(--color-accent);">${p.category_name_ua}</span>
                    </td>
                    <td>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">🖼️ ${p.image_count || 1} медіа</span>
                    </td>
                    <td>
                        <button class="badge-pill ${p.is_published ? 'published' : 'hidden'}" onclick="app.toggleProjectPublish('${p.id}', ${p.is_published ? 0 : 1})">
                            ${p.is_published ? '🟢 Опубліковано' : '⚪ Приховано'}
                        </button>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action-sm" onclick="app.openProjectEditor('${p.id}')">✏️ Редагувати</button>
                            <button class="btn-action-sm delete" onclick="app.deleteProject('${p.id}', '${p.title_ua.replace(/'/g, "\\'")}')">🗑️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            this.showToast('Помилка завантаження проєктів', 'error');
        }
    },

    async toggleProjectPublish(projectId, newStatus) {
        try {
            await API.toggleProjectStatus(projectId, newStatus);
            this.showToast(newStatus ? 'Проєкт опубліковано на сайті!' : 'Проєкт приховано з сайту', 'success');
            if (this.currentView === 'projects') this.loadProjectsTable();
            if (this.currentView === 'dashboard') this.initDashboard();
        } catch (err) {
            this.showToast('Не вдалося змінити статус проєкту', 'error');
        }
    },

    async openProjectEditor(projectId = null) {
        const modal = document.getElementById('projectEditorModal');
        const modalTitle = document.getElementById('projectModalTitle');
        const form = document.getElementById('projectForm');
        const catSelect = document.getElementById('projectCategory');

        this.isProjectFormDirty = false;

        // Populate Categories dropdown
        if (catSelect) {
            catSelect.innerHTML = '';
            if (this.categories.length === 0) {
                const res = await API.getCategories();
                this.categories = res.categories || [];
            }
            this.categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.name_ua} (${c.name_en})`;
                catSelect.appendChild(opt);
            });
        }

        // Reset Tab state to Main
        document.querySelectorAll('.editor-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.editor-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('.editor-nav-btn[data-editor-tab="main"]')?.classList.add('active');
        document.getElementById('editorTabMain')?.classList.add('active');

        if (!projectId) {
            // New Project
            modalTitle.textContent = 'Створення нового проєкту';
            form.reset();
            document.getElementById('projectFormId').value = '';
            document.getElementById('projectIsPublished').checked = true;
            this.currentProjectImages = [];
            this.currentCoverImage = '';
            this.renderProjectGallery();
            this.openModal('projectEditorModal');
        } else {
            // Edit Existing
            modalTitle.textContent = 'Редагування проєкту';
            try {
                const res = await API.getProject(projectId);
                const p = res.project;

                document.getElementById('projectFormId').value = p.id;
                document.getElementById('projectTitleUa').value = p.title_ua || '';
                document.getElementById('projectTitleEn').value = p.title_en || '';
                document.getElementById('projectSlug').value = p.slug || '';
                document.getElementById('projectCategory').value = p.category_id || '';
                document.getElementById('projectClient').value = p.client || '';
                document.getElementById('projectYear').value = p.year || '';
                document.getElementById('projectIsPublished').checked = Boolean(p.is_published);

                document.getElementById('projectTaskUa').value = p.task_ua || '';
                document.getElementById('projectTaskEn').value = p.task_en || '';
                document.getElementById('projectDirectionUa').value = p.direction_ua || '';
                document.getElementById('projectDirectionEn').value = p.direction_en || '';
                document.getElementById('projectSolutionUa').value = p.solution_ua || '';
                document.getElementById('projectSolutionEn').value = p.solution_en || '';
                document.getElementById('projectResultUa').value = p.result_ua || '';
                document.getElementById('projectResultEn').value = p.result_en || '';

                this.currentProjectImages = Array.isArray(p.images) ? [...p.images] : (p.cover_image ? [p.cover_image] : []);
                this.currentCoverImage = p.cover_image || (this.currentProjectImages[0] || '');

                this.renderProjectGallery();
                this.openModal('projectEditorModal');
            } catch (err) {
                this.showToast('Не вдалося завантажити дані проєкту', 'error');
            }
        }
    },

    openLivePreview() {
        const titleUa = document.getElementById('projectTitleUa')?.value || 'Назва проєкту';
        const catSelect = document.getElementById('projectCategory');
        const catText = catSelect?.options[catSelect.selectedIndex]?.textContent || 'Категорія';
        const coverImg = this.currentCoverImage || (this.currentProjectImages[0] || '../img/logo.svg');

        const task = document.getElementById('projectTaskUa')?.value || 'Опис задачі проєкту...';
        const dir = document.getElementById('projectDirectionUa')?.value || 'Опис візуального напрямку...';
        const sol = document.getElementById('projectSolutionUa')?.value || 'Опис реалізованого дизайн-рішення...';
        const res = document.getElementById('projectResultUa')?.value || 'Опис бізнес-результату...';

        document.getElementById('previewTitle').textContent = titleUa;
        document.getElementById('previewCategory').textContent = catText;
        document.getElementById('previewMediaImg').src = coverImg;

        const secBox = document.getElementById('previewCaseSections');
        secBox.innerHTML = `
            <div class="preview-sec-box">
                <div class="preview-sec-heading">📌 Задача проєкту</div>
                <div class="preview-sec-desc">${task}</div>
            </div>
            <div class="preview-sec-box">
                <div class="preview-sec-heading">🎨 Візуальний напрямок</div>
                <div class="preview-sec-desc">${dir}</div>
            </div>
            <div class="preview-sec-box">
                <div class="preview-sec-heading">💡 Дизайн-рішення</div>
                <div class="preview-sec-desc">${sol}</div>
            </div>
            <div class="preview-sec-box">
                <div class="preview-sec-heading">🚀 Результат</div>
                <div class="preview-sec-desc">${res}</div>
            </div>
        `;

        this.openModal('previewModal');
    },

    async handleProjectSave(e) {
        e.preventDefault();
        const id = document.getElementById('projectFormId').value;
        const submitBtn = document.getElementById('btnSaveProject');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Збереження...';

        const payload = {
            title_ua: document.getElementById('projectTitleUa').value.trim(),
            title_en: document.getElementById('projectTitleEn').value.trim(),
            slug: document.getElementById('projectSlug').value.trim(),
            category_id: document.getElementById('projectCategory').value,
            client: document.getElementById('projectClient').value.trim(),
            year: document.getElementById('projectYear').value.trim(),
            is_published: document.getElementById('projectIsPublished').checked ? 1 : 0,

            task_ua: document.getElementById('projectTaskUa').value.trim(),
            task_en: document.getElementById('projectTaskEn').value.trim(),
            direction_ua: document.getElementById('projectDirectionUa').value.trim(),
            direction_en: document.getElementById('projectDirectionEn').value.trim(),
            solution_ua: document.getElementById('projectSolutionUa').value.trim(),
            solution_en: document.getElementById('projectSolutionEn').value.trim(),
            result_ua: document.getElementById('projectResultUa').value.trim(),
            result_en: document.getElementById('projectResultEn').value.trim(),

            cover_image: this.currentCoverImage || (this.currentProjectImages[0] || ''),
            images: this.currentProjectImages
        };

        try {
            if (id) {
                await API.updateProject(id, payload);
                this.showToast('Проєкт успішно оновлено!', 'success');
            } else {
                await API.createProject(payload);
                this.showToast('Новий проєкт успішно створено!', 'success');
            }
            this.isProjectFormDirty = false;
            this.closeModal('projectEditorModal');
            if (this.currentView === 'projects') this.loadProjectsTable();
            if (this.currentView === 'dashboard') this.initDashboard();
        } catch (err) {
            this.showToast(err.data?.error || 'Помилка збереження проєкту', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зберегти проєкт';
        }
    },

    deleteProject(id, title) {
        this.confirmDialog({
            title: 'Видалення проєкту',
            message: `Ви впевнені, що бажаєте безповоротно видалити проєкт "${title}"?`,
            confirmText: 'Видалити назавжди',
            onConfirm: async () => {
                try {
                    await API.deleteProject(id);
                    this.showToast('Проєкт видалено!', 'success');
                    if (this.currentView === 'projects') this.loadProjectsTable();
                    if (this.currentView === 'dashboard') this.initDashboard();
                } catch (err) {
                    this.showToast('Не вдалося видалити проєкт', 'error');
                }
            }
        });
    },

    // ================= DROPZONE & MEDIA =================
    setupDropzone() {
        const dropzone = document.getElementById('uploadDropzone');
        const fileInput = document.getElementById('fileInput');
        const btnBrowse = document.getElementById('btnBrowseFiles');

        if (!dropzone || !fileInput) return;

        if (btnBrowse) {
            btnBrowse.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        dropzone.addEventListener('click', () => fileInput.click());

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) this.uploadFiles(files);
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                this.uploadFiles(fileInput.files);
                fileInput.value = '';
            }
        });
    },

    async uploadFiles(files) {
        const progressBox = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');

        if (progressBox) progressBox.style.display = 'block';
        if (progressFill) progressFill.style.width = '30%';

        try {
            if (progressFill) progressFill.style.width = '70%';
            const res = await API.uploadFiles(files);

            if (res.files && Array.isArray(res.files)) {
                res.files.forEach(url => {
                    this.currentProjectImages.push(url);
                });

                if (!this.currentCoverImage && this.currentProjectImages.length > 0) {
                    this.currentCoverImage = this.currentProjectImages[0];
                }

                this.isProjectFormDirty = true;
                this.renderProjectGallery();
                this.showToast(`Успішно завантажено ${res.files.length} файл(ів)!`, 'success');
            }
        } catch (err) {
            this.showToast(err.data?.error || 'Помилка завантаження файлів', 'error');
        } finally {
            if (progressFill) progressFill.style.width = '100%';
            setTimeout(() => {
                if (progressBox) progressBox.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
            }, 400);
        }
    },

    renderProjectGallery() {
        const grid = document.getElementById('projectGalleryGrid');
        const countSpan = document.getElementById('galleryCount');
        if (!grid) return;

        grid.innerHTML = '';
        if (countSpan) countSpan.textContent = this.currentProjectImages.length;

        if (this.currentProjectImages.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 20px;">Немає завантажених зображень. Перетягніть їх у поле вище!</div>`;
            return;
        }

        this.currentProjectImages.forEach((imgUrl, index) => {
            const isCover = (this.currentCoverImage === imgUrl) || (!this.currentCoverImage && index === 0);
            const isVideo = imgUrl.endsWith('.mp4') || imgUrl.endsWith('.webm');

            const item = document.createElement('div');
            item.className = `gallery-item ${isCover ? 'is-cover' : ''}`;

            item.innerHTML = `
                ${isVideo ? `<video src="${imgUrl}" muted></video>` : `<img src="${imgUrl}" alt="Media ${index + 1}" onerror="this.src='../img/logo.svg'">`}
                ${isCover ? `<span class="cover-badge">★ Обкладинка</span>` : ''}
                <div class="gallery-item-actions">
                    <button type="button" class="btn-media-action" title="Зробити обкладинкою" onclick="app.setCoverImage('${imgUrl}')">⭐</button>
                    <button type="button" class="btn-media-action" title="Скопіювати URL" onclick="app.copyImageUrl('${imgUrl}')">📋</button>
                    <button type="button" class="btn-media-action delete" title="Видалити" onclick="app.removeGalleryImage(${index})">🗑️</button>
                </div>
            `;
            grid.appendChild(item);
        });
    },

    copyImageUrl(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('URL скопійовано в буфер обміну!', 'info');
        });
    },

    setCoverImage(url) {
        this.currentCoverImage = url;
        this.isProjectFormDirty = true;
        this.renderProjectGallery();
        this.showToast('Головну обкладинку обрано!', 'info');
    },

    removeGalleryImage(index) {
        const removed = this.currentProjectImages.splice(index, 1)[0];
        if (this.currentCoverImage === removed) {
            this.currentCoverImage = this.currentProjectImages[0] || '';
        }
        this.isProjectFormDirty = true;
        this.renderProjectGallery();
    },

    // ================= CATEGORIES =================
    async initCategoriesView() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">Завантаження категорій...</td></tr>`;

        try {
            const res = await API.getCategories();
            this.categories = res.categories || [];

            tbody.innerHTML = '';

            if (this.categories.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">Категорій ще немає. Створіть першу категорію!</td></tr>`;
                return;
            }

            this.categories.forEach((c, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 800; color: var(--color-accent);">${c.sort_order || index + 1}</td>
                    <td><code>${c.slug}</code></td>
                    <td><strong>${c.name_ua}</strong></td>
                    <td>${c.name_en}</td>
                    <td>
                        <span class="badge-pill" style="background: rgba(229,128,19,0.15); color: var(--color-accent);">📁 ${c.project_count || 0} робіт</span>
                    </td>
                    <td>
                        <span class="badge-pill ${c.is_visible ? 'published' : 'hidden'}">
                            ${c.is_visible ? '🟢 Видима' : '⚪ Прихована'}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action-sm" onclick="app.openCategoryModal('${c.id}')">✏️ Редагувати</button>
                            <button class="btn-action-sm delete" onclick="app.deleteCategory('${c.id}', '${c.name_ua}', ${c.project_count || 0})">🗑️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            this.showToast('Помилка завантаження категорій', 'error');
        }
    },

    openCategoryModal(catId = null) {
        const modalTitle = document.getElementById('categoryModalTitle');
        const form = document.getElementById('categoryForm');

        if (!catId) {
            modalTitle.textContent = 'Створення нової категорії';
            form.reset();
            document.getElementById('categoryFormId').value = '';
            document.getElementById('categoryIsVisible').checked = true;
            this.openModal('categoryModal');
        } else {
            modalTitle.textContent = 'Редагування категорії';
            const cat = this.categories.find(c => c.id === catId);
            if (cat) {
                document.getElementById('categoryFormId').value = cat.id;
                document.getElementById('categoryNameUa').value = cat.name_ua;
                document.getElementById('categoryNameEn').value = cat.name_en;
                document.getElementById('categorySlug').value = cat.slug;
                document.getElementById('categoryIsVisible').checked = Boolean(cat.is_visible);
                this.openModal('categoryModal');
            }
        }
    },

    async handleCategorySave(e) {
        e.preventDefault();
        const id = document.getElementById('categoryFormId').value;
        const submitBtn = document.getElementById('btnSaveCategory');
        submitBtn.disabled = true;

        const payload = {
            name_ua: document.getElementById('categoryNameUa').value.trim(),
            name_en: document.getElementById('categoryNameEn').value.trim(),
            slug: document.getElementById('categorySlug').value.trim(),
            is_visible: document.getElementById('categoryIsVisible').checked ? 1 : 0
        };

        try {
            if (id) {
                await API.updateCategory(id, payload);
                this.showToast('Категорію оновлено!', 'success');
            } else {
                await API.createCategory(payload);
                this.showToast('Категорію створено!', 'success');
            }
            this.closeModal('categoryModal');
            this.initCategoriesView();
        } catch (err) {
            this.showToast(err.data?.error || 'Помилка збереження категорії', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    },

    deleteCategory(id, name, projectCount) {
        if (projectCount > 0) {
            // Need reassignment
            const otherCategories = this.categories.filter(c => c.id !== id);
            let selectHtml = `<div style="margin-top: 14px; text-align: left;"><label style="font-size: 0.85rem; font-weight:700; color: var(--text-muted);">Перенести ${projectCount} проєкт(ів) у категорію:</label><select id="reassignCategorySelect" class="admin-select" style="margin-top: 6px;">`;
            otherCategories.forEach(c => {
                selectHtml += `<option value="${c.id}">${c.name_ua}</option>`;
            });
            selectHtml += `</select></div>`;

            this.confirmDialog({
                title: 'Категорія містить проєкти!',
                message: `У категорії "${name}" знаходиться ${projectCount} проєкт(ів). Оберіть, куди їх перенести перед видаленням:`,
                extraContent: selectHtml,
                confirmText: 'Перенести та видалити',
                onConfirm: async () => {
                    const targetId = document.getElementById('reassignCategorySelect')?.value;
                    try {
                        await API.deleteCategory(id, targetId);
                        this.showToast('Категорію видалено, проєкти перенесено!', 'success');
                        this.initCategoriesView();
                    } catch (err) {
                        this.showToast(err.data?.error || 'Помилка видалення', 'error');
                    }
                }
            });
        } else {
            this.confirmDialog({
                title: 'Видалення категорії',
                message: `Ви впевнені, що бажаєте видалити категорію "${name}"?`,
                confirmText: 'Видалити',
                onConfirm: async () => {
                    try {
                        await API.deleteCategory(id);
                        this.showToast('Категорію видалено!', 'success');
                        this.initCategoriesView();
                    } catch (err) {
                        this.showToast('Не вдалося видалити категорію', 'error');
                    }
                }
            });
        }
    },

    // ================= SITE CONTENT =================
    async initContentView() {
        try {
            const res = await API.getContent();
            this.siteContent = res.content || {};

            // Fill Hero Form
            const hero = this.siteContent.hero || {};
            const heroForm = document.getElementById('formContentHero');
            if (heroForm) {
                for (const [k, v] of Object.entries(hero)) {
                    if (heroForm.elements[k]) heroForm.elements[k].value = v;
                }
            }

            // Fill Services Form
            const services = this.siteContent.services || {};
            const servicesForm = document.getElementById('formContentServices');
            if (servicesForm) {
                for (const [k, v] of Object.entries(services)) {
                    if (servicesForm.elements[k]) servicesForm.elements[k].value = v;
                }
            }

            // Fill FAQ Form
            const faq = this.siteContent.faq || {};
            const faqForm = document.getElementById('formContentFaq');
            if (faqForm) {
                for (const [k, v] of Object.entries(faq)) {
                    if (faqForm.elements[k]) faqForm.elements[k].value = v;
                }
            }

            // Fill Metrics Form
            const metrics = this.siteContent.metrics || {};
            const metricsForm = document.getElementById('formContentMetrics');
            if (metricsForm) {
                for (const [k, v] of Object.entries(metrics)) {
                    if (metricsForm.elements[k]) metricsForm.elements[k].value = v;
                }
            }

            // Fill Contacts Form
            const contacts = this.siteContent.contacts || {};
            const contactsForm = document.getElementById('formContentContacts');
            if (contactsForm) {
                for (const [k, v] of Object.entries(contacts)) {
                    if (contactsForm.elements[k]) contactsForm.elements[k].value = v;
                }
            }
        } catch (err) {
            this.showToast('Помилка завантаження контенту сайту', 'error');
        }
    },

    async handleContentSave(e, section) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Збереження...';

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value.trim();
        });

        try {
            await API.updateContent(section, data);
            this.showToast(`Секцію "${section.toUpperCase()}" збережено та оновлено на сайті!`, 'success');
        } catch (err) {
            this.showToast('Не вдалося зберегти контент', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    },

    // ================= MODALS & TOASTS =================
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    confirmDialog({ title, message, extraContent = '', confirmText = 'Підтвердити', onConfirm }) {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const extraEl = document.getElementById('confirmExtraContent');
        const btnProceed = document.getElementById('btnConfirmProceed');
        const btnCancel = document.getElementById('btnConfirmCancel');

        if (!modal) return;

        titleEl.textContent = title;
        msgEl.textContent = message;
        extraEl.innerHTML = extraContent;
        btnProceed.textContent = confirmText;

        const cleanup = () => {
            this.closeModal('confirmModal');
            btnProceed.replaceWith(btnProceed.cloneNode(true));
            btnCancel.replaceWith(btnCancel.cloneNode(true));
        };

        btnCancel.onclick = cleanup;
        btnProceed.onclick = async () => {
            cleanup();
            if (typeof onConfirm === 'function') await onConfirm();
        };

        this.openModal('confirmModal');
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
