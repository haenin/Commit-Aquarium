import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
})

export const getMe = () => api.get('/api/me')

export const getContributions = () => api.get('/api/contributions')
