import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthentication, FamilyMember } from '../../hooks/authentication';
import { useDatabase } from '../../hooks/database';

export default function AddResident({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [block, setBlock] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [totalMembers, setTotalMembers] = useState('1');

  // Dynamic Family Members State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Temporary state for adding a single family member
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('');
  const [famOccupation, setFamOccupation] = useState('');

  const [loading, setLoading] = useState(false);
  const { registerResidentByAdmin } = useAuthentication();
  const { getBlocks, getHousesByBlock } = useDatabase();

  const [dbBlocks, setDbBlocks] = useState<any[]>([]);
  const [dbHouses, setDbHouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchBlocksAndHouses = async () => {
      const blks = await getBlocks();
      setDbBlocks(blks);
    };
    fetchBlocksAndHouses();
  }, []);

  const handleBlockChange = async (selectedBlock: string) => {
    setBlock(selectedBlock);
    const housesList = await getHousesByBlock(selectedBlock);
    setDbHouses(housesList);
  };

  const handleAddFamilyMember = () => {
    if (!famName || !famRelation || !famOccupation) {
      Alert.alert('Error', 'Please fill in all family member details first');
      return;
    }
    const newMember: FamilyMember = {
      name: famName,
      relation: famRelation,
      occupation: famOccupation,
    };
    setFamilyMembers([...familyMembers, newMember]);
    setFamName('');
    setFamRelation('');
    setFamOccupation('');

    // Automatically increment family size if appropriate
    const nextSize = Math.max(familyMembers.length + 2, parseInt(totalMembers, 10) || 1);
    setTotalMembers(nextSize.toString());
  };

  const handleRemoveFamilyMember = (index: number) => {
    const updated = familyMembers.filter((_, idx) => idx !== index);
    setFamilyMembers(updated);
    setTotalMembers(Math.max(1, updated.length + 1).toString());
  };

  const handleSaveResident = async () => {
    if (!name || !email || !mobile || !block || !houseNumber) {
      Alert.alert('Error', 'Please fill in all basic resident fields');
      return;
    }

    setLoading(true);
    try {
      // The default password is their mobile number
      const password = mobile.trim();
      const res = await registerResidentByAdmin({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        mobile: mobile.trim(),
        block: block.trim(),
        houseNumber: houseNumber.trim(),
        familyMembersCount: parseInt(totalMembers, 10) || 1,
        familyMembers,
      });

      if (res.success) {
        Alert.alert(
          'Success',
          `Resident ${name} registered successfully!\n\nDefault login password is: ${password}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', res.error || 'Could not register user');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950">
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
          <Text className="mt-0.5 text-xl font-extrabold text-white">Register Resident</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* Core Profile Card */}
        <View className="mb-5 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-500">
            Basic Profile
          </Text>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resident Full Name
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="account-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter full name"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="email-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter email address"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mobile Number
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="phone-outline" size={20} color="#64748b" />
              <TextInput
                placeholder="Enter mobile number"
                placeholderTextColor="#64748b"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          {/* Quick Note about logins */}
          <View className="flex-row items-start rounded-2xl border border-slate-800/80 bg-slate-950 p-4">
            <MaterialCommunityIcons
              name="information"
              size={20}
              color="#3b82f6"
              className="mr-2 mt-0.5"
            />
            <Text className="flex-1 text-xs leading-relaxed text-slate-400">
              Upon successful registration, the resident can log in directly using their{' '}
              <Text className="font-bold text-white">Email Address</Text> and their{' '}
              <Text className="font-bold text-white">Mobile Number</Text> as the temporary password.
            </Text>
          </View>
        </View>

        {/* Residency Details Card */}
        <View className="mb-5 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-emerald-500">
            Quarters & Family Size
          </Text>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Block Name
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="office-building" size={20} color="#64748b" />
              <TextInput
                placeholder="e.g. Block A"
                placeholderTextColor="#64748b"
                value={block}
                onChangeText={handleBlockChange}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
            {dbBlocks.length > 0 && (
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {dbBlocks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => handleBlockChange(b.name)}
                    className={`rounded-full border px-3 py-1 ${
                      block === b.name
                        ? 'border-blue-500 bg-blue-600'
                        : 'border-slate-800 bg-slate-950'
                    }`}>
                    <Text className="text-[10px] font-semibold text-white">{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              House / Quarters Number
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="door" size={20} color="#64748b" />
              <TextInput
                placeholder="e.g. 101"
                placeholderTextColor="#64748b"
                value={houseNumber}
                onChangeText={setHouseNumber}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
            {dbHouses.length > 0 && (
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {dbHouses.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => setHouseNumber(h.houseNumber)}
                    className={`rounded-full border px-3 py-1 ${
                      houseNumber === h.houseNumber
                        ? 'border-emerald-500 bg-emerald-600'
                        : 'border-slate-800 bg-slate-950'
                    }`}>
                    <Text className="text-[10px] font-semibold text-white">
                      No. {h.houseNumber}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View className="mb-2">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Family Members Count (Host included)
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="account-multiple" size={20} color="#64748b" />
              <TextInput
                placeholder="Total count (including host)"
                placeholderTextColor="#64748b"
                value={totalMembers}
                onChangeText={setTotalMembers}
                keyboardType="numeric"
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>
        </View>

        {/* Dynamic Family Members List Card */}
        <View className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm font-bold uppercase tracking-wider text-purple-400">
              Add Family Members
            </Text>
            <View className="rounded-full border border-purple-500/20 bg-purple-950/40 px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-purple-400">
                {familyMembers.length} Added
              </Text>
            </View>
          </View>

          {/* List of currently added members */}
          {familyMembers.length > 0 && (
            <View className="mb-5 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              {familyMembers.map((member, idx) => (
                <View
                  key={idx}
                  className={`flex-row items-center justify-between py-2.5 ${
                    idx < familyMembers.length - 1 ? 'border-b border-slate-800/60' : ''
                  }`}>
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-bold text-white">{member.name}</Text>
                    <Text className="text-xs text-slate-500">
                      Relation: {member.relation} • Occ: {member.occupation}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveFamilyMember(idx)}
                    className="rounded-full border border-red-500/30 bg-red-950/20 p-1">
                    <MaterialCommunityIcons name="delete" size={16} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Form inputs for new family member */}
          <View className="border-slate-850 mb-4 rounded-2xl border bg-slate-950/60 p-4">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              New Member Form
            </Text>

            <TextInput
              placeholder="Family Member Full Name"
              placeholderTextColor="#64748b"
              value={famName}
              onChangeText={setFamName}
              className="mb-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white"
            />

            <View className="mb-3 flex-row">
              <TextInput
                placeholder="Relation (e.g. Spouse)"
                placeholderTextColor="#64748b"
                value={famRelation}
                onChangeText={setFamRelation}
                className="mr-2 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white"
              />
              <TextInput
                placeholder="Occupation (e.g. Teacher)"
                placeholderTextColor="#64748b"
                value={famOccupation}
                onChangeText={setFamOccupation}
                className="ml-2 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddFamilyMember}
              className="flex-row items-center justify-center rounded-xl border border-purple-500/30 bg-purple-600/20 py-2.5">
              <MaterialCommunityIcons name="plus" size={18} color="#c084fc" className="mr-1" />
              <Text className="text-xs font-bold text-purple-400">Add to Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Resident Submit */}
        <TouchableOpacity
          onPress={handleSaveResident}
          disabled={loading}
          activeOpacity={0.8}
          className="mb-14 flex-row items-center justify-center rounded-2xl bg-emerald-600 py-4 shadow-lg shadow-emerald-600/20">
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="mr-2 text-base font-bold text-white">Create Resident Profile</Text>
              <MaterialCommunityIcons name="check-bold" size={18} color="white" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
