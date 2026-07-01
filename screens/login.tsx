import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthentication } from '../hooks/authentication';

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthentication();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await login({ email, password });
      if (!success) {
        Alert.alert('Login Failed', error || 'Invalid credentials');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleType: 'resident' | 'admin' | 'security') => {
    let demoEmail = '';
    let demoPassword = 'password123';
    let demoName = '';
    let demoMobile = '';
    let demoBlock = '';
    let demoHouseNumber = '';
    let demoGate = '';

    if (roleType === 'resident') {
      demoEmail = 'resident@demo.com';
      demoName = 'Thiru Resident';
      demoMobile = '9876543210';
      demoBlock = 'Block A';
      demoHouseNumber = '101';
    } else if (roleType === 'admin') {
      demoEmail = 'admin@demo.com';
      demoName = 'Suresh Admin';
      demoMobile = '9988776655';
    } else {
      demoEmail = 'guard@demo.com';
      demoName = 'Raju Guard';
      demoMobile = '8877665544';
      demoGate = 'Main Gate 1';
    }

    setLoading(true);
    try {
      // Attempt login
      const result = await login({ email: demoEmail, password: demoPassword });
      if (!result.success) {
        // If credentials don't exist yet, auto-register
        const regResult = await register({
          email: demoEmail,
          password: demoPassword,
          role: roleType,
          name: demoName,
          mobile: demoMobile,
          block: demoBlock,
          houseNumber: demoHouseNumber,
          gate: demoGate,
        });

        if (regResult.success) {
          // Log in after successful registration
          await login({ email: demoEmail, password: demoPassword });
        } else {
          Alert.alert('Demo Register Failed', regResult.error || 'Unknown error');
        }
      }
    } catch (err: any) {
      Alert.alert('Demo Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo and Brand Header */}
          <View className="mb-10 mt-6 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/50">
              <MaterialCommunityIcons name="shield-key" size={36} color="white" />
            </View>
            <Text className="text-3xl font-extrabold tracking-widest text-white">
              QUATRUS <Text className="text-blue-500">VMS</Text>
            </Text>
            <Text className="mt-1 text-center text-sm font-medium text-slate-400">
              Visitor Management for Residential Quarters
            </Text>
          </View>

          {/* Input Fields Card */}
          <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <Text className="mb-6 text-xl font-bold text-white">Sign In</Text>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </Text>
              <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <MaterialCommunityIcons name="email-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="ml-3 flex-1 text-base text-white"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </Text>
              <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <MaterialCommunityIcons name="lock-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Enter password"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  className="ml-3 flex-1 text-base text-white"
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={loading}
              className="flex-row items-center justify-center rounded-xl bg-blue-600 py-4 shadow-lg shadow-blue-600/30">
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="mr-2 text-base font-bold text-white">Login</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="mt-6" onPress={() => navigation.navigate('Register')}>
              <Text className="text-center text-sm font-semibold text-blue-400">
                {"Don't have an account? Register Here"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Roles Container */}
          <View className="mt-2">
            <View className="mb-6 flex-row items-center">
              <View className="h-[1px] flex-1 bg-slate-800" />
              <Text className="mx-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Demo Logins (1-Tap Test)
              </Text>
              <View className="h-[1px] flex-1 bg-slate-800" />
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleDemoLogin('resident')}
                className="mx-1 flex-1 items-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <MaterialCommunityIcons name="home-account" size={24} color="#3b82f6" />
                <Text className="mt-2 text-xs font-bold text-white">Resident</Text>
                <Text className="mt-0.5 text-[10px] text-slate-500">Block A-101</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleDemoLogin('admin')}
                className="mx-1 flex-1 items-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <MaterialCommunityIcons name="shield-crown-outline" size={24} color="#10b981" />
                <Text className="mt-2 text-xs font-bold text-white">Admin</Text>
                <Text className="mt-0.5 text-[10px] text-slate-500">Control Panel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleDemoLogin('security')}
                className="mx-1 flex-1 items-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <MaterialCommunityIcons name="security" size={24} color="#f59e0b" />
                <Text className="mt-2 text-xs font-bold text-white">Guard</Text>
                <Text className="mt-0.5 text-[10px] text-slate-500">Gate Check</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
