import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Para emulador Android
// const API_URL = 'http://10.0.2.2:8000/api';

// Para emulador iOS
// const API_URL = 'http://localhost:8000/api';

// Para dispositivo físico (substitua pelo IP da sua máquina)
// const API_URL = 'http://192.168.1.100:8000/api';

const api = axios.create({
    baseURL: 'http://192.168.15.12:8000/api',
     // Altere conforme necessário
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
});

// Interceptor para adicionar token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            delete api.defaults.headers.Authorization;
        }
        return Promise.reject(error);
    }
);

export { api };