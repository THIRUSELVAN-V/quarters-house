import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";

import { auth } from "../../firebase/config";
import { useAuthentication, UserProfile } from "../../hooks/authentication";
import { useDatabase, VisitorRequest } from "../../hooks/database";

export default function ResidentDashboard({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passes, setPasses] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { getUserProfile } = useAuthentication();
  const { getResidentVisitorRequests } = useDatabase();

  const loadData = async () => {
    if (!auth.currentUser) return;
    try {
      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);
      
      const reqs = await getResidentVisitorRequests(auth.currentUser.uid);
      setPasses(reqs);
    } catch (error: any) {
      Alert.alert("Error loading data", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reload data whenever screen comes into focus (e.g. after creating a pass)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  // Filter requests
  const activePasses = passes.filter(p => p.status === 'pending' || (p.status === 'approved' && !p.checkOutTime));
  const pastPasses = passes.filter(p => p.status === 'rejected' || !!p.checkOutTime);

  // Compute stat counts
  const pendingCount = passes.filter(p => p.status === 'pending').length;
  const approvedCount = passes.filter(p => p.status === 'approved' && !p.checkInTime).length;
  const insideCount = passes.filter(p => p.checkInTime && !p.checkOutTime).length;

  const renderStatusBadge = (status: string, checkedIn: boolean, checkedOut: boolean) => {
    if (checkedOut) {
      return (
        <View className="bg-purple-900/30 border border-purple-500/30 px-2.5 py-1 rounded-full flex-row items-center">
          <View className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5" />
          <Text className="text-purple-400 text-xs font-bold uppercase">Checked Out</Text>
        </View>
      );
    }
    if (checkedIn) {
      return (
        <View className="bg-blue-900/30 border border-blue-500/30 px-2.5 py-1 rounded-full flex-row items-center">
          <View className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
          <Text className="text-blue-400 text-xs font-bold uppercase">Inside Quarters</Text>
        </View>
      );
    }
    switch (status) {
      case 'approved':
        return (
          <View className="bg-emerald-900/30 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            <Text className="text-emerald-400 text-xs font-bold uppercase">Approved</Text>
          </View>
        );
      case 'rejected':
        return (
          <View className="bg-red-900/30 border border-red-500/30 px-2.5 py-1 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
            <Text className="text-red-400 text-xs font-bold uppercase">Rejected</Text>
          </View>
        );
      default:
        return (
          <View className="bg-amber-900/30 border border-amber-500/30 px-2.5 py-1 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            <Text className="text-amber-400 text-xs font-bold uppercase">Pending Admin</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header Banner */}
      <View className="bg-slate-900 border-b border-slate-800 pt-14 pb-6 px-6 flex-row justify-between items-center">
        <View>
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Resident Space</Text>
          <Text className="text-white text-2xl font-extrabold mt-1">{profile?.name || "Resident"}</Text>
          <Text className="text-blue-400 text-sm font-semibold mt-0.5">
            {profile?.block} • House {profile?.houseNumber}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-slate-800/80 p-3 rounded-full border border-slate-700/50"
        >
          <MaterialCommunityIcons name="logout" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Statistics Grid */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 mr-2 items-center">
            <Text className="text-amber-500 text-2xl font-bold">{pendingCount}</Text>
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1">Pending</Text>
          </View>

          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 mx-1 mr-2 items-center">
            <Text className="text-emerald-500 text-2xl font-bold">{approvedCount}</Text>
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1">Approved</Text>
          </View>

          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 ml-1 items-center">
            <Text className="text-blue-500 text-2xl font-bold">{insideCount}</Text>
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1">Active In</Text>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("CreatePass")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-blue-600 rounded-2xl p-5 flex-row items-center justify-between mb-8 shadow-lg shadow-blue-500/20"
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2.5 rounded-xl mr-4">
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="white" />
            </View>
            <View>
              <Text className="text-white font-extrabold text-base">New Visitor Pass</Text>
              <Text className="text-blue-100 text-xs font-semibold mt-0.5">Pre-approve friends, relatives & guests</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
        </TouchableOpacity>

        {/* Active Passes Section */}
        <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Active & Upcoming Passes</Text>
        
        {activePasses.length === 0 ? (
          <View className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 items-center justify-center mb-8">
            <MaterialCommunityIcons name="account-clock-outline" size={40} color="#475569" />
            <Text className="text-slate-400 font-medium text-sm mt-3 text-center">No active visitor passes found.</Text>
            <Text className="text-slate-600 text-xs mt-1 text-center">Create a pass for upcoming visits.</Text>
          </View>
        ) : (
          <View className="mb-6">
            {activePasses.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("PassDetails", { passId: item.id })}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex-row justify-between items-center"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-white font-bold text-base mr-2">{item.visitorName}</Text>
                    <Text className="text-slate-500 text-xs font-semibold">({item.numberOfVisitors > 1 ? `${item.numberOfVisitors} visitors` : '1 visitor'})</Text>
                  </View>

                  <Text className="text-slate-400 text-xs font-medium mb-2 flex-row items-center">
                    <MaterialCommunityIcons name="account-group-outline" size={12} color="#94a3b8" /> {item.relationship} • {item.purpose}
                  </Text>
                  
                  <View className="flex-row items-center text-slate-500 text-[11px] font-semibold">
                    <MaterialCommunityIcons name="calendar-range" size={12} color="#64748b" className="mr-1" />
                    <Text className="text-slate-500">
                      {new Date(item.arrivalDateTime).toLocaleDateString()} {new Date(item.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  {renderStatusBadge(item.status, !!item.checkInTime, !!item.checkOutTime)}
                  {item.status === 'approved' && (
                    <Text className="text-blue-400 text-[10px] font-semibold uppercase mt-2 tracking-wider flex-row items-center">
                      View Pass <MaterialCommunityIcons name="qrcode" size={10} color="#60a5fa" />
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* History Section */}
        <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Recent Visitor History</Text>
        
        {pastPasses.length === 0 ? (
          <View className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-6 items-center justify-center mb-10">
            <Text className="text-slate-600 text-xs font-medium">No historical logs yet.</Text>
          </View>
        ) : (
          <View className="mb-10">
            {pastPasses.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("PassDetails", { passId: item.id })}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 mb-3 flex-row justify-between items-center opacity-70"
              >
                <View>
                  <Text className="text-slate-300 font-bold text-sm">{item.visitorName}</Text>
                  <Text className="text-slate-500 text-xs mt-1">{item.relationship} • {item.purpose}</Text>
                  <Text className="text-slate-600 text-[10px] mt-1">
                    Arrived: {item.checkInTime ? new Date(item.checkInTime).toLocaleString() : 'N/A'}
                  </Text>
                </View>

                <View className="items-end">
                  {renderStatusBadge(item.status, !!item.checkInTime, !!item.checkOutTime)}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
