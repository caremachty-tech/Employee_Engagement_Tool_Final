import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

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

export default API;
