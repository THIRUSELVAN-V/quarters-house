import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";


import { useAuthentication } from "hooks/authentication";

export default function Register({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useAuthentication();

  const handleRegister = async () => {
    try {
      const {success,error,user } = await register({ email, password });
      console.log("User registered:", user);
        if (!success) {
            Alert.alert("Register Failed", error);

        }

    } catch (error: any) {
      Alert.alert("Register Failed", error.message);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">
        Register
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
        className="bg-green-600 p-4 rounded-xl"
        onPress={handleRegister}
      >
        <Text className="text-white text-center font-bold">
          Register
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4"
        onPress={() => navigation.navigate("Login")}
      >
        <Text className="text-center text-blue-600">
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}