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

export default function Register({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<'admin' | 'security'>('admin');

  // Role-specific fields
  const [gate, setGate] = useState('Main Gate');

  const [loading, setLoading] = useState(false);
  const { register } = useAuthentication();

  const handleRegister = async () => {
    if (!email || !password || !name || !mobile) {
      Alert.alert('Error', 'Please fill in all basic profile fields');
      return;
    }

    if (role === 'security' && !gate) {
      Alert.alert('Error', 'Please fill in your Gate Station');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await register({
        email,
        password,
        role,
        name,
        mobile,
        gate,
      });

      if (success) {
        Alert.alert('Success', 'Account created successfully!');
      } else {
        Alert.alert('Registration Failed', error || 'Could not register user');
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
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
          {/* Header */}
          <View className="mb-8 mt-4 items-center">
            <Text className="text-3xl font-extrabold tracking-widest text-white">
              CREATE <Text className="text-blue-500">ACCOUNT</Text>
            </Text>
            <Text className="mt-1 text-sm text-slate-400">
              Join the Quatrus Staff & Security Portal
            </Text>
          </View>

          {/* Form Card */}
          <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            {/* Role Segmented Selector */}
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Role
            </Text>
            <View className="mb-6 flex-row rounded-xl border border-slate-800 bg-slate-950 p-1">
              <TouchableOpacity
                onPress={() => setRole('admin')}
                className={`flex-1 items-center rounded-lg py-2.5 ${role === 'admin' ? 'bg-blue-600' : 'bg-transparent'}`}>
                <Text
                  className={`text-xs font-bold ${role === 'admin' ? 'text-white' : 'text-slate-400'}`}>
                  Admin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('security')}
                className={`flex-1 items-center rounded-lg py-2.5 ${role === 'security' ? 'bg-blue-600' : 'bg-transparent'}`}>
                <Text
                  className={`text-xs font-bold ${role === 'security' ? 'text-white' : 'text-slate-400'}`}>
                  Security
                </Text>
              </TouchableOpacity>
            </View>

            {/* Basic Fields */}
            <View className="mb-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Name
              </Text>
              <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <MaterialCommunityIcons name="account-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Enter full name"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                  className="ml-3 flex-1 text-base text-white"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mobile Number
              </Text>
              <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <MaterialCommunityIcons name="phone-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Enter mobile number"
                  placeholderTextColor="#64748b"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  className="ml-3 flex-1 text-base text-white"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </Text>
              <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <MaterialCommunityIcons name="email-outline" size={20} color="#64748b" />
                <TextInput
                  placeholder="Enter email address"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="ml-3 flex-1 text-base text-white"
                />
              </View>
            </View>

            <View className="mb-4">
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

            {/* Conditional Role-Based Fields */}
            {role === 'security' && (
              <View className="mb-6 mt-2 border-t border-slate-800 pt-4">
                <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-500">
                  Security Station
                </Text>

                <View className="mb-2">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Gate / Entrance
                  </Text>
                  <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                    <MaterialCommunityIcons name="boom-gate" size={20} color="#64748b" />
                    <TextInput
                      placeholder="e.g. Main Gate, West Gate"
                      placeholderTextColor="#64748b"
                      value={gate}
                      onChangeText={setGate}
                      className="ml-3 flex-1 text-base text-white"
                    />
                  </View>
                </View>
              </View>
            )}

            {role === 'admin' && (
              <View className="mb-6 mt-2 border-t border-slate-800 pt-4">
                <Text className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-500">
                  System Administration
                </Text>
                <Text className="text-xs text-slate-400">
                  Administrators can review and approve all community passes, register residents,
                  view dashboard analytics, and configure blocks/houses.
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading}
              className="flex-row items-center justify-center rounded-xl bg-blue-600 py-4 shadow-lg shadow-blue-600/30">
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="mr-2 text-base font-bold text-white">Create Account</Text>
                  <MaterialCommunityIcons name="check-bold" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="mt-6" onPress={() => navigation.navigate('Login')}>
              <Text className="text-center text-sm font-semibold text-blue-400">
                Already have an account? Login Here
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
