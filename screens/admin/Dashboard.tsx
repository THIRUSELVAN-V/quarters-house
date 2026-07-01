import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

import { auth } from '../../firebase/config';
import { useDatabase, VisitorRequest, Block, House } from '../../hooks/database';
import { useAuthentication } from '../../hooks/authentication';

export default function AdminDashboard({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'requests' | 'community' | 'logs'>(
    'analytics'
  );

  // Data States
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [residents, setResidents] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States for Adding Block/House
  const [newBlockName, setNewBlockName] = useState('');
  const [newHouseBlock, setNewHouseBlock] = useState('');
  const [newHouseNumber, setNewHouseNumber] = useState('');
  const [newHouseFamilyCount, setNewHouseFamilyCount] = useState('4');

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
        Alert.alert('Success', `Pass request status updated to ${status}`);
        loadAllData();
      } else {
        Alert.alert('Error', res.error || 'Failed to update request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlockName) {
      Alert.alert('Error', 'Please enter a block name');
      return;
    }
    setActionLoading(true);
    try {
      const res = await addBlock(newBlockName);
      if (res.success) {
        Alert.alert('Success', 'Block added successfully');
        setNewBlockName('');
        loadAllData();
      } else {
        Alert.alert('Error', res.error || 'Failed to add block');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHouse = async () => {
    if (!newHouseBlock || !newHouseNumber) {
      Alert.alert('Error', 'Please fill in Block Name and House Number');
      return;
    }
    const count = parseInt(newHouseFamilyCount, 10);
    setActionLoading(true);
    try {
      const res = await addHouse(newHouseBlock, newHouseNumber, isNaN(count) ? 4 : count);
      if (res.success) {
        Alert.alert('Success', 'House added successfully');
        setNewHouseNumber('');
        loadAllData();
      } else {
        Alert.alert('Error', res.error || 'Failed to add house');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const res = await seedCommunityData();
      if (res.success) {
        Alert.alert('Success', res.message || 'Seeding complete!');
        loadAllData();
      } else {
        Alert.alert('Error', res.error || 'Failed to seed data');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STATS COMPUTATIONS ---
  const totalBlocks = blocks.length;
  const totalHouses = houses.length;
  const totalResidents = residents.length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const approvedRequests = requests.filter((r) => r.status === 'approved').length;
  const rejectedRequests = requests.filter((r) => r.status === 'rejected').length;
  const activeVisitors = requests.filter((r) => r.checkInTime && !r.checkOutTime).length;

  // Visitors Today (Arrival date is today)
  const todayStr = new Date().toISOString().split('T')[0];
  const visitorsToday = requests.filter((r) => r.arrivalDateTime.startsWith(todayStr)).length;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header Banner */}
      <View className="flex-row items-center justify-between border-b border-slate-800 bg-slate-900 px-6 pb-5 pt-14">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            Admin Control Center
          </Text>
          <Text className="mt-1 text-2xl font-extrabold text-white">VMS Dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="rounded-full border border-slate-700/50 bg-slate-800/80 p-3">
          <MaterialCommunityIcons name="logout" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      {/* Tabs Menu */}
      <View className="flex-row border-b border-slate-800 bg-slate-900 px-2">
        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          className={`flex-1 items-center border-b-2 py-4 ${activeTab === 'analytics' ? 'border-blue-500' : 'border-transparent'}`}>
          <MaterialCommunityIcons
            name="chart-bar"
            size={20}
            color={activeTab === 'analytics' ? '#3b82f6' : '#64748b'}
          />
          <Text
            className={`mt-1 text-[10px] font-bold uppercase ${activeTab === 'analytics' ? 'text-blue-500' : 'text-slate-500'}`}>
            Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          className={`flex-1 items-center border-b-2 py-4 ${activeTab === 'requests' ? 'border-blue-500' : 'border-transparent'}`}>
          <View className="relative">
            <MaterialCommunityIcons
              name="bell-badge-outline"
              size={20}
              color={activeTab === 'requests' ? '#3b82f6' : '#64748b'}
            />
            {pendingRequests > 0 && (
              <View className="absolute -right-1.5 -top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
                <Text className="text-[9px] font-bold text-white">{pendingRequests}</Text>
              </View>
            )}
          </View>
          <Text
            className={`mt-1 text-[10px] font-bold uppercase ${activeTab === 'requests' ? 'text-blue-500' : 'text-slate-500'}`}>
            Review
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('community')}
          className={`flex-1 items-center border-b-2 py-4 ${activeTab === 'community' ? 'border-blue-500' : 'border-transparent'}`}>
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={activeTab === 'community' ? '#3b82f6' : '#64748b'}
          />
          <Text
            className={`mt-1 text-[10px] font-bold uppercase ${activeTab === 'community' ? 'text-blue-500' : 'text-slate-500'}`}>
            Community
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('logs')}
          className={`flex-1 items-center border-b-2 py-4 ${activeTab === 'logs' ? 'border-blue-500' : 'border-transparent'}`}>
          <MaterialCommunityIcons
            name="history"
            size={20}
            color={activeTab === 'logs' ? '#3b82f6' : '#64748b'}
          />
          <Text
            className={`mt-1 text-[10px] font-bold uppercase ${activeTab === 'logs' ? 'text-blue-500' : 'text-slate-500'}`}>
            Logs
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* --- TAB 1: ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <View className="mb-10">
            {/* Quick Metrics Grid */}
            <View className="mb-4 flex-row flex-wrap justify-between">
              <View className="mb-4 w-[48%] rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <MaterialCommunityIcons name="office-building" size={24} color="#60a5fa" />
                <Text className="mt-2 text-2xl font-bold text-white">{totalBlocks}</Text>
                <Text className="text-xs text-slate-400">Total Blocks</Text>
              </View>

              <View className="mb-4 w-[48%] rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <MaterialCommunityIcons name="door" size={24} color="#34d399" />
                <Text className="mt-2 text-2xl font-bold text-white">{totalHouses}</Text>
                <Text className="text-xs text-slate-400">Total Houses</Text>
              </View>

              <View className="mb-4 w-[48%] rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <MaterialCommunityIcons name="account-multiple" size={24} color="#a78bfa" />
                <Text className="mt-2 text-2xl font-bold text-white">{totalResidents}</Text>
                <Text className="text-xs text-slate-400">Registered Residents</Text>
              </View>

              <View className="mb-4 w-[48%] rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <MaterialCommunityIcons name="run" size={24} color="#fb7185" />
                <Text className="mt-2 text-2xl font-bold text-white">{activeVisitors}</Text>
                <Text className="text-xs text-slate-400">Inside Right Now</Text>
              </View>
            </View>

            {/* Verification Stats */}
            <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Pass Requests Summary
              </Text>

              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-2 h-3 w-3 rounded bg-amber-500" />
                  <Text className="text-xs text-slate-400">Pending Reviews</Text>
                </View>
                <Text className="text-xs font-bold text-white">{pendingRequests}</Text>
              </View>

              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-2 h-3 w-3 rounded bg-emerald-500" />
                  <Text className="text-xs text-slate-400">Approved Passes</Text>
                </View>
                <Text className="text-xs font-bold text-white">{approvedRequests}</Text>
              </View>

              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-2 h-3 w-3 rounded bg-red-500" />
                  <Text className="text-xs text-slate-400">Rejected Passes</Text>
                </View>
                <Text className="text-xs font-bold text-white">{rejectedRequests}</Text>
              </View>

              {/* Status Visual distribution bar chart */}
              <View className="mt-4 h-3 w-full flex-row overflow-hidden rounded-full bg-slate-950">
                {requests.length > 0 ? (
                  <>
                    <View
                      style={{ width: `${(pendingRequests / requests.length) * 100}%` }}
                      className="h-full bg-amber-500"
                    />
                    <View
                      style={{ width: `${(approvedRequests / requests.length) * 100}%` }}
                      className="h-full bg-emerald-500"
                    />
                    <View
                      style={{ width: `${(rejectedRequests / requests.length) * 100}%` }}
                      className="h-full bg-red-500"
                    />
                  </>
                ) : (
                  <View className="h-full w-full bg-slate-800" />
                )}
              </View>
            </View>

            {/* Block-wise Visitor Count CSS Bar Chart */}
            <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Block-wise Visitor Count
              </Text>
              {blocks.length === 0 ? (
                <Text className="text-xs text-slate-500">No blocks added yet.</Text>
              ) : (
                blocks.slice(0, 4).map((blk) => {
                  const blkCount = requests.filter((r) => r.block === blk.name).length;
                  const maxCount = Math.max(
                    ...blocks.map((b) => requests.filter((r) => r.block === b.name).length),
                    1
                  );
                  const percentage = Math.min((blkCount / maxCount) * 100, 100);

                  return (
                    <View key={blk.id} className="mb-4">
                      <View className="mb-1.5 flex-row justify-between">
                        <Text className="text-xs font-semibold text-slate-300">{blk.name}</Text>
                        <Text className="text-xs font-bold text-white">{blkCount} visitors</Text>
                      </View>
                      <View className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950">
                        <View
                          style={{ width: `${percentage}%` }}
                          className="h-full rounded-full bg-blue-500"
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Monthly trends chart (simulated / dynamic) */}
            <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Monthly Visitor Trends
              </Text>

              <View className="h-32 flex-row items-end justify-around pt-4">
                {[
                  { month: 'Jan', count: 4 },
                  { month: 'Feb', count: 8 },
                  { month: 'Mar', count: 15 },
                  { month: 'Apr', count: 12 },
                  { month: 'May', count: 20 },
                  { month: 'Jun', count: visitorsToday + approvedRequests },
                ].map((item, index) => {
                  const maxMonthCount = 25;
                  const heightPercentage = (item.count / maxMonthCount) * 100;
                  return (
                    <View key={index} className="flex-1 items-center">
                      <Text className="mb-1 text-[10px] font-bold text-white">{item.count}</Text>
                      <View
                        style={{ height: `${heightPercentage}%` }}
                        className="w-6 rounded-t-md bg-blue-600 bg-gradient-to-t from-blue-600 to-teal-400"
                      />
                      <Text className="mt-2 text-[10px] font-bold uppercase text-slate-500">
                        {item.month}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Seeding Action Box if Database is empty */}
            {totalBlocks === 0 && (
              <View className="items-center rounded-3xl border border-blue-900/50 bg-blue-950/20 p-5">
                <MaterialCommunityIcons name="database-import" size={32} color="#60a5fa" />
                <Text className="mt-3 text-base font-bold text-white">Seed Demo Environment</Text>
                <Text className="mt-1.5 px-4 text-center text-xs leading-relaxed text-slate-400">
                  Seed the database automatically with sample blocks (Block A to D) and houses (101
                  to 302) to quickly test registration.
                </Text>
                <TouchableOpacity
                  onPress={handleSeedData}
                  className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5">
                  <Text className="text-xs font-bold uppercase text-white">Seed Database</Text>
                </TouchableOpacity>
              </View>
            )}

            {totalBlocks > 0 && (
              <TouchableOpacity
                onPress={handleSeedData}
                className="mt-2 flex-row items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-3">
                <MaterialCommunityIcons
                  name="refresh"
                  size={16}
                  color="#64748b"
                  className="mr-1.5"
                />
                <Text className="text-xs font-semibold text-slate-400">
                  Re-seed / Reset Sample Data
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* --- TAB 2: REQUESTS --- */}
        {activeTab === 'requests' && (
          <View className="mb-10">
            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Pending Pass Requests
            </Text>

            {requests.filter((r) => r.status === 'pending').length === 0 ? (
              <View className="items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-8">
                <MaterialCommunityIcons name="sticker-check-outline" size={40} color="#475569" />
                <Text className="mt-3 text-center text-sm font-medium text-slate-400">
                  All caught up!
                </Text>
                <Text className="mt-1 text-center text-xs text-slate-600">
                  No pending visitor requests require review.
                </Text>
              </View>
            ) : (
              requests
                .filter((r) => r.status === 'pending')
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PassDetails', { passId: item.id })}
                    className="mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <View className="mb-2 flex-row items-start justify-between">
                      <View>
                        <Text className="text-base font-bold text-white">{item.visitorName}</Text>
                        <Text className="mt-0.5 text-xs text-slate-400">
                          {item.relationship} •{' '}
                          {item.numberOfVisitors > 1
                            ? `${item.numberOfVisitors} visitors`
                            : '1 visitor'}
                        </Text>
                      </View>
                      <View className="rounded-md border border-amber-500/30 bg-amber-900/30 px-2 py-0.5">
                        <Text className="text-[10px] font-bold uppercase text-amber-400">
                          Pending Approval
                        </Text>
                      </View>
                    </View>

                    <View className="my-3 border-b border-t border-slate-800 py-3">
                      <Text className="mb-1 text-xs text-slate-400">
                        <Text className="font-bold text-slate-500">Host:</Text> {item.residentName}{' '}
                        (Block {item.block}, House {item.houseNumber})
                      </Text>
                      <Text className="mb-1 text-xs text-slate-400">
                        <Text className="font-bold text-slate-500">Schedule:</Text>{' '}
                        {new Date(item.arrivalDateTime).toLocaleString()}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        <Text className="font-bold text-slate-500">Purpose:</Text> {item.purpose}
                      </Text>
                    </View>

                    <View className="mt-2 flex-row justify-end">
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleReview(item.id, 'rejected');
                        }}
                        disabled={actionLoading}
                        className="mr-3 flex-row items-center rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2">
                        <MaterialCommunityIcons
                          name="close-circle-outline"
                          size={16}
                          color="#ef4444"
                          className="mr-1"
                        />
                        <Text className="text-xs font-bold text-red-500">Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleReview(item.id, 'approved');
                        }}
                        disabled={actionLoading}
                        className="flex-row items-center rounded-xl bg-emerald-500 px-4 py-2">
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={16}
                          color="white"
                          className="mr-1"
                        />
                        <Text className="text-xs font-bold text-white">Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
            )}

            {/* Historical Reviewed List */}
            <Text className="mb-4 mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">
              Processed Requests
            </Text>
            {requests
              .filter((r) => r.status !== 'pending')
              .slice(0, 10)
              .map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('PassDetails', { passId: item.id })}
                  className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-4 opacity-70">
                  <View>
                    <Text className="text-sm font-bold text-slate-300">{item.visitorName}</Text>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      {item.relationship} • Host: {item.residentName}
                    </Text>
                  </View>

                  <View className="items-end">
                    <View
                      className={`rounded-md border px-2 py-0.5 ${
                        item.status === 'approved'
                          ? 'border-emerald-500/30 bg-emerald-950/20'
                          : 'border-red-500/30 bg-red-950/20'
                      }`}>
                      <Text
                        className={`text-[10px] font-bold uppercase ${
                          item.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* --- TAB 3: COMMUNITY --- */}
        {activeTab === 'community' && (
          <View className="mb-10">
            {/* Quick Actions Panel */}
            <View className="mb-6 flex-row justify-between rounded-3xl border border-slate-800 bg-slate-900 p-4">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AddResident')}
                className="mr-2 flex-1 items-center rounded-2xl border border-blue-500/20 bg-blue-600/10 p-4">
                <MaterialCommunityIcons name="account-plus-outline" size={26} color="#3b82f6" />
                <Text className="mt-2 text-center text-xs font-bold text-white">Add Resident</Text>
                <Text className="mt-0.5 text-center text-[9px] text-slate-500">
                  Create resident accounts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SearchResidents')}
                className="ml-2 flex-1 items-center rounded-2xl border border-emerald-500/20 bg-emerald-600/10 p-4">
                <MaterialCommunityIcons name="account-search-outline" size={26} color="#10b981" />
                <Text className="mt-2 text-center text-xs font-bold text-white">
                  Search Residents
                </Text>
                <Text className="mt-0.5 text-center text-[9px] text-slate-500">
                  View family & ID details
                </Text>
              </TouchableOpacity>
            </View>

            {/* Create Block Form */}
            <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Add Block
              </Text>

              <View className="flex-row">
                <TextInput
                  placeholder="e.g. Block E"
                  placeholderTextColor="#64748b"
                  value={newBlockName}
                  onChangeText={setNewBlockName}
                  className="mr-3 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-base text-white"
                />
                <TouchableOpacity
                  onPress={handleAddBlock}
                  disabled={actionLoading}
                  className="items-center justify-center rounded-xl bg-blue-600 px-5">
                  <Text className="text-sm font-bold text-white">Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Create House Form */}
            <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Add House / Quarters
              </Text>

              <View className="mb-3">
                <Text className="mb-1.5 text-xs text-slate-400">Block Name</Text>
                <TextInput
                  placeholder="e.g. Block A"
                  placeholderTextColor="#64748b"
                  value={newHouseBlock}
                  onChangeText={setNewHouseBlock}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-base text-white"
                />
              </View>

              <View className="mb-4 flex-row">
                <View className="mr-2 flex-1">
                  <Text className="mb-1.5 text-xs text-slate-400">House Number</Text>
                  <TextInput
                    placeholder="e.g. A-103"
                    placeholderTextColor="#64748b"
                    value={newHouseNumber}
                    onChangeText={setNewHouseNumber}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-base text-white"
                  />
                </View>

                <View className="ml-2 flex-1">
                  <Text className="mb-1.5 text-xs text-slate-400">Family Size</Text>
                  <TextInput
                    placeholder="e.g. 4"
                    placeholderTextColor="#64748b"
                    value={newHouseFamilyCount}
                    onChangeText={setNewHouseFamilyCount}
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-base text-white"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAddHouse}
                disabled={actionLoading}
                className="items-center rounded-xl bg-blue-600 py-3">
                <Text className="text-sm font-bold text-white">Save House</Text>
              </TouchableOpacity>
            </View>

            {/* List of blocks & houses */}
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Community Structure
            </Text>
            <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <View className="mb-3 flex-row justify-between border-b border-slate-800 pb-3">
                <Text className="text-xs font-semibold text-slate-400">
                  Blocks ({blocks.length})
                </Text>
                <Text className="text-xs font-semibold text-slate-400">
                  Houses ({houses.length})
                </Text>
              </View>

              <View className="max-h-48">
                <ScrollView nestedScrollEnabled>
                  {houses.map((house) => (
                    <View
                      key={house.id}
                      className="flex-row justify-between border-b border-slate-800/40 py-2">
                      <Text className="text-xs text-slate-300">{house.blockName}</Text>
                      <Text className="text-xs font-bold text-white">
                        House {house.houseNumber}
                      </Text>
                    </View>
                  ))}
                  {houses.length === 0 && (
                    <Text className="py-4 text-center text-xs text-slate-500">
                      No community structure configured.
                    </Text>
                  )}
                </ScrollView>
              </View>
            </View>

            {/* Registered Residents */}
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Registered Residents ({residents.length})
            </Text>
            <View className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <ScrollView nestedScrollEnabled className="max-h-60">
                {residents.map((res) => (
                  <View
                    key={res.uid}
                    className="flex-row items-center justify-between border-b border-slate-800/50 py-2.5">
                    <View>
                      <Text className="text-xs font-bold text-white">{res.name}</Text>
                      <Text className="mt-0.5 text-[10px] text-slate-400">
                        {res.email} • {res.mobile}
                      </Text>
                    </View>
                    <Text className="text-[10px] font-bold text-blue-400">
                      {res.block} - {res.houseNumber}
                    </Text>
                  </View>
                ))}
                {residents.length === 0 && (
                  <Text className="py-4 text-center text-xs text-slate-500">
                    No registered residents yet.
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* --- TAB 4: VISITOR LOGS --- */}
        {activeTab === 'logs' && (
          <View className="mb-10">
            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Gate Entrance & Exit Logs
            </Text>

            {requests.filter((r) => r.checkInTime).length === 0 ? (
              <View className="items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-8">
                <MaterialCommunityIcons
                  name="card-bulleted-off-outline"
                  size={40}
                  color="#475569"
                />
                <Text className="mt-3 text-center text-sm font-medium text-slate-400">
                  No gate logs recorded yet.
                </Text>
                <Text className="mt-1 text-center text-xs text-slate-600">
                  Logs populate automatically as security check in guests.
                </Text>
              </View>
            ) : (
              requests
                .filter((r) => r.checkInTime)
                .map((item) => (
                  <View
                    key={item.id}
                    className="mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-white">{item.visitorName}</Text>
                      <Text className="text-xs text-slate-400">
                        Block {item.block} - House {item.houseNumber}
                      </Text>
                    </View>

                    <View className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <View className="mb-1 flex-row items-center">
                        <MaterialCommunityIcons
                          name="login"
                          size={14}
                          color="#10b981"
                          className="mr-2"
                        />
                        <Text className="text-xs font-semibold text-emerald-400">Check-In: </Text>
                        <Text className="text-xs text-slate-300">
                          {new Date(item.checkInTime!).toLocaleString()}
                        </Text>
                      </View>

                      {item.checkOutTime ? (
                        <View className="mt-1 flex-row items-center">
                          <MaterialCommunityIcons
                            name="logout"
                            size={14}
                            color="#a78bfa"
                            className="mr-2"
                          />
                          <Text className="text-xs font-semibold text-purple-400">Check-Out: </Text>
                          <Text className="text-xs text-slate-300">
                            {new Date(item.checkOutTime).toLocaleString()}
                          </Text>
                        </View>
                      ) : (
                        <View className="mt-1 flex-row items-center">
                          <MaterialCommunityIcons
                            name="logout"
                            size={14}
                            color="#ef4444"
                            className="mr-2"
                          />
                          <Text className="text-[10px] font-bold uppercase text-red-400">
                            Still Inside
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="mt-2 flex-row justify-between border-t border-slate-800/40 pt-2">
                      <Text className="text-[10px] text-slate-500">
                        Verified By: Guard {item.checkedInBy}
                      </Text>
                      <Text className="text-[10px] text-slate-500">Pass OTP: {item.passCode}</Text>
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
