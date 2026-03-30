import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://employee-engagement-tool-final-3.onrender.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Add interceptor to include token in headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth
export const login = (credentials) => API.post('/api/auth/login', credentials);
export const getMe = () => API.get('/api/auth/me');
export const changePassword = (data) => API.post('/api/auth/change-password', data);

// Admin
export const getUsers = () => API.get('/api/admin/users');
export const createUser = (data) => API.post('/api/admin/users', data);
export const updateUser = (id, data) => API.put(`/api/admin/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/api/admin/users/${id}`);

// Master
export const getMaster = () => API.get('/master');
export const addMaster = (data) => API.post('/master', data);
export const updateMaster = (id, data) => API.put(`/master/${id}`, data);
export const deleteMaster = (id) => API.delete(`/master/${id}`);

// Regions
export const getRegions = () => API.get('/regions');

// Planner
export const getPlanner = () => API.get('/planner');
export const addPlanner = (data) => API.post('/planner', data);
export const updatePlanner = (id, data) => API.put(`/planner/${id}`, data);
export const deletePlanner = (id) => API.delete(`/planner/${id}`);

// Planned vs Actual
export const getActual = (planner_id) => API.get(`/planned-vs-actual/${planner_id}`);
export const saveActual = (formData) => API.post('/planned-vs-actual', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteActualDoc = (planner_id, url) => API.delete('/planned-vs-actual/doc', { data: { planner_id, url } });

// Budget Utilisation
export const getBudgetUtilisation = () => API.get('/budget-utilisation');

// Reports
export const getReports = () => API.get('/reports');

// Poster
export const getPoster = (planner_id) => API.get(`/poster/${planner_id}`);
export const savePoster = (formData) => API.post('/poster', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deletePosterDoc = (planner_id, url) => API.delete('/poster/doc', { data: { planner_id, url } });

// Mail
export const sendEventsMail = (data) => API.post('/send-events-mail', data);
export const cancelScheduledMail = (jobId) => API.post('/cancel-mail', { job_id: jobId });
export const getScheduledJobs = () => API.get('/scheduled-jobs');
export const updateScheduledJob = (id, data) => API.put(`/scheduled-jobs/${id}`, data);
export const deleteScheduledJob = (id) => API.delete(`/scheduled-jobs/${id}`);

export default API;