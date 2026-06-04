import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    matricula?: string;
}

interface AuthContextData {
    user: User | null;
    loading: boolean;  // Alterado de isLoading para loading
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Alterado de isLoading para loading

    useEffect(() => {
        loadStoredData();
    }, []);

    async function loadStoredData() {
        try {
            const token = await SecureStore.getItemAsync('token');
            const userData = await SecureStore.getItemAsync('user');
            
            if (token && userData) {
                api.defaults.headers.Authorization = `Bearer ${token}`;
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error loading auth data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function signIn(email: string, password: string) {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user: userData } = response.data;
            
            // Salvar token e dados do usuário
            await SecureStore.setItemAsync('token', access_token);
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            
            // Configurar header do axios
            api.defaults.headers.Authorization = `Bearer ${access_token}`;
            setUser(userData);
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async function signOut() {
        try {
            // Opcional: chamar API de logout
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            // Limpar dados locais
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            delete api.defaults.headers.Authorization;
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}