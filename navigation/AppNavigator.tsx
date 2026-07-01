import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';

import { auth } from '../firebase/config';
import { useAuthentication, UserProfile } from '../hooks/authentication';

import Login from '../screens/login';
import Register from '../screens/register';
import ResidentDashboard from '../screens/resident/Dashboard';
import CreatePass from '../screens/resident/CreatePass';
import PassDetails from '../screens/resident/PassDetails';
import AdminDashboard from '../screens/admin/Dashboard';
import GuardDashboard from '../screens/guard/Dashboard';
import AddResident from '../screens/admin/AddResident';
import SearchResidents from '../screens/admin/SearchResidents';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { getUserProfile } = useAuthentication();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile from Firestore to determine role
        const userProfile = await getUserProfile(currentUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && profile ? (
          // Role-based routing
          profile.role === 'admin' ? (
            <>
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
              <Stack.Screen name="PassDetails" component={PassDetails} />
              <Stack.Screen name="AddResident" component={AddResident} />
              <Stack.Screen name="SearchResidents" component={SearchResidents} />
            </>
          ) : profile.role === 'security' ? (
            <Stack.Screen name="GuardDashboard" component={GuardDashboard} />
          ) : (
            // Resident navigation group
            <>
              <Stack.Screen name="ResidentDashboard" component={ResidentDashboard} />
              <Stack.Screen name="CreatePass" component={CreatePass} />
              <Stack.Screen name="PassDetails" component={PassDetails} />
            </>
          )
        ) : (
          // Auth navigation group
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
