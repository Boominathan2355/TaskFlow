import api from './api';

// Auth APIs
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh')
};

// User APIs
export const userAPI = {
    getAllUsers: () => api.get('/users'),
    getUserById: (id) => api.get(`/users/${id}`),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
    deleteUser: (id) => api.delete(`/users/${id}`),
    createUser: (data) => api.post('/users', data)
};

// Project APIs
export const projectAPI = {
    getAllProjects: () => api.get('/projects'),
    getProjectById: (id) => api.get(`/projects/${id}`),
    createProject: (data) => api.post('/projects', data),
    updateProject: (id, data) => api.put(`/projects/${id}`, data),
    deleteProject: (id) => api.delete(`/projects/${id}`),
    addMember: (projectId, userId, role) =>
        api.post(`/projects/${projectId}/members`, { userId, role }),
    removeMember: (projectId, userId) =>
        api.delete(`/projects/${projectId}/members`, { data: { userId } }),
    getUserProjects: (userId) => api.get(`/projects/assignments/user/${userId}`),
    updateUserProjects: (userId, projectIds) => api.put(`/projects/assignments/user/${userId}`, { projectIds })
};

// Task APIs
export const taskAPI = {
    getMyTasks: () => api.get('/tasks/my-tasks'),
    getProjectTasks: (projectId) => api.get(`/tasks/project/${projectId}`),
    getTaskById: (id) => api.get(`/tasks/${id}`),
    createTask: (data) => api.post('/tasks', data),
    updateTask: (id, data) => api.put(`/tasks/${id}`, data),
    deleteTask: (id) => api.delete(`/tasks/${id}`),
    addComment: (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text }),
    deleteComment: (taskId, commentId) =>
        api.delete(`/tasks/${taskId}/comments/${commentId}`),
    addAttachment: (taskId, data) => api.post(`/tasks/${taskId}/attachments`, data),
    toggleVote: (taskId) => api.post(`/tasks/${taskId}/vote`),
    toggleWatch: (taskId) => api.post(`/tasks/${taskId}/watch`),
    searchTasks: (query) => api.get('/tasks/utility/search', { params: { query } })
};

// Notification APIs
export const notificationAPI = {
    getNotifications: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread/count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    clearAll: () => api.delete('/notifications')
};

// Activity APIs
export const activityAPI = {
    getProjectActivity: (projectId) => api.get(`/activity/project/${projectId}`),
    getTaskActivity: (taskId) => api.get(`/activity/task/${taskId}`)
};

// Upload API
export const uploadAPI = {
    uploadFile: (formData) => api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
};
// Storage Management APIs
export const storageAPI = {
    getFiles: () => api.get('/upload/list'),
    deleteFile: (filename) => api.delete(`/upload/${filename}`)
};
