import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE })

export const studentAPI = {
  login: (student_id) => api.post('/student/login', { student_id }),
  getProfile: (id) => api.get(`/student/${id}/profile`),
  updateProfile: (id, data) => api.put(`/student/${id}/profile`, data),
  getDashboard: (id) => api.get(`/student/${id}/dashboard`),
  getAnalysis: (id) => api.get(`/student/${id}/analysis`),
  getSkillGaps: (id) => api.get(`/student/${id}/skill-gaps`),
  getLearningPath: (id) => api.get(`/student/${id}/learning-path`),
  whatIf: (id, changes) => api.post(`/student/${id}/what-if`, { changes }),
  listStudents: () => api.get('/students'),
}

export const institutionAPI = {
  getDashboard: () => api.get('/institution/dashboard'),
  getStudents: () => api.get('/institution/students'),
  getBatchAnalytics: () => api.get('/institution/batch-analytics'),
}

export const predictAPI = {
  livePrediction: (data) => api.post('/predict/live', data),
  registerStudent: (data) => api.post('/student/register', data),
  uploadBatch: (students) => api.post('/institution/upload-batch', { students }),
}

export default api
