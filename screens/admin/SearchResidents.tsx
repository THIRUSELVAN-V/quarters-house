import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase } from '../../hooks/database';

export default function SearchResidents({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const { getAllUsersProfile } = useDatabase();

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsersProfile();
      const resOnly = allUsers.filter((u: any) => u.role === 'resident');
      setResidents(resOnly);
      setFilteredResidents(resOnly);
    } catch (err: any) {
      Alert.alert('Error fetching residents', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResidents(residents);
      return;
    }

    const q = searchQuery.toLowerCase();
    const filtered = residents.filter((res) => {
      const nameMatch = res.name?.toLowerCase().includes(q);
      const emailMatch = res.email?.toLowerCase().includes(q);
      const mobileMatch = res.mobile?.includes(q);
      const blockMatch = res.block?.toLowerCase().includes(q);
      const houseMatch = res.houseNumber?.toLowerCase().includes(q);

      // Also search family members names
      const familyMatch = res.familyMembers?.some(
        (m: any) => m.name?.toLowerCase().includes(q) || m.occupation?.toLowerCase().includes(q)
      );

      return nameMatch || emailMatch || mobileMatch || blockMatch || houseMatch || familyMatch;
    });

    setFilteredResidents(filtered);
  }, [searchQuery, residents]);

  const renderResidentItem = ({ item }: { item: any }) => {
    const isSelected = selectedResident?.uid === item.uid;
    const uploadedProofsCount = item.familyMembers?.filter((m: any) => !!m.idProofUrl).length || 0;
    const totalFamily = item.familyMembers?.length || 0;

    return (
      <TouchableOpacity
        onPress={() => setSelectedResident(isSelected ? null : item)}
        activeOpacity={0.7}
        className={`mb-3 rounded-2xl border p-4 ${
          isSelected ? 'border-blue-500 bg-slate-900' : 'border-slate-800 bg-slate-900'
        }`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-base font-bold text-white">{item.name}</Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              {item.email} • {item.mobile}
            </Text>
            <View className="mt-2 flex-row items-center">
              <View className="mr-2 rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase text-blue-400">
                  {item.block} - {item.houseNumber}
                </Text>
              </View>
              <View className="rounded-md border border-purple-500/20 bg-purple-950/40 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-purple-400">
                  {uploadedProofsCount}/{totalFamily} IDs Uploaded
                </Text>
              </View>
            </View>
          </View>
          <MaterialCommunityIcons
            name={isSelected ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={isSelected ? '#3b82f6' : '#64748b'}
          />
        </View>

        {/* Collapsible Details */}
        {isSelected && (
          <View className="mt-4 border-t border-slate-800 pt-4">
            {/* Resident Bio info */}
            <View className="mb-4">
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Quarters & Family Size
              </Text>
              <View className="mb-1 flex-row justify-between">
                <Text className="text-xs text-slate-400">Total Members in Family:</Text>
                <Text className="text-xs font-bold text-white">{item.familyMembersCount || 1}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-400">Registered On:</Text>
                <Text className="text-xs text-white">
                  {item.createdAt?.seconds
                    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                    : item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Family Members Section */}
            <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Family Members & ID Proofs
            </Text>

            {totalFamily === 0 ? (
              <View className="border-slate-850 items-center justify-center rounded-xl border bg-slate-950 p-4">
                <Text className="text-xs text-slate-500">
                  No family members registered by Admin.
                </Text>
              </View>
            ) : (
              item.familyMembers.map((member: any, idx: number) => (
                <View
                  key={idx}
                  className="mb-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <View className="mb-2 flex-row items-start justify-between">
                    <View>
                      <Text className="text-sm font-bold text-white">{member.name}</Text>
                      <Text className="mt-0.5 text-xs text-slate-400">
                        {member.relation} • {member.occupation}
                      </Text>
                    </View>

                    {member.idProofUrl ? (
                      <View className="rounded border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5">
                        <Text className="text-[9px] font-bold uppercase text-emerald-400">
                          ID Uploaded
                        </Text>
                      </View>
                    ) : (
                      <View className="rounded border border-amber-500/20 bg-amber-950/40 px-2 py-0.5">
                        <Text className="text-[9px] font-bold uppercase text-amber-400">
                          Pending Upload
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* ID Proof Display */}
                  {member.idProofUrl ? (
                    <View className="mt-2.5 items-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900 p-2">
                      <Image
                        source={{ uri: member.idProofUrl }}
                        className="h-44 w-full rounded-md"
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View className="mt-2 items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900 py-4">
                      <MaterialCommunityIcons name="image-off-outline" size={20} color="#475569" />
                      <Text className="mt-1 text-[10px] font-semibold text-slate-600">
                        ID Document image not uploaded yet
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header Banner */}
      <View className="flex-row items-center border-b border-slate-800 bg-slate-900 px-6 pb-5 pt-14">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4 rounded-full bg-slate-800 p-1.5">
          <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            Admin Actions
          </Text>
          <Text className="mt-0.5 text-xl font-extrabold text-white">Search Residents</Text>
        </View>
      </View>

      {/* Search Input Box */}
      <View className="flex-row items-center border-b border-slate-800 bg-slate-900 p-4">
        <View className="flex-1 flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5">
          <MaterialCommunityIcons name="magnify" size={22} color="#64748b" />
          <TextInput
            placeholder="Search by name, block, house, mobile..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-2.5 flex-1 text-base text-white"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main content list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredResidents}
          keyExtractor={(item) => item.uid}
          renderItem={renderResidentItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
          ListEmptyComponent={
            <View className="m-4 items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 py-14">
              <MaterialCommunityIcons name="account-search-outline" size={40} color="#475569" />
              <Text className="mt-3 text-sm font-medium text-slate-400">No residents found</Text>
              <Text className="mt-1 text-xs text-slate-600">
                Try searching with different terms
              </Text>
            </View>
          }
          onRefresh={fetchResidents}
          refreshing={loading}
        />
      )}
    </View>
  );
}
