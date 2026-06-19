import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { useAuthentication } from "hooks/authentication";

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuthentication();

  const handleLogin = async () => {
    try {
        const {success,error} = await login({ email, password });
        if (!success) {
            Alert.alert("Login Failed", error);
        }

    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">
        Login
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        className="border border-gray-300 rounded-xl p-4 mb-4"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="border border-gray-300 rounded-xl p-4 mb-6"
      />

      <TouchableOpacity
        className="bg-blue-600 p-4 rounded-xl"
        onPress={handleLogin}
      >
        <Text className="text-white text-center font-bold">
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4"
        onPress={() => navigation.navigate("Register")}
      >
        <Text className="text-center text-blue-600">
          Don&apos;t have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}