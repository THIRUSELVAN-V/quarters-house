import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

import { auth, db } from '../../firebase/config';
import { useAuthentication, UserProfile } from '../../hooks/authentication';
import { useDatabase, VisitorRequest } from '../../hooks/database';

export default function ResidentDashboard({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passes, setPasses] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { getUserProfile, changePassword } = useAuthentication();
  const { getResidentVisitorRequests } = useDatabase();

  const loadData = async () => {
    if (!auth.currentUser) return;
    try {
      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);

      const reqs = await getResidentVisitorRequests(auth.currentUser.uid);
      setPasses(reqs);
    } catch (error: any) {
      Alert.alert('Error loading data', error.message);
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

  const pickImage = async (memberIndex: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Sorry, we need camera roll permissions to upload ID proof!'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await saveIdProof(memberIndex, base64Img);
      } else if (!result.canceled && result.assets && result.assets[0].uri) {
        await saveIdProof(memberIndex, result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error picking image', error.message);
    }
  };

  const saveIdProof = async (memberIndex: number, idProofData: string) => {
    if (!profile || !auth.currentUser) return;
    setLoading(true);
    try {
      const updatedMembers = [...(profile.familyMembers || [])];
      if (updatedMembers[memberIndex]) {
        updatedMembers[memberIndex] = {
          ...updatedMembers[memberIndex],
          idProofUrl: idProofData,
        };
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        familyMembers: updatedMembers,
      });

      // Update local state
      const updatedProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(updatedProfile);
      Alert.alert('Success', 'ID proof saved successfully!');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadIdProof = (memberIndex: number) => {
    Alert.alert(
      'Upload ID Proof',
      'Choose an action to upload ID document verification for this family member.',
      [
        {
          text: 'Simulate Upload (Demo Card)',
          onPress: () => {
            const demoID =
              'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=500&auto=format&fit=crop';
            saveIdProof(memberIndex, demoID);
          },
        },
        {
          text: 'Select from Gallery',
          onPress: () => pickImage(memberIndex),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(newPassword);
      if (res.success) {
        Alert.alert(
          'Success',
          'Your password has been changed successfully. Please login again with your new credentials.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await signOut(auth);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Filter requests
  const activePasses = passes.filter(
    (p) => p.status === 'pending' || (p.status === 'approved' && !p.checkOutTime)
  );
  const pastPasses = passes.filter((p) => p.status === 'rejected' || !!p.checkOutTime);

  // Compute stat counts
  const pendingCount = passes.filter((p) => p.status === 'pending').length;
  const approvedCount = passes.filter((p) => p.status === 'approved' && !p.checkInTime).length;
  const insideCount = passes.filter((p) => p.checkInTime && !p.checkOutTime).length;

  const renderStatusBadge = (status: string, checkedIn: boolean, checkedOut: boolean) => {
    if (checkedOut) {
      return (
        <View className="flex-row items-center rounded-full border border-purple-500/30 bg-purple-900/30 px-2.5 py-1">
          <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-purple-400" />
          <Text className="text-xs font-bold uppercase text-purple-400">Checked Out</Text>
        </View>
      );
    }
    if (checkedIn) {
      return (
        <View className="flex-row items-center rounded-full border border-blue-500/30 bg-blue-900/30 px-2.5 py-1">
          <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
          <Text className="text-xs font-bold uppercase text-blue-400">Inside Quarters</Text>
        </View>
      );
    }
    switch (status) {
      case 'approved':
        return (
          <View className="flex-row items-center rounded-full border border-emerald-500/30 bg-emerald-900/30 px-2.5 py-1">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <Text className="text-xs font-bold uppercase text-emerald-400">Approved</Text>
          </View>
        );
      case 'rejected':
        return (
          <View className="flex-row items-center rounded-full border border-red-500/30 bg-red-900/30 px-2.5 py-1">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
            <Text className="text-xs font-bold uppercase text-red-400">Rejected</Text>
          </View>
        );
      default:
        return (
          <View className="flex-row items-center rounded-full border border-amber-500/30 bg-amber-900/30 px-2.5 py-1">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
            <Text className="text-xs font-bold uppercase text-amber-400">Pending Admin</Text>
          </View>
        );
    }
  };

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
      <View className="flex-row items-center justify-between border-b border-slate-800 bg-slate-900 px-6 pb-6 pt-14">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Resident Space
          </Text>
          <Text className="mt-1 text-2xl font-extrabold text-white">
            {profile?.name || 'Resident'}
          </Text>
          <Text className="mt-0.5 text-sm font-semibold text-blue-400">
            {profile?.block} • House {profile?.houseNumber}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="rounded-full border border-slate-700/50 bg-slate-800/80 p-3">
          <MaterialCommunityIcons name="logout" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Statistics Grid */}
        <View className="mb-6 flex-row justify-between">
          <View className="mr-2 flex-1 items-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <Text className="text-2xl font-bold text-amber-500">{pendingCount}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending
            </Text>
          </View>

          <View className="mx-1 mr-2 flex-1 items-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <Text className="text-2xl font-bold text-emerald-500">{approvedCount}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Approved
            </Text>
          </View>

          <View className="ml-1 flex-1 items-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <Text className="text-2xl font-bold text-blue-500">{insideCount}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active In
            </Text>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreatePass')}
          className="mb-6 flex-row items-center justify-between rounded-2xl bg-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 shadow-lg shadow-blue-500/20">
          <View className="flex-row items-center">
            <View className="mr-4 rounded-xl bg-white/20 p-2.5">
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="white" />
            </View>
            <View>
              <Text className="text-base font-extrabold text-white">New Visitor Pass</Text>
              <Text className="mt-0.5 text-xs font-semibold text-blue-100">
                Pre-approve friends, relatives & guests
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
        </TouchableOpacity>

        {/* Family Members & ID Uploads */}
        <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Family ID Verifications
        </Text>

        <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          {!profile?.familyMembers || profile.familyMembers.length === 0 ? (
            <View className="items-center py-4">
              <MaterialCommunityIcons
                name="account-multiple-remove-outline"
                size={28}
                color="#475569"
              />
              <Text className="mt-2 text-center text-xs text-slate-500">
                No family members registered under your profile by Admin.
              </Text>
            </View>
          ) : (
            profile.familyMembers.map((member, idx) => (
              <View key={idx} className="mb-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold text-white">{member.name}</Text>
                    <Text className="mt-0.5 text-xs text-slate-400">
                      {member.relation} • {member.occupation}
                    </Text>
                  </View>

                  {member.idProofUrl ? (
                    <View className="rounded-md border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5">
                      <Text className="text-[10px] font-bold uppercase text-emerald-400">
                        Uploaded
                      </Text>
                    </View>
                  ) : (
                    <View className="rounded-md border border-amber-500/20 bg-amber-950/40 px-2 py-0.5">
                      <Text className="text-[10px] font-bold uppercase text-amber-400">
                        Pending ID
                      </Text>
                    </View>
                  )}
                </View>

                {member.idProofUrl && (
                  <View className="border-slate-850 mb-3 items-center overflow-hidden rounded-xl border bg-slate-900 p-1">
                    <Image
                      source={{ uri: member.idProofUrl }}
                      className="h-36 w-full rounded-lg"
                      resizeMode="cover"
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => handleUploadIdProof(idx)}
                  className="flex-row items-center justify-center rounded-xl border border-slate-800 bg-slate-900 py-2.5">
                  <MaterialCommunityIcons
                    name="cloud-upload-outline"
                    size={16}
                    color="#3b82f6"
                    className="mr-1.5"
                  />
                  <Text className="text-xs font-bold text-blue-400">
                    {member.idProofUrl ? 'Update ID Proof' : 'Upload ID Proof'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Change Password Security Panel */}
        <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Security Settings
        </Text>

        <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <TouchableOpacity
            onPress={() => setShowPasswordPanel(!showPasswordPanel)}
            className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={22}
                color="#f43f5e"
                className="mr-3"
              />
              <Text className="text-sm font-bold text-white">Change Access Password</Text>
            </View>
            <MaterialCommunityIcons
              name={showPasswordPanel ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>

          {showPasswordPanel && (
            <View className="mt-4 border-t border-slate-800 pt-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                New Password
              </Text>
              <View className="mb-3 flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5">
                <MaterialCommunityIcons name="lock-outline" size={18} color="#64748b" />
                <TextInput
                  placeholder="Enter new password"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  className="ml-2.5 flex-1 text-sm text-white"
                />
              </View>

              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Confirm Password
              </Text>
              <View className="mb-4 flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5">
                <MaterialCommunityIcons name="lock-check-outline" size={18} color="#64748b" />
                <TextInput
                  placeholder="Confirm new password"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  className="ml-2.5 flex-1 text-sm text-white"
                />
              </View>

              <TouchableOpacity
                onPress={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-row items-center justify-center rounded-xl bg-blue-600 py-3">
                {passwordLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text className="mr-1 text-xs font-bold text-white">Update Password</Text>
                    <MaterialCommunityIcons name="key-change" size={16} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Active Passes Section */}
        <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Active & Upcoming Passes
        </Text>

        {activePasses.length === 0 ? (
          <View className="mb-6 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-8">
            <MaterialCommunityIcons name="account-clock-outline" size={40} color="#475569" />
            <Text className="mt-3 text-center text-sm font-medium text-slate-400">
              No active visitor passes found.
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-600">
              Create a pass for upcoming visits.
            </Text>
          </View>
        ) : (
          <View className="mb-4">
            {activePasses.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PassDetails', { passId: item.id })}
                className="mb-4 flex-row items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <View className="flex-1 pr-3">
                  <View className="mb-1 flex-row items-center">
                    <Text className="mr-2 text-base font-bold text-white">{item.visitorName}</Text>
                    <Text className="text-xs font-semibold text-slate-500">
                      (
                      {item.numberOfVisitors > 1
                        ? `${item.numberOfVisitors} visitors`
                        : '1 visitor'}
                      )
                    </Text>
                  </View>

                  <Text className="mb-2 flex-row items-center text-xs font-medium text-slate-400">
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={12}
                      color="#94a3b8"
                    />{' '}
                    {item.relationship} • {item.purpose}
                  </Text>

                  <View className="flex-row items-center text-[11px] font-semibold text-slate-500">
                    <MaterialCommunityIcons
                      name="calendar-range"
                      size={12}
                      color="#64748b"
                      className="mr-1"
                    />
                    <Text className="text-slate-500">
                      {new Date(item.arrivalDateTime).toLocaleDateString()}{' '}
                      {new Date(item.arrivalDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  {renderStatusBadge(item.status, !!item.checkInTime, !!item.checkOutTime)}
                  {item.status === 'approved' && (
                    <Text className="mt-2 flex-row items-center text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                      View Pass <MaterialCommunityIcons name="qrcode" size={10} color="#60a5fa" />
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* History Section */}
        <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Recent Visitor History
        </Text>

        {pastPasses.length === 0 ? (
          <View className="mb-10 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-6">
            <Text className="text-xs font-medium text-slate-600">No historical logs yet.</Text>
          </View>
        ) : (
          <View className="mb-10">
            {pastPasses.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PassDetails', { passId: item.id })}
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 opacity-70">
                <View>
                  <Text className="text-sm font-bold text-slate-300">{item.visitorName}</Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {item.relationship} • {item.purpose}
                  </Text>
                  <Text className="mt-1 text-[10px] text-slate-600">
                    Arrived:{' '}
                    {item.checkInTime ? new Date(item.checkInTime).toLocaleString() : 'N/A'}
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
