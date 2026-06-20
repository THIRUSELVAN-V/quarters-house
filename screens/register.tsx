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

export default function Register({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<'resident' | 'admin' | 'security'>('resident');
  
  // Role-specific fields
  const [block, setBlock] = useState("Block A");
  const [houseNumber, setHouseNumber] = useState("");
  const [gate, setGate] = useState("Main Gate");

  const [loading, setLoading] = useState(false);
  const { register } = useAuthentication();

  const handleRegister = async () => {
    if (!email || !password || !name || !mobile) {
      Alert.alert("Error", "Please fill in all basic profile fields");
      return;
    }

    if (role === 'resident' && (!block || !houseNumber)) {
      Alert.alert("Error", "Please fill in your Block and House Number");
      return;
    }

    if (role === 'security' && !gate) {
      Alert.alert("Error", "Please fill in your Gate Station");
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
        block,
        houseNumber,
        gate,
      });

      if (success) {
        Alert.alert("Success", "Account created successfully!");
      } else {
        Alert.alert("Registration Failed", error || "Could not register user");
      }
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message);
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
        {/* Header */}
        <View className="items-center mb-8 mt-4">
          <Text className="text-3xl font-extrabold text-white tracking-widest">
            CREATE <Text className="text-blue-500">ACCOUNT</Text>
          </Text>
          <Text className="text-slate-400 text-sm mt-1">
            Join the Quatrus Resident & VMS Portal
          </Text>
        </View>

        {/* Form Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
          {/* Role Segmented Selector */}
          <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Select Role</Text>
          <View className="flex-row bg-slate-950 p-1 border border-slate-800 rounded-xl mb-6">
            <TouchableOpacity
              onPress={() => setRole('resident')}
              className={`flex-1 py-2.5 rounded-lg items-center ${role === 'resident' ? 'bg-blue-600' : 'bg-transparent'}`}
            >
              <Text className={`font-bold text-xs ${role === 'resident' ? 'text-white' : 'text-slate-400'}`}>Resident</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('admin')}
              className={`flex-1 py-2.5 rounded-lg items-center ${role === 'admin' ? 'bg-blue-600' : 'bg-transparent'}`}
            >
              <Text className={`font-bold text-xs ${role === 'admin' ? 'text-white' : 'text-slate-400'}`}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('security')}
              className={`flex-1 py-2.5 rounded-lg items-center ${role === 'security' ? 'bg-blue-600' : 'bg-transparent'}`}
            >
              <Text className={`font-bold text-xs ${role === 'security' ? 'text-white' : 'text-slate-400'}`}>Security</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Fields */}
          <View className="mb-4">
            <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Full Name</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <MaterialCommunityIcons name="account-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter full name"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
                className="flex-1 text-white ml-3 text-base"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Mobile Number</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <MaterialCommunityIcons name="phone-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter mobile number"
                placeholderTextColor="#64748b"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                className="flex-1 text-white ml-3 text-base"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Email Address</Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <MaterialCommunityIcons name="email-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter email address"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 text-white ml-3 text-base"
              />
            </View>
          </View>

          <View className="mb-4">
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

          {/* Conditional Role-Based Fields */}
          {role === 'resident' && (
            <View className="mb-6 border-t border-slate-800 pt-4 mt-2">
              <Text className="text-blue-500 font-bold text-sm mb-4 uppercase tracking-wider">Resident Details</Text>
              
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Block Number</Text>
                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                  <MaterialCommunityIcons name="office-building" size={20} color="#64748b" />
                  <TextInput
                    placeholder="e.g. Block A"
                    placeholderTextColor="#64748b"
                    value={block}
                    onChangeText={setBlock}
                    className="flex-1 text-white ml-3 text-base"
                  />
                </View>
              </View>

              <View className="mb-2">
                <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">House / Quarters Number</Text>
                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                  <MaterialCommunityIcons name="door" size={20} color="#64748b" />
                  <TextInput
                    placeholder="e.g. A-101"
                    placeholderTextColor="#64748b"
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    className="flex-1 text-white ml-3 text-base"
                  />
                </View>
              </View>
            </View>
          )}

          {role === 'security' && (
            <View className="mb-6 border-t border-slate-800 pt-4 mt-2">
              <Text className="text-amber-500 font-bold text-sm mb-4 uppercase tracking-wider">Security Station</Text>
              
              <View className="mb-2">
                <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Assigned Gate / Entrance</Text>
                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                  <MaterialCommunityIcons name="boom-gate" size={20} color="#64748b" />
                  <TextInput
                    placeholder="e.g. Main Gate, West Gate"
                    placeholderTextColor="#64748b"
                    value={gate}
                    onChangeText={setGate}
                    className="flex-1 text-white ml-3 text-base"
                  />
                </View>
              </View>
            </View>
          )}

          {role === 'admin' && (
            <View className="mb-6 border-t border-slate-800 pt-4 mt-2">
              <Text className="text-emerald-500 font-bold text-sm mb-2 uppercase tracking-wider">System Administration</Text>
              <Text className="text-slate-400 text-xs">
                Administrators can review and approve all community passes, view dashboard analytics, and configure blocks/houses.
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={loading}
            className="bg-blue-600 rounded-xl py-4 flex-row justify-center items-center shadow-lg shadow-blue-600/30"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-base font-bold mr-2">Create Account</Text>
                <MaterialCommunityIcons name="check-bold" size={18} color="white" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-6"
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-center text-blue-400 text-sm font-semibold">
              Already have an account? Login Here
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}