import React, { useState } from "react";
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthentication } from "../hooks/authentication";

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuthentication();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const { success, error } = await login({ email, password });
      if (!success) {
        Alert.alert("Login Failed", error || "Invalid credentials");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleType: 'resident' | 'admin' | 'security') => {
    let demoEmail = "";
    let demoPassword = "password123";
    let demoName = "";
    let demoMobile = "";
    let demoBlock = "";
    let demoHouseNumber = "";
    let demoGate = "";

    if (roleType === 'resident') {
      demoEmail = "resident@demo.com";
      demoName = "Thiru Resident";
      demoMobile = "9876543210";
      demoBlock = "Block A";
      demoHouseNumber = "101";
    } else if (roleType === 'admin') {
      demoEmail = "admin@demo.com";
      demoName = "Suresh Admin";
      demoMobile = "9988776655";
    } else {
      demoEmail = "guard@demo.com";
      demoName = "Raju Guard";
      demoMobile = "8877665544";
      demoGate = "Main Gate 1";
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
          gate: demoGate
        });

        if (regResult.success) {
          // Log in after successful registration
          await login({ email: demoEmail, password: demoPassword });
        } else {
          Alert.alert("Demo Register Failed", regResult.error || "Unknown error");
        }
      }
    } catch (err: any) {
      Alert.alert("Demo Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-12 justify-center flex-1">
        {/* Logo and Brand Header */}
        <View className="items-center mb-10 mt-6">
          <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/50 mb-4">
            <MaterialCommunityIcons name="shield-key" size={36} color="white" />
          </View>
          <Text className="text-3xl font-extrabold tracking-widest text-white">
            QUATRUS <Text className="text-blue-500">VMS</Text>
          </Text>
          <Text className="text-slate-400 text-sm mt-1 text-center font-medium">
            Visitor Management for Residential Quarters
          </Text>
        </View>

        {/* Input Fields Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
          <Text className="text-xl font-bold text-white mb-6">Sign In</Text>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Email Address</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <MaterialCommunityIcons name="email-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 text-white ml-3 text-base"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Password</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <MaterialCommunityIcons name="lock-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                className="flex-1 text-white ml-3 text-base"
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
            className="bg-blue-600 rounded-xl py-4 flex-row justify-center items-center shadow-lg shadow-blue-600/30"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-base font-bold mr-2">Login</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="white" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-6"
            onPress={() => navigation.navigate("Register")}
          >
            <Text className="text-center text-blue-400 text-sm font-semibold">
              Don't have an account? Register Here
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Roles Container */}
        <View className="mt-2">
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-slate-800" />
            <Text className="mx-4 text-slate-500 font-semibold uppercase text-xs tracking-widest">
              Demo Logins (1-Tap Test)
            </Text>
            <View className="flex-1 h-[1px] bg-slate-800" />
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDemoLogin('resident')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 items-center mx-1"
            >
              <MaterialCommunityIcons name="home-account" size={24} color="#3b82f6" />
              <Text className="text-white font-bold text-xs mt-2">Resident</Text>
              <Text className="text-slate-500 text-[10px] mt-0.5">Block A-101</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDemoLogin('admin')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 items-center mx-1"
            >
              <MaterialCommunityIcons name="shield-crown-outline" size={24} color="#10b981" />
              <Text className="text-white font-bold text-xs mt-2">Admin</Text>
              <Text className="text-slate-500 text-[10px] mt-0.5">Control Panel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDemoLogin('security')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 items-center mx-1"
            >
              <MaterialCommunityIcons name="security" size={24} color="#f59e0b" />
              <Text className="text-white font-bold text-xs mt-2">Guard</Text>
              <Text className="text-slate-500 text-[10px] mt-0.5">Gate Check</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}