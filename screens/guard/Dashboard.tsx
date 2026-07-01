import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

import { auth } from '../../firebase/config';
import { useDatabase, VisitorRequest } from '../../hooks/database';
import { useAuthentication, UserProfile } from '../../hooks/authentication';

export default function GuardDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Search state
  const [searchCode, setSearchCode] = useState('');
  const [scannedPass, setScannedPass] = useState<VisitorRequest | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Today's list and Active Passes
  const [approvedPasses, setApprovedPasses] = useState<VisitorRequest[]>([]);
  const [todayLogs, setTodayLogs] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { getUserProfile } = useAuthentication();
  const { getVisitorRequestByIdOrOTP, recordCheckIn, recordCheckOut, getAllVisitorRequests } =
    useDatabase();

  const loadData = async () => {
    try {
      if (auth.currentUser) {
        const uProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(uProfile);
      }

      const allReqs = await getAllVisitorRequests();

      // Filter passes that are approved and not checked out
      const approved = allReqs.filter((r) => r.status === 'approved' && !r.checkOutTime);
      setApprovedPasses(approved);

      // Filter passes checked in or out today
      const todayStr = new Date().toISOString().split('T')[0];
      const today = allReqs.filter(
        (r) =>
          (r.checkInTime && r.checkInTime.startsWith(todayStr)) ||
          (r.checkOutTime && r.checkOutTime.startsWith(todayStr))
      );
      setTodayLogs(today);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = async (code: string) => {
    if (!code) {
      Alert.alert('Error', 'Please enter a Pass ID or 6-digit OTP');
      return;
    }
    Keyboard.dismiss();
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const trimmed = code.trim().replace(/\s/g, ''); // Remove spaces
      const passData = await getVisitorRequestByIdOrOTP(trimmed);
      setScannedPass(passData);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSimulateScan = (pass: VisitorRequest) => {
    setScannedPass(pass);
    setHasSearched(true);
    setSearchCode(pass.passCode);
  };

  const handleCheckIn = async () => {
    if (!scannedPass || !profile) return;
    setSearchLoading(true);
    try {
      const res = await recordCheckIn(scannedPass.id, profile.uid, profile.name);
      if (res.success) {
        Alert.alert(
          'Check-In Confirmed',
          `Visitor ${scannedPass.visitorName} checked in successfully.`
        );
        // Reload scanned pass to update UI
        const updatedPass = await getVisitorRequestByIdOrOTP(scannedPass.id);
        setScannedPass(updatedPass);
        loadData();
      } else {
        Alert.alert('Error', res.error || 'Failed to check in');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!scannedPass || !profile) return;
    setSearchLoading(true);
    try {
      const res = await recordCheckOut(scannedPass.id, profile.uid, profile.name);
      if (res.success) {
        Alert.alert(
          'Check-Out Confirmed',
          `Visitor ${scannedPass.visitorName} checked out successfully.`
        );
        const updatedPass = await getVisitorRequestByIdOrOTP(scannedPass.id);
        setScannedPass(updatedPass);
        loadData();
      } else {
        Alert.alert('Error', res.error || 'Failed to check out');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Helper to determine pass validity
  const getPassValidity = (pass: VisitorRequest) => {
    if (pass.status === 'pending') {
      return {
        valid: false,
        reason: 'Awaiting Admin Approval',
        color: 'text-amber-500',
        bg: 'bg-amber-950/20',
        border: 'border-amber-500/20',
        icon: 'clock-alert-outline',
      };
    }
    if (pass.status === 'rejected') {
      return {
        valid: false,
        reason: 'Pass Rejected by Admin',
        color: 'text-red-500',
        bg: 'bg-red-950/20',
        border: 'border-red-500/20',
        icon: 'close-circle-outline',
      };
    }
    if (pass.checkOutTime) {
      return {
        valid: false,
        reason: 'Expired - Checked Out Already',
        color: 'text-purple-400',
        bg: 'bg-purple-950/20',
        border: 'border-purple-500/20',
        icon: 'checkbox-marked-circle-outline',
      };
    }

    // Check expiration date
    const now = new Date();
    const expiry = new Date(pass.departureDateTime);
    if (now > expiry) {
      return {
        valid: false,
        reason: 'Expired Pass (Departure Time Passed)',
        color: 'text-red-400',
        bg: 'bg-red-950/20',
        border: 'border-red-500/20',
        icon: 'clock-end',
      };
    }

    return {
      valid: true,
      reason: 'Active Approved Pass',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/20',
      border: 'border-emerald-500/20',
      icon: 'shield-check',
    };
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
      <View className="flex-row items-center justify-between border-b border-slate-800 bg-slate-900 px-6 pb-5 pt-14">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Security Gatehouse
          </Text>
          <Text className="mt-1 text-2xl font-extrabold text-white">Guard Console</Text>
          <Text className="mt-0.5 text-xs font-medium text-slate-400">
            Stationed: {profile?.gate || 'Main Gate'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="rounded-full border border-slate-700/50 bg-slate-800/80 p-3">
          <MaterialCommunityIcons name="logout" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* Verification Inputs Box */}
        <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-white">
            Gate Check Pass
          </Text>

          <View className="mb-2 flex-row">
            <TextInput
              placeholder="Enter Pass ID or 6-digit OTP Code"
              placeholderTextColor="#64748b"
              value={searchCode}
              onChangeText={setSearchCode}
              keyboardType="default"
              autoCapitalize="none"
              className="mr-3 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-base text-white"
            />
            <TouchableOpacity
              onPress={() => handleSearch(searchCode)}
              disabled={searchLoading}
              className="w-14 items-center justify-center rounded-xl bg-blue-600">
              {searchLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <MaterialCommunityIcons name="magnify" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-slate-500">
            Input the 6-digit passcode (e.g. 489 281) shared by the guest.
          </Text>
        </View>

        {/* Verification Preview Result */}
        {hasSearched && (
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Verification Result
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setScannedPass(null);
                  setHasSearched(false);
                  setSearchCode('');
                }}
                className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-slate-400">Clear</Text>
              </TouchableOpacity>
            </View>

            {searchLoading ? (
              <View className="items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : !scannedPass ? (
              /* Invalid Pass Alert Box */
              <View className="items-center rounded-3xl border border-red-500/20 bg-red-950/20 p-6">
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#ef4444" />
                <Text className="mt-3 text-base font-extrabold text-red-400">
                  INVALID QR / OTP CODE
                </Text>
                <Text className="mt-1 px-4 text-center text-xs leading-relaxed text-slate-500">
                  No visitor pass was found matching this code. Do not allow entry. Ask visitor to
                  contact the host.
                </Text>
              </View>
            ) : (
              (() => {
                const validity = getPassValidity(scannedPass);
                return (
                  <View className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-5">
                    {/* Status Banner */}
                    <View
                      className={`-mx-5 -mt-5 flex-row items-center justify-center border-b border-slate-800 px-5 py-3 ${validity.bg}`}>
                      <MaterialCommunityIcons
                        name={validity.icon as any}
                        size={18}
                        color={
                          validity.color === 'text-emerald-400'
                            ? '#10b981'
                            : validity.color === 'text-amber-500'
                              ? '#f59e0b'
                              : '#ef4444'
                        }
                        className="mr-2"
                      />
                      <Text
                        className={`text-xs font-bold uppercase tracking-wider ${validity.color}`}>
                        {validity.reason}
                      </Text>
                    </View>

                    {/* Visitor details summary */}
                    <View className="mt-4">
                      <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        Guest Profile
                      </Text>
                      <Text className="text-lg font-bold text-white">
                        {scannedPass.visitorName}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-400">
                        Mobile: {scannedPass.visitorMobile} • Party of{' '}
                        {scannedPass.numberOfVisitors}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-400">
                        Relationship: {scannedPass.relationship}
                      </Text>

                      <Text className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        Host Residence
                      </Text>
                      <Text className="text-sm font-semibold text-slate-300">
                        {scannedPass.residentName}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-400">
                        Address: Block {scannedPass.block}, House {scannedPass.houseNumber}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-400">
                        Purpose: {scannedPass.purpose}
                      </Text>

                      <Text className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        Validity Window
                      </Text>
                      <Text className="text-xs text-slate-400">
                        From: {new Date(scannedPass.arrivalDateTime).toLocaleString()}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        Until: {new Date(scannedPass.departureDateTime).toLocaleString()}
                      </Text>

                      {/* GATE OPERATIONS BUTTONS */}
                      <View className="mt-6 border-t border-slate-800/80 pt-5">
                        {validity.valid && !scannedPass.checkInTime && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleCheckIn}
                            className="flex-row items-center justify-center rounded-xl bg-emerald-500 py-3.5 shadow-lg shadow-emerald-500/20">
                            <MaterialCommunityIcons
                              name="login"
                              size={20}
                              color="white"
                              className="mr-2"
                            />
                            <Text className="text-base font-bold text-white">
                              RECORD VISITOR CHECK-IN
                            </Text>
                          </TouchableOpacity>
                        )}

                        {scannedPass.checkInTime && !scannedPass.checkOutTime && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleCheckOut}
                            className="flex-row items-center justify-center rounded-xl bg-purple-600 py-3.5 shadow-lg shadow-purple-600/20">
                            <MaterialCommunityIcons
                              name="logout"
                              size={20}
                              color="white"
                              className="mr-2"
                            />
                            <Text className="text-base font-bold text-white">
                              RECORD VISITOR CHECK-OUT
                            </Text>
                          </TouchableOpacity>
                        )}

                        {scannedPass.checkInTime && (
                          <View className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950 p-3">
                            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Entry Log Record
                            </Text>
                            <Text className="mt-1 text-[11px] text-slate-400">
                              Checked In: {new Date(scannedPass.checkInTime).toLocaleString()} by{' '}
                              {scannedPass.checkedInBy}
                            </Text>
                            {scannedPass.checkOutTime && (
                              <Text className="mt-0.5 text-[11px] text-slate-400">
                                Checked Out: {new Date(scannedPass.checkOutTime).toLocaleString()}{' '}
                                by {scannedPass.checkedOutBy}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })()
            )}
          </View>
        )}

        {/* Scanner Simulator Drawer / Picker */}
        <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          QR Scan Simulator (Active Approved Passes)
        </Text>

        {approvedPasses.length === 0 ? (
          <View className="mb-6 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-6">
            <Text className="text-xs font-semibold text-slate-600">
              No active approved passes found to simulate.
            </Text>
            <Text className="mt-0.5 text-[10px] text-slate-700">
              Create and approve passes in Admin/Resident panels.
            </Text>
          </View>
        ) : (
          <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {approvedPasses.map((pass) => (
                <TouchableOpacity
                  key={pass.id}
                  onPress={() => handleSimulateScan(pass)}
                  className="border-slate-850 mr-3 w-40 items-center justify-center rounded-xl border bg-slate-950 p-3">
                  <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                    <MaterialCommunityIcons name="qrcode" size={20} color="#10b981" />
                  </View>
                  <Text className="text-center text-xs font-bold text-white" numberOfLines={1}>
                    {pass.visitorName}
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-slate-500">OTP: {pass.passCode}</Text>
                  <Text className="mt-1 text-[9px] font-bold uppercase text-blue-400">
                    Tap to Scan
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Today's Log Sheet */}
        <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          {"Today's Gate Log Sheet"}
        </Text>
        <View className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          {todayLogs.length === 0 ? (
            <Text className="py-4 text-center text-xs font-medium text-slate-500">
              No visitor gate check-ins or check-outs today yet.
            </Text>
          ) : (
            todayLogs.map((log) => (
              <TouchableOpacity
                key={log.id}
                onPress={() => handleSimulateScan(log)}
                className="flex-row items-center justify-between border-b border-slate-800/60 py-3 last:border-b-0">
                <View>
                  <Text className="text-xs font-bold text-white">{log.visitorName}</Text>
                  <Text className="mt-0.5 text-[10px] text-slate-400">
                    House: Block {log.block} • {log.houseNumber}
                  </Text>
                </View>
                <View className="items-end">
                  {log.checkOutTime ? (
                    <Text className="text-[10px] font-bold uppercase text-purple-400">
                      Checked Out
                    </Text>
                  ) : (
                    <Text className="text-[10px] font-bold uppercase text-emerald-400">
                      Checked In
                    </Text>
                  )}
                  <Text className="mt-0.5 font-mono text-[9px] text-slate-500">
                    OTP: {log.passCode}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
