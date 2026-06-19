import { View, Text, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

export default function Home() {
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-3xl font-bold mb-8">
        Welcome to Quatrus
      </Text>

      <TouchableOpacity
        className="bg-red-500 px-6 py-3 rounded-xl"
        onPress={logout}
      >
        <Text className="text-white font-bold text-lg">
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}  