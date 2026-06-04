import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    // Redirecionar baseado no estado de autenticação
    return <Redirect href={user ? '/(app)/(tabs)' : '/(auth)/login'} />;
}