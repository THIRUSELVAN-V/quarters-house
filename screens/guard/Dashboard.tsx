import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { useFocusEffect } from "@react-navigation/native";

import { auth } from "../../firebase/config";
import { useDatabase, VisitorRequest } from "../../hooks/database";
import { useAuthentication, UserProfile } from "../../hooks/authentication";

export default function GuardDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Search state
  const [searchCode, setSearchCode] = useState("");
  const [scannedPass, setScannedPass] = useState<VisitorRequest | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Today's list and Active Passes
  const [approvedPasses, setApprovedPasses] = useState<VisitorRequest[]>([]);
  const [todayLogs, setTodayLogs] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { getUserProfile } = useAuthentication();
  const {
    getVisitorRequestByIdOrOTP,
    recordCheckIn,
    recordCheckOut,
    getAllVisitorRequests,
  } = useDatabase();

  const loadData = async () => {
    try {
      if (auth.currentUser) {
        const uProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(uProfile);
      }
      
      const allReqs = await getAllVisitorRequests();
      
      // Filter passes that are approved and not checked out
      const approved = allReqs.filter(r => r.status === 'approved' && !r.checkOutTime);
      setApprovedPasses(approved);
      
      // Filter passes checked in or out today
      const todayStr = new Date().toISOString().split('T')[0];
      const today = allReqs.filter(r => 
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
      Alert.alert("Error", "Please enter a Pass ID or 6-digit OTP");
      return;
    }
    Keyboard.dismiss();
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const trimmed = code.trim().replace(/\s/g, ""); // Remove spaces
      const passData = await getVisitorRequestByIdOrOTP(trimmed);
      setScannedPass(passData);
    } catch (err: any) {
      Alert.alert("Error", err.message);
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
        Alert.alert("Check-In Confirmed", `Visitor ${scannedPass.visitorName} checked in successfully.`);
        // Reload scanned pass to update UI
        const updatedPass = await getVisitorRequestByIdOrOTP(scannedPass.id);
        setScannedPass(updatedPass);
        loadData();
      } else {
        Alert.alert("Error", res.error || "Failed to check in");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
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
        Alert.alert("Check-Out Confirmed", `Visitor ${scannedPass.visitorName} checked out successfully.`);
        const updatedPass = await getVisitorRequestByIdOrOTP(scannedPass.id);
        setScannedPass(updatedPass);
        loadData();
      } else {
        Alert.alert("Error", res.error || "Failed to check out");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Helper to determine pass validity
  const getPassValidity = (pass: VisitorRequest) => {
    if (pass.status === 'pending') {
      return { valid: false, reason: "Awaiting Admin Approval", color: "text-amber-500", bg: "bg-amber-950/20", border: "border-amber-500/20", icon: "clock-alert-outline" };
    }
    if (pass.status === 'rejected') {
      return { valid: false, reason: "Pass Rejected by Admin", color: "text-red-500", bg: "bg-red-950/20", border: "border-red-500/20", icon: "close-circle-outline" };
    }
    if (pass.checkOutTime) {
      return { valid: false, reason: "Expired - Checked Out Already", color: "text-purple-400", bg: "bg-purple-950/20", border: "border-purple-500/20", icon: "checkbox-marked-circle-outline" };
    }
    
    // Check expiration date
    const now = new Date();
    const expiry = new Date(pass.departureDateTime);
    if (now > expiry) {
      return { valid: false, reason: "Expired Pass (Departure Time Passed)", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-500/20", icon: "clock-end" };
    }

    return { valid: true, reason: "Active Approved Pass", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-500/20", icon: "shield-check" };
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
      <View className="bg-slate-900 border-b border-slate-800 pt-14 pb-5 px-6 flex-row justify-between items-center">
        <View>
          <Text className="text-amber-500 text-xs font-bold uppercase tracking-widest">Security Gatehouse</Text>
          <Text className="text-white text-2xl font-extrabold mt-1">Guard Console</Text>
          <Text className="text-slate-400 text-xs font-medium mt-0.5">
            Stationed: {profile?.gate || "Main Gate"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-slate-800/80 p-3 rounded-full border border-slate-700/50"
        >
          <MaterialCommunityIcons name="logout" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        
        {/* Verification Inputs Box */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6">
          <Text className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Gate Check Pass</Text>
          
          <View className="flex-row mb-2">
            <TextInput
              placeholder="Enter Pass ID or 6-digit OTP Code"
              placeholderTextColor="#64748b"
              value={searchCode}
              onChangeText={setSearchCode}
              keyboardType="default"
              autoCapitalize="none"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white mr-3 text-base font-mono"
            />
            <TouchableOpacity
              onPress={() => handleSearch(searchCode)}
              disabled={searchLoading}
              className="bg-blue-600 w-14 rounded-xl justify-center items-center"
            >
              {searchLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <MaterialCommunityIcons name="magnify" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
          <Text className="text-slate-500 text-[10px]">
            Input the 6-digit passcode (e.g. 489 281) shared by the guest.
          </Text>
        </View>

        {/* Verification Preview Result */}
        {hasSearched && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs">Verification Result</Text>
              <TouchableOpacity
                onPress={() => {
                  setScannedPass(null);
                  setHasSearched(false);
                  setSearchCode("");
                }}
                className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md"
              >
                <Text className="text-slate-400 text-[10px] font-bold">Clear</Text>
              </TouchableOpacity>
            </View>

            {searchLoading ? (
              <View className="bg-slate-900 border border-slate-800 rounded-3xl p-8 items-center justify-center">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : !scannedPass ? (
              /* Invalid Pass Alert Box */
              <View className="bg-red-950/20 border border-red-500/20 rounded-3xl p-6 items-center">
                <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#ef4444" />
                <Text className="text-red-400 font-extrabold text-base mt-3">INVALID QR / OTP CODE</Text>
                <Text className="text-slate-500 text-xs text-center px-4 mt-1 leading-relaxed">
                  No visitor pass was found matching this code. Do not allow entry. Ask visitor to contact the host.
                </Text>
              </View>
            ) : (() => {
              const validity = getPassValidity(scannedPass);
              return (
                <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden">
                  
                  {/* Status Banner */}
                  <View className={`-mx-5 -mt-5 px-5 py-3 border-b border-slate-800 flex-row items-center justify-center ${validity.bg}`}>
                    <MaterialCommunityIcons name={validity.icon as any} size={18} color={validity.color === "text-emerald-400" ? "#10b981" : validity.color === "text-amber-500" ? "#f59e0b" : "#ef4444"} className="mr-2" />
                    <Text className={`font-bold text-xs uppercase tracking-wider ${validity.color}`}>
                      {validity.reason}
                    </Text>
                  </View>

                  {/* Visitor details summary */}
                  <View className="mt-4">
                    <Text className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-2">Guest Profile</Text>
                    <Text className="text-white text-lg font-bold">{scannedPass.visitorName}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      Mobile: {scannedPass.visitorMobile} • Party of {scannedPass.numberOfVisitors}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      Relationship: {scannedPass.relationship}
                    </Text>

                    <Text className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mt-4 mb-2">Host Residence</Text>
                    <Text className="text-slate-300 text-sm font-semibold">{scannedPass.residentName}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      Address: Block {scannedPass.block}, House {scannedPass.houseNumber}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">Purpose: {scannedPass.purpose}</Text>

                    <Text className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mt-4 mb-2">Validity Window</Text>
                    <Text className="text-slate-400 text-xs">
                      From: {new Date(scannedPass.arrivalDateTime).toLocaleString()}
                    </Text>
                    <Text className="text-slate-400 text-xs">
                      Until: {new Date(scannedPass.departureDateTime).toLocaleString()}
                    </Text>

                    {/* GATE OPERATIONS BUTTONS */}
                    <View className="mt-6 border-t border-slate-800/80 pt-5">
                      {validity.valid && !scannedPass.checkInTime && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleCheckIn}
                          className="bg-emerald-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-lg shadow-emerald-500/20"
                        >
                          <MaterialCommunityIcons name="login" size={20} color="white" className="mr-2" />
                          <Text className="text-white text-base font-bold">RECORD VISITOR CHECK-IN</Text>
                        </TouchableOpacity>
                      )}

                      {scannedPass.checkInTime && !scannedPass.checkOutTime && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleCheckOut}
                          className="bg-purple-600 py-3.5 rounded-xl flex-row justify-center items-center shadow-lg shadow-purple-600/20"
                        >
                          <MaterialCommunityIcons name="logout" size={20} color="white" className="mr-2" />
                          <Text className="text-white text-base font-bold">RECORD VISITOR CHECK-OUT</Text>
                        </TouchableOpacity>
                      )}

                      {scannedPass.checkInTime && (
                        <View className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 mt-3">
                          <Text className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Entry Log Record</Text>
                          <Text className="text-slate-400 text-[11px] mt-1">
                            Checked In: {new Date(scannedPass.checkInTime).toLocaleString()} by {scannedPass.checkedInBy}
                          </Text>
                          {scannedPass.checkOutTime && (
                            <Text className="text-slate-400 text-[11px] mt-0.5">
                              Checked Out: {new Date(scannedPass.checkOutTime).toLocaleString()} by {scannedPass.checkedOutBy}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                  </View>

                </View>
              );
            })()}
          </View>
        )}

        {/* Scanner Simulator Drawer / Picker */}
        <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">
          QR Scan Simulator (Active Approved Passes)
        </Text>
        
        {approvedPasses.length === 0 ? (
          <View className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-6 items-center justify-center mb-6">
            <Text className="text-slate-600 text-xs font-semibold">No active approved passes found to simulate.</Text>
            <Text className="text-slate-700 text-[10px] mt-0.5">Create and approve passes in Admin/Resident panels.</Text>
          </View>
        ) : (
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {approvedPasses.map((pass) => (
                <TouchableOpacity
                  key={pass.id}
                  onPress={() => handleSimulateScan(pass)}
                  className="bg-slate-950 border border-slate-850 p-3 rounded-xl mr-3 w-40 items-center justify-center"
                >
                  <View className="w-10 h-10 bg-emerald-500/10 rounded-full items-center justify-center mb-2">
                    <MaterialCommunityIcons name="qrcode" size={20} color="#10b981" />
                  </View>
                  <Text className="text-white text-xs font-bold text-center" numberOfLines={1}>
                    {pass.visitorName}
                  </Text>
                  <Text className="text-slate-500 text-[10px] mt-0.5">
                    OTP: {pass.passCode}
                  </Text>
                  <Text className="text-blue-400 text-[9px] font-bold uppercase mt-1">Tap to Scan</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Today's Log Sheet */}
        <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Today's Gate Log Sheet</Text>
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-10">
          {todayLogs.length === 0 ? (
            <Text className="text-slate-500 text-xs py-4 text-center font-medium">
              No visitor gate check-ins or check-outs today yet.
            </Text>
          ) : (
            todayLogs.map((log) => (
              <TouchableOpacity
                key={log.id}
                onPress={() => handleSimulateScan(log)}
                className="flex-row items-center justify-between py-3 border-b border-slate-800/60 last:border-b-0"
              >
                <View>
                  <Text className="text-white text-xs font-bold">{log.visitorName}</Text>
                  <Text className="text-slate-400 text-[10px] mt-0.5">
                    House: Block {log.block} • {log.houseNumber}
                  </Text>
                </View>
                <View className="items-end">
                  {log.checkOutTime ? (
                    <Text className="text-purple-400 text-[10px] font-bold uppercase">Checked Out</Text>
                  ) : (
                    <Text className="text-emerald-400 text-[10px] font-bold uppercase">Checked In</Text>
                  )}
                  <Text className="text-slate-500 text-[9px] mt-0.5 font-mono">
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
