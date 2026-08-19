// Centralized API client for Admin Panel
const API = {
    async request(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        const config = {
            ...options,
            headers: options.body instanceof FormData ? undefined : { ...defaultHeaders, ...options.headers }
        };

        try {
            const res = await fetch(url, config);
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 401 && !url.includes('/api/auth/login')) {
                    // Trigger logout/auth screen
                    if (window.auth) window.auth.showLogin();
                }
                const error = new Error(data.error || `HTTP error ${res.status}`);
                error.status = res.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (err) {
            console.error(`API Error [${options.method || 'GET'} ${url}]:`, err);
            throw err;
        }
    },

    // Auth
    login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    logout() {
        return this.request('/api/auth/logout', { method: 'POST' });
    },

    getMe() {
        return this.request('/api/auth/me');
    },

    changePassword(currentPassword, newPassword) {
        return this.request('/api/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    // Projects
    getProjects(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/projects?${query}`);
    },

    getProject(id) {
        return this.request(`/api/projects/${id}`);
    },

    createProject(projectData) {
        return this.request('/api/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    },

    updateProject(id, projectData) {
        return this.request(`/api/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    },

    toggleProjectStatus(id, is_published) {
        return this.request(`/api/projects/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ is_published })
        });
    },

    reorderProjects(orderedIds) {
        return this.request('/api/projects/reorder', {
            method: 'PUT',
            body: JSON.stringify({ orderedIds })
        });
    },

    deleteProject(id) {
        return this.request(`/api/projects/${id}`, { method: 'DELETE' });
    },

    // Categories
    getCategories() {
        return this.request('/api/categories');
    },

    createCategory(categoryData) {
        return this.request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    },

    updateCategory(id, categoryData) {
        return this.request(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    },

    deleteCategory(id, targetCategoryId = null) {
        const url = targetCategoryId 
            ? `/api/categories/${id}?targetCategoryId=${targetCategoryId}`
            : `/api/categories/${id}`;
        return this.request(url, { method: 'DELETE' });
    },

    reorderCategories(orderedIds) {
        return this.request('/api/categories/reorder', {
            method: 'PUT',
            body: JSON.stringify({ orderedIds })
        });
    },

    // Site Content
    getContent() {
        return this.request('/api/content');
    },

    updateContent(section, data) {
        return this.request(`/api/content/${section}`, {
            method: 'PUT',
            body: JSON.stringify({ data })
        });
    },

    // Media Upload
    uploadFiles(files) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        return this.request('/api/projects/upload', {
            method: 'POST',
            body: formData
        });
    }
};

window.API = API;
