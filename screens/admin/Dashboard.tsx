import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { useFocusEffect } from "@react-navigation/native";

import { auth } from "../../firebase/config";
import { useDatabase, VisitorRequest, Block, House } from "../../hooks/database";
import { useAuthentication } from "../../hooks/authentication";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'requests' | 'community' | 'logs'>('analytics');
  
  // Data States
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States for Adding Block/House
  const [newBlockName, setNewBlockName] = useState("");
  const [newHouseBlock, setNewHouseBlock] = useState("");
  const [newHouseNumber, setNewHouseNumber] = useState("");
  const [newHouseFamilyCount, setNewHouseFamilyCount] = useState("4");

  const {
    getAllVisitorRequests,
    reviewVisitorRequest,
    getBlocks,
    getHouses,
    addBlock,
    addHouse,
    seedCommunityData,
  } = useDatabase();
  
  const { getAllUsersProfile } = useDatabase();

  const loadAllData = async () => {
    try {
      const allReqs = await getAllVisitorRequests();
      setRequests(allReqs);

      const allBlocks = await getBlocks();
      setBlocks(allBlocks);

      const allHouses = await getHouses();
      setHouses(allHouses);

      const allProfiles = await getAllUsersProfile();
      setResidents(allProfiles.filter((u: any) => u.role === 'resident'));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  // --- ACTIONS ---
  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const res = await reviewVisitorRequest(id, status);
      if (res.success) {
        Alert.alert("Success", `Pass request status updated to ${status}`);
        loadAllData();
      } else {
        Alert.alert("Error", res.error || "Failed to update request");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlockName) {
      Alert.alert("Error", "Please enter a block name");
      return;
    }
    setActionLoading(true);
    try {
      const res = await addBlock(newBlockName);
      if (res.success) {
        Alert.alert("Success", "Block added successfully");
        setNewBlockName("");
        loadAllData();
      } else {
        Alert.alert("Error", res.error || "Failed to add block");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHouse = async () => {
    if (!newHouseBlock || !newHouseNumber) {
      Alert.alert("Error", "Please fill in Block Name and House Number");
      return;
    }
    const count = parseInt(newHouseFamilyCount, 10);
    setActionLoading(true);
    try {
      const res = await addHouse(newHouseBlock, newHouseNumber, isNaN(count) ? 4 : count);
      if (res.success) {
        Alert.alert("Success", "House added successfully");
        setNewHouseNumber("");
        loadAllData();
      } else {
        Alert.alert("Error", res.error || "Failed to add house");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const res = await seedCommunityData();
      if (res.success) {
        Alert.alert("Success", res.message || "Seeding complete!");
        loadAllData();
      } else {
        Alert.alert("Error", res.error || "Failed to seed data");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STATS COMPUTATIONS ---
  const totalBlocks = blocks.length;
  const totalHouses = houses.length;
  const totalResidents = residents.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
  const activeVisitors = requests.filter(r => r.checkInTime && !r.checkOutTime).length;
  
  // Visitors Today (Arrival date is today)
  const todayStr = new Date().toISOString().split('T')[0];
  const visitorsToday = requests.filter(r => r.arrivalDateTime.startsWith(todayStr)).length;

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
      <View className="bg-slate-900 border-b border-slate-800 pt-14 pb-5 px-6 flex-row justify-between items-center">
        <View>
          <Text className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Admin Control Center</Text>
          <Text className="text-white text-2xl font-extrabold mt-1">VMS Dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-slate-800/80 p-3 rounded-full border border-slate-700/50"
        >
          <MaterialCommunityIcons name="logout" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      {/* Tabs Menu */}
      <View className="bg-slate-900 border-b border-slate-800 flex-row px-2">
        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'analytics' ? 'border-blue-500' : 'border-transparent'}`}
        >
          <MaterialCommunityIcons name="chart-bar" size={20} color={activeTab === 'analytics' ? '#3b82f6' : '#64748b'} />
          <Text className={`text-[10px] font-bold uppercase mt-1 ${activeTab === 'analytics' ? 'text-blue-500' : 'text-slate-500'}`}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'requests' ? 'border-blue-500' : 'border-transparent'}`}
        >
          <View className="relative">
            <MaterialCommunityIcons name="bell-badge-outline" size={20} color={activeTab === 'requests' ? '#3b82f6' : '#64748b'} />
            {pendingRequests > 0 && (
              <View className="absolute -top-1 -right-1.5 bg-red-500 w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-white text-[9px] font-bold">{pendingRequests}</Text>
              </View>
            )}
          </View>
          <Text className={`text-[10px] font-bold uppercase mt-1 ${activeTab === 'requests' ? 'text-blue-500' : 'text-slate-500'}`}>Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('community')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'community' ? 'border-blue-500' : 'border-transparent'}`}
        >
          <MaterialCommunityIcons name="account-group" size={20} color={activeTab === 'community' ? '#3b82f6' : '#64748b'} />
          <Text className={`text-[10px] font-bold uppercase mt-1 ${activeTab === 'community' ? 'text-blue-500' : 'text-slate-500'}`}>Community</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('logs')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'logs' ? 'border-blue-500' : 'border-transparent'}`}
        >
          <MaterialCommunityIcons name="history" size={20} color={activeTab === 'logs' ? '#3b82f6' : '#64748b'} />
          <Text className={`text-[10px] font-bold uppercase mt-1 ${activeTab === 'logs' ? 'text-blue-500' : 'text-slate-500'}`}>Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        
        {/* --- TAB 1: ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <View className="mb-10">
            {/* Quick Metrics Grid */}
            <View className="flex-row flex-wrap justify-between mb-4">
              <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-[48%] mb-4">
                <MaterialCommunityIcons name="office-building" size={24} color="#60a5fa" />
                <Text className="text-white text-2xl font-bold mt-2">{totalBlocks}</Text>
                <Text className="text-slate-400 text-xs">Total Blocks</Text>
              </View>

              <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-[48%] mb-4">
                <MaterialCommunityIcons name="door" size={24} color="#34d399" />
                <Text className="text-white text-2xl font-bold mt-2">{totalHouses}</Text>
                <Text className="text-slate-400 text-xs">Total Houses</Text>
              </View>

              <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-[48%] mb-4">
                <MaterialCommunityIcons name="account-multiple" size={24} color="#a78bfa" />
                <Text className="text-white text-2xl font-bold mt-2">{totalResidents}</Text>
                <Text className="text-slate-400 text-xs">Registered Residents</Text>
              </View>

              <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-[48%] mb-4">
                <MaterialCommunityIcons name="run" size={24} color="#fb7185" />
                <Text className="text-white text-2xl font-bold mt-2">{activeVisitors}</Text>
                <Text className="text-slate-400 text-xs">Inside Right Now</Text>
              </View>
            </View>

            {/* Verification Stats */}
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
              <Text className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Pass Requests Summary</Text>
              
              <View className="flex-row justify-between mb-3 items-center">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded bg-amber-500 mr-2" />
                  <Text className="text-slate-400 text-xs">Pending Reviews</Text>
                </View>
                <Text className="text-white font-bold text-xs">{pendingRequests}</Text>
              </View>

              <View className="flex-row justify-between mb-3 items-center">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded bg-emerald-500 mr-2" />
                  <Text className="text-slate-400 text-xs">Approved Passes</Text>
                </View>
                <Text className="text-white font-bold text-xs">{approvedRequests}</Text>
              </View>

              <View className="flex-row justify-between mb-3 items-center">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded bg-red-500 mr-2" />
                  <Text className="text-slate-400 text-xs">Rejected Passes</Text>
                </View>
                <Text className="text-white font-bold text-xs">{rejectedRequests}</Text>
              </View>

              {/* Status Visual distribution bar chart */}
              <View className="w-full h-3 bg-slate-950 rounded-full flex-row overflow-hidden mt-4">
                {requests.length > 0 ? (
                  <>
                    <View style={{ width: `${(pendingRequests/requests.length)*100}%` }} className="bg-amber-500 h-full" />
                    <View style={{ width: `${(approvedRequests/requests.length)*100}%` }} className="bg-emerald-500 h-full" />
                    <View style={{ width: `${(rejectedRequests/requests.length)*100}%` }} className="bg-red-500 h-full" />
                  </>
                ) : (
                  <View className="w-full bg-slate-800 h-full" />
                )}
              </View>
            </View>

            {/* Block-wise Visitor Count CSS Bar Chart */}
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
              <Text className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Block-wise Visitor Count</Text>
              {blocks.length === 0 ? (
                <Text className="text-slate-500 text-xs">No blocks added yet.</Text>
              ) : (
                blocks.slice(0, 4).map((blk) => {
                  const blkCount = requests.filter(r => r.block === blk.name).length;
                  const maxCount = Math.max(...blocks.map(b => requests.filter(r => r.block === b.name).length), 1);
                  const percentage = Math.min((blkCount / maxCount) * 100, 100);

                  return (
                    <View key={blk.id} className="mb-4">
                      <View className="flex-row justify-between mb-1.5">
                        <Text className="text-slate-300 text-xs font-semibold">{blk.name}</Text>
                        <Text className="text-white text-xs font-bold">{blkCount} visitors</Text>
                      </View>
                      <View className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                        <View style={{ width: `${percentage}%` }} className="bg-blue-500 h-full rounded-full" />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Monthly trends chart (simulated / dynamic) */}
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
              <Text className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Monthly Visitor Trends</Text>
              
              <View className="flex-row justify-around items-end h-32 pt-4">
                {[
                  { month: "Jan", count: 4 },
                  { month: "Feb", count: 8 },
                  { month: "Mar", count: 15 },
                  { month: "Apr", count: 12 },
                  { month: "May", count: 20 },
                  { month: "Jun", count: visitorsToday + approvedRequests },
                ].map((item, index) => {
                  const maxMonthCount = 25;
                  const heightPercentage = (item.count / maxMonthCount) * 100;
                  return (
                    <View key={index} className="items-center flex-1">
                      <Text className="text-white text-[10px] font-bold mb-1">{item.count}</Text>
                      <View style={{ height: `${heightPercentage}%` }} className="w-6 bg-gradient-to-t from-blue-600 to-teal-400 bg-blue-600 rounded-t-md" />
                      <Text className="text-slate-500 text-[10px] mt-2 font-bold uppercase">{item.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Seeding Action Box if Database is empty */}
            {(totalBlocks === 0) && (
              <View className="bg-blue-950/20 border border-blue-900/50 rounded-3xl p-5 items-center">
                <MaterialCommunityIcons name="database-import" size={32} color="#60a5fa" />
                <Text className="text-white font-bold text-base mt-3">Seed Demo Environment</Text>
                <Text className="text-slate-400 text-xs text-center px-4 mt-1.5 leading-relaxed">
                  Seed the database automatically with sample blocks (Block A to D) and houses (101 to 302) to quickly test registration.
                </Text>
                <TouchableOpacity
                  onPress={handleSeedData}
                  className="bg-blue-600 px-6 py-2.5 rounded-xl mt-4"
                >
                  <Text className="text-white font-bold text-xs uppercase">Seed Database</Text>
                </TouchableOpacity>
              </View>
            )}

            {totalBlocks > 0 && (
              <TouchableOpacity
                onPress={handleSeedData}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex-row justify-center items-center mt-2"
              >
                <MaterialCommunityIcons name="refresh" size={16} color="#64748b" className="mr-1.5" />
                <Text className="text-slate-400 text-xs font-semibold">Re-seed / Reset Sample Data</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* --- TAB 2: REQUESTS --- */}
        {activeTab === 'requests' && (
          <View className="mb-10">
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Pending Pass Requests</Text>
            
            {requests.filter(r => r.status === 'pending').length === 0 ? (
              <View className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 items-center justify-center">
                <MaterialCommunityIcons name="sticker-check-outline" size={40} color="#475569" />
                <Text className="text-slate-400 font-medium text-sm mt-3 text-center">All caught up!</Text>
                <Text className="text-slate-600 text-xs mt-1 text-center">No pending visitor requests require review.</Text>
              </View>
            ) : (
              requests.filter(r => r.status === 'pending').map((item) => (
                <View key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-white font-bold text-base">{item.visitorName}</Text>
                      <Text className="text-slate-400 text-xs mt-0.5">{item.relationship} • {item.numberOfVisitors > 1 ? `${item.numberOfVisitors} visitors` : "1 visitor"}</Text>
                    </View>
                    <View className="bg-amber-900/30 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      <Text className="text-amber-400 text-[10px] font-bold uppercase">Pending Approval</Text>
                    </View>
                  </View>

                  <View className="border-t border-b border-slate-800 py-3 my-3">
                    <Text className="text-slate-400 text-xs mb-1">
                      <Text className="font-bold text-slate-500">Host:</Text> {item.residentName} (Block {item.block}, House {item.houseNumber})
                    </Text>
                    <Text className="text-slate-400 text-xs mb-1">
                      <Text className="font-bold text-slate-500">Schedule:</Text> {new Date(item.arrivalDateTime).toLocaleString()}
                    </Text>
                    <Text className="text-slate-400 text-xs">
                      <Text className="font-bold text-slate-500">Purpose:</Text> {item.purpose}
                    </Text>
                  </View>

                  <View className="flex-row justify-end mt-2">
                    <TouchableOpacity
                      onPress={() => handleReview(item.id, 'rejected')}
                      disabled={actionLoading}
                      className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl mr-3 flex-row items-center"
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={16} color="#ef4444" className="mr-1" />
                      <Text className="text-red-500 text-xs font-bold">Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleReview(item.id, 'approved')}
                      disabled={actionLoading}
                      className="bg-emerald-500 px-4 py-2 rounded-xl flex-row items-center"
                    >
                      <MaterialCommunityIcons name="check-circle-outline" size={16} color="white" className="mr-1" />
                      <Text className="text-white text-xs font-bold">Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Historical Reviewed List */}
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-6 mb-4">Processed Requests</Text>
            {requests.filter(r => r.status !== 'pending').slice(0, 10).map((item) => (
              <View key={item.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 mb-3 flex-row justify-between items-center opacity-70">
                <View>
                  <Text className="text-slate-300 font-bold text-sm">{item.visitorName}</Text>
                  <Text className="text-slate-500 text-xs mt-0.5">{item.relationship} • Host: {item.residentName}</Text>
                </View>

                <View className="items-end">
                  <View className={`px-2 py-0.5 rounded-md border ${
                    item.status === 'approved' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'
                  }`}>
                    <Text className={`text-[10px] font-bold uppercase ${
                      item.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
                    }`}>{item.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- TAB 3: COMMUNITY --- */}
        {activeTab === 'community' && (
          <View className="mb-10">
            {/* Create Block Form */}
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
              <Text className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Add Block</Text>
              
              <View className="flex-row">
                <TextInput
                  placeholder="e.g. Block E"
                  placeholderTextColor="#64748b"
                  value={newBlockName}
                  onChangeText={setNewBlockName}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white mr-3 text-base"
                />
                <TouchableOpacity
                  onPress={handleAddBlock}
                  disabled={actionLoading}
                  className="bg-blue-600 px-5 rounded-xl justify-center items-center"
                >
                  <Text className="text-white font-bold text-sm">Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Create House Form */}
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
              <Text className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Add House / Quarters</Text>
              
              <View className="mb-3">
                <Text className="text-slate-400 text-xs mb-1.5">Block Name</Text>
                <TextInput
                  placeholder="e.g. Block A"
                  placeholderTextColor="#64748b"
                  value={newHouseBlock}
                  onChangeText={setNewHouseBlock}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-base"
                />
              </View>

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-slate-400 text-xs mb-1.5">House Number</Text>
                  <TextInput
                    placeholder="e.g. A-103"
                    placeholderTextColor="#64748b"
                    value={newHouseNumber}
                    onChangeText={setNewHouseNumber}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-base"
                  />
                </View>

                <View className="flex-1 ml-2">
                  <Text className="text-slate-400 text-xs mb-1.5">Family Size</Text>
                  <TextInput
                    placeholder="e.g. 4"
                    placeholderTextColor="#64748b"
                    value={newHouseFamilyCount}
                    onChangeText={setNewHouseFamilyCount}
                    keyboardType="numeric"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-base"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAddHouse}
                disabled={actionLoading}
                className="bg-blue-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-bold text-sm">Save House</Text>
              </TouchableOpacity>
            </View>

            {/* List of blocks & houses */}
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Community Structure</Text>
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
              <View className="flex-row justify-between pb-3 border-b border-slate-800 mb-3">
                <Text className="text-slate-400 text-xs font-semibold">Blocks ({blocks.length})</Text>
                <Text className="text-slate-400 text-xs font-semibold">Houses ({houses.length})</Text>
              </View>
              
              <View className="max-h-48">
                <ScrollView nestedScrollEnabled>
                  {houses.map((house) => (
                    <View key={house.id} className="flex-row justify-between py-2 border-b border-slate-800/40">
                      <Text className="text-slate-300 text-xs">{house.blockName}</Text>
                      <Text className="text-white text-xs font-bold">House {house.houseNumber}</Text>
                    </View>
                  ))}
                  {houses.length === 0 && (
                    <Text className="text-slate-500 text-xs py-4 text-center">No community structure configured.</Text>
                  )}
                </ScrollView>
              </View>
            </View>

            {/* Registered Residents */}
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Registered Residents ({residents.length})</Text>
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-10">
              <ScrollView nestedScrollEnabled className="max-h-60">
                {residents.map((res) => (
                  <View key={res.uid} className="flex-row items-center justify-between py-2.5 border-b border-slate-800/50">
                    <View>
                      <Text className="text-white text-xs font-bold">{res.name}</Text>
                      <Text className="text-slate-400 text-[10px] mt-0.5">{res.email} • {res.mobile}</Text>
                    </View>
                    <Text className="text-blue-400 text-[10px] font-bold">{res.block} - {res.houseNumber}</Text>
                  </View>
                ))}
                {residents.length === 0 && (
                  <Text className="text-slate-500 text-xs py-4 text-center">No registered residents yet.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* --- TAB 4: VISITOR LOGS --- */}
        {activeTab === 'logs' && (
          <View className="mb-10">
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Gate Entrance & Exit Logs</Text>
            
            {requests.filter(r => r.checkInTime).length === 0 ? (
              <View className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 items-center justify-center">
                <MaterialCommunityIcons name="card-bulleted-off-outline" size={40} color="#475569" />
                <Text className="text-slate-400 font-medium text-sm mt-3 text-center">No gate logs recorded yet.</Text>
                <Text className="text-slate-600 text-xs mt-1 text-center">Logs populate automatically as security check in guests.</Text>
              </View>
            ) : (
              requests.filter(r => r.checkInTime).map((item) => (
                <View key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-bold text-sm">{item.visitorName}</Text>
                    <Text className="text-slate-400 text-xs">Block {item.block} - House {item.houseNumber}</Text>
                  </View>

                  <View className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <View className="flex-row items-center mb-1">
                      <MaterialCommunityIcons name="login" size={14} color="#10b981" className="mr-2" />
                      <Text className="text-emerald-400 text-xs font-semibold">Check-In: </Text>
                      <Text className="text-slate-300 text-xs">{new Date(item.checkInTime!).toLocaleString()}</Text>
                    </View>
                    
                    {item.checkOutTime ? (
                      <View className="flex-row items-center mt-1">
                        <MaterialCommunityIcons name="logout" size={14} color="#a78bfa" className="mr-2" />
                        <Text className="text-purple-400 text-xs font-semibold">Check-Out: </Text>
                        <Text className="text-slate-300 text-xs">{new Date(item.checkOutTime).toLocaleString()}</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center mt-1">
                        <MaterialCommunityIcons name="logout" size={14} color="#ef4444" className="mr-2" />
                        <Text className="text-red-400 text-[10px] font-bold uppercase">Still Inside</Text>
                      </View>
                    )}
                  </View>
                  
                  <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-800/40">
                    <Text className="text-slate-500 text-[10px]">Verified By: Guard {item.checkedInBy}</Text>
                    <Text className="text-slate-500 text-[10px]">Pass OTP: {item.passCode}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}
