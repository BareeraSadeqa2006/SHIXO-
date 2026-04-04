import axios from 'axios';

const BASE = '/api';

export const getDashboardStats = () => axios.get(`${BASE}/dashboard_stats`).then(r => r.data);
export const getTeachers = (search = '', page = 1, limit = 20) =>
  axios.get(`${BASE}/teachers`, { params: { search, page, limit } }).then(r => r.data);
export const getSchools = (search = '', page = 1, limit = 20) =>
  axios.get(`${BASE}/schools`, { params: { search, page, limit } }).then(r => r.data);
export const predictTransfer = (teacher_id) =>
  axios.post(`${BASE}/predict_transfer`, { teacher_id }).then(r => r.data);
export const recommendSchool = (teacher_id) =>
  axios.post(`${BASE}/recommend_school`, { teacher_id }).then(r => r.data);
export const executeTransfer = (teacher_id, target_school_id) =>
  axios.post(`${BASE}/execute_transfer`, { teacher_id, target_school_id }).then(r => r.data);
export const getWorkforceData = () => axios.get(`${BASE}/workforce_data`).then(r => r.data);
export const getModelInfo = () => axios.get(`${BASE}/model_info`).then(r => r.data);
