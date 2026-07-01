import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../firebase/config';
import { useAuthentication, UserProfile } from '../../hooks/authentication';
import { useDatabase } from '../../hooks/database';

const parseDateTime = (dateStr: string, timeStr: string): Date => {
  try {
    const dateParts = dateStr.trim().split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const timeClean = timeStr.trim();
    const timeRegex = /(\d+):(\d+)\s*(AM|PM)?/i;
    const match = timeClean.match(timeRegex);

    let hours = 12;
    let minutes = 0;

    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3];

      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        }
        if (ampm.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    } else {
      const num = parseInt(timeClean, 10);
      if (!isNaN(num) && num >= 0 && num < 24) {
        hours = num;
      }
    }

    return new Date(year, month, day, hours, minutes);
  } catch (e) {
    return new Date(NaN);
  }
};

export default function CreatePass({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorMobile, setVisitorMobile] = useState('');
  const [numberOfVisitors, setNumberOfVisitors] = useState('1');
  const [relationship, setRelationship] = useState('Friend');
  const [idProofType, setIdProofType] = useState('');
  const [idNumber, setIdNumber] = useState('');

  // Date/Time States (Defaulting to today/tomorrow)
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('10:00 AM');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('09:00 PM');

  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');

  const { getUserProfile } = useAuthentication();
  const { createVisitorRequest } = useDatabase();

  useEffect(() => {
    // Populate default date strings
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
    setArrivalDate(formattedDate);
    setDepartureDate(formattedDate);

    // Fetch resident profile
    const loadProfile = async () => {
      if (auth.currentUser) {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(userProfile);
      }
      setFetchingProfile(false);
    };
    loadProfile();
  }, []);

  const handleCreate = async () => {
    if (
      !visitorName ||
      !visitorMobile ||
      !arrivalDate ||
      !arrivalTime ||
      !departureDate ||
      !departureTime ||
      !purpose
    ) {
      Alert.alert('Error', 'Please fill in all required fields marked with *');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'Resident profile not loaded yet');
      return;
    }

    const visitorsCount = parseInt(numberOfVisitors, 10);
    if (isNaN(visitorsCount) || visitorsCount <= 0) {
      Alert.alert('Error', 'Number of visitors must be at least 1');
      return;
    }

    let arrivalISO = '';
    let departureISO = '';

    try {
      const arrDate = parseDateTime(arrivalDate, arrivalTime);
      const depDate = parseDateTime(departureDate, departureTime);

      if (isNaN(arrDate.getTime()) || isNaN(depDate.getTime())) {
        Alert.alert(
          'Invalid Input',
          'Date or Time format is incorrect. Please use YYYY-MM-DD for date and HH:MM AM/PM for time.'
        );
        return;
      }

      arrivalISO = arrDate.toISOString();
      departureISO = depDate.toISOString();
    } catch (parseErr) {
      Alert.alert(
        'Parsing Error',
        'Please verify your Date (YYYY-MM-DD) and Time (e.g. 10:00 AM) formats.'
      );
      return;
    }

    setLoading(true);

    try {
      const result = await createVisitorRequest({
        visitorName,
        visitorMobile,
        numberOfVisitors: visitorsCount,
        relationship,
        idProofType: idProofType || undefined,
        idNumber: idNumber || undefined,
        arrivalDateTime: arrivalISO,
        departureDateTime: departureISO,
        purpose,
        remarks: remarks || undefined,
        residentUid: profile.uid,
        residentName: profile.name,
        residentMobile: profile.mobile,
        block: profile.block || 'Unknown',
        houseNumber: profile.houseNumber || 'Unknown',
      });

      if (result.success) {
        Alert.alert(
          'Pass Created',
          `Your visitor pass request for ${visitorName} has been submitted for Admin approval.\n\nOTP Code: ${result.passCode}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const relationships = ['Friend', 'Relative', 'Guest', 'Service Provider', 'Delivery', 'Other'];

  if (fetchingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center border-b border-slate-800 bg-slate-900 px-6 pb-5 pt-14">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4 rounded-full bg-slate-800 p-1">
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-white">Create Visitor Pass</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Resident Autofill Notice */}
        <View className="mb-6 flex-row items-center rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={24}
            color="#3b82f6"
            className="mr-3"
          />
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase text-slate-400">
              Auto-filled Host Info
            </Text>
            <Text className="mt-0.5 text-sm font-bold text-slate-300">
              {profile?.name} • {profile?.block}, House {profile?.houseNumber}
            </Text>
          </View>
        </View>

        {/* Section 1: Visitor Details */}
        <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-400">
            1. Visitor Details
          </Text>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-slate-400">Visitor Name *</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="account-outline" size={18} color="#64748b" />
              <TextInput
                placeholder="Enter visitor name"
                placeholderTextColor="#64748b"
                value={visitorName}
                onChangeText={setVisitorName}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-slate-400">Mobile Number *</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="phone-outline" size={18} color="#64748b" />
              <TextInput
                placeholder="Enter mobile number"
                placeholderTextColor="#64748b"
                value={visitorMobile}
                onChangeText={setVisitorMobile}
                keyboardType="phone-pad"
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4 flex-row justify-between">
            <View className="mr-2 flex-1">
              <Text className="mb-2 text-xs font-bold text-slate-400">No. of Visitors *</Text>
              <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <MaterialCommunityIcons name="account-multiple-outline" size={18} color="#64748b" />
                <TextInput
                  placeholder="e.g. 1"
                  placeholderTextColor="#64748b"
                  value={numberOfVisitors}
                  onChangeText={setNumberOfVisitors}
                  keyboardType="numeric"
                  className="ml-3 flex-1 text-base text-white"
                />
              </View>
            </View>

            <View className="ml-2 flex-1">
              <Text className="mb-2 text-xs font-bold text-slate-400">Relationship *</Text>
              <View className="h-[52px] justify-center rounded-xl border border-slate-800 bg-slate-950 px-3">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                  {relationships.map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      onPress={() => setRelationship(rel)}
                      className={`mr-1.5 justify-center rounded-lg px-3 py-1.5 ${relationship === rel ? 'bg-blue-600' : 'bg-slate-900'}`}>
                      <Text
                        className={`text-[10px] font-bold ${relationship === rel ? 'text-white' : 'text-slate-400'}`}>
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          <View className="mb-2 flex-row justify-between">
            <View className="mr-2 flex-1">
              <Text className="mb-2 text-xs font-bold text-slate-400">
                ID Proof Type (Optional)
              </Text>
              <TextInput
                placeholder="e.g. Aadhaar, License"
                placeholderTextColor="#64748b"
                value={idProofType}
                onChangeText={setIdProofType}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-white"
              />
            </View>

            <View className="ml-2 flex-1">
              <Text className="mb-2 text-xs font-bold text-slate-400">
                ID Proof Number (Optional)
              </Text>
              <TextInput
                placeholder="e.g. XXXX-XXXX-XXXX"
                placeholderTextColor="#64748b"
                value={idNumber}
                onChangeText={setIdNumber}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-white"
              />
            </View>
          </View>
        </View>

        {/* Section 2: Visit details */}
        <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-400">
            2. Visit Schedule
          </Text>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-slate-400">Arrival Date *</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="calendar" size={18} color="#64748b" />
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
                value={arrivalDate}
                onChangeText={setArrivalDate}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-slate-400">Expected Arrival Time *</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="clock-outline" size={18} color="#64748b" />
              <TextInput
                placeholder="e.g. 10:00 AM"
                placeholderTextColor="#64748b"
                value={arrivalTime}
                onChangeText={setArrivalTime}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-slate-400">Departure Date *</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="calendar" size={18} color="#64748b" />
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
                value={departureDate}
                onChangeText={setDepartureDate}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-slate-400">Expected Departure Time *</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="clock-outline" size={18} color="#64748b" />
              <TextInput
                placeholder="e.g. 09:00 PM"
                placeholderTextColor="#64748b"
                value={departureTime}
                onChangeText={setDepartureTime}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-slate-400">Purpose of Visit *</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <MaterialCommunityIcons name="text-box-outline" size={18} color="#64748b" />
              <TextInput
                placeholder="e.g. Lunch, Delivery, Maintenance"
                placeholderTextColor="#64748b"
                value={purpose}
                onChangeText={setPurpose}
                className="ml-3 flex-1 text-base text-white"
              />
            </View>
          </View>

          <View className="mb-2">
            <Text className="mb-2 text-xs font-bold text-slate-400">Remarks (Optional)</Text>
            <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <TextInput
                placeholder="Add special instructions for guard..."
                placeholderTextColor="#64748b"
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                className="flex-1 text-base text-white"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCreate}
          disabled={loading}
          className="mb-12 flex-row items-center justify-center rounded-2xl bg-blue-600 py-4 shadow-lg shadow-blue-600/30">
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="mr-2 text-base font-bold text-white">Generate Pass Request</Text>
              <MaterialCommunityIcons name="send" size={18} color="white" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
