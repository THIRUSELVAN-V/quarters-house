import { View, Text, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Home() {
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="mb-8 text-3xl font-bold">Welcome to Quatrus</Text>

      <TouchableOpacity className="rounded-xl bg-red-500 px-6 py-3" onPress={logout}>
        <Text className="text-lg font-bold text-white">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
