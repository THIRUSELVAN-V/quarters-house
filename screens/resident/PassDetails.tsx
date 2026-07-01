import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase, VisitorRequest } from '../../hooks/database';

export default function PassDetails({ route, navigation }: any) {
  const { passId } = route.params;
  const [pass, setPass] = useState<VisitorRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const { getVisitorRequestByIdOrOTP } = useDatabase();

  useEffect(() => {
    const fetchPass = async () => {
      try {
        const data = await getVisitorRequestByIdOrOTP(passId);
        setPass(data);
      } catch (error: any) {
        Alert.alert('Error fetching pass details', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPass();
  }, [passId]);

  const handleShare = async () => {
    if (!pass) return;

    const shareMessage =
      `*QUATRUS VISITOR PASS*\n` +
      `-------------------------\n` +
      `*Guest:* ${pass.visitorName} (${pass.numberOfVisitors} Person)\n` +
      `*Host:* ${pass.residentName} (${pass.block}, House ${pass.houseNumber})\n` +
      `*Schedule:* ${new Date(pass.arrivalDateTime).toLocaleDateString()} ${new Date(pass.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `*Status:* ${pass.status.toUpperCase()}\n` +
      `-------------------------\n` +
      `*GATE OTP CODE:* ${pass.passCode.slice(0, 3)} ${pass.passCode.slice(3)}\n` +
      `*QR Code Pass Link:* https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${pass.id}\n\n` +
      `Please show this QR code or share the OTP code with the security guard at the gate for check-in.`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'Quatrus Visitor Pass',
      });
    } catch (error: any) {
      Alert.alert('Sharing failed', error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!pass) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 p-6">
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-lg font-bold text-white">Pass Not Found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 rounded-xl bg-slate-800 px-6 py-3">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isApproved = pass.status === 'approved';
  const isPending = pass.status === 'pending';
  const isRejected = pass.status === 'rejected';
  const isCheckedIn = !!pass.checkInTime;
  const isCheckedOut = !!pass.checkOutTime;

  // Format OTP as "123 456" for readability
  const formattedOTP = `${pass.passCode.slice(0, 3)} ${pass.passCode.slice(3)}`;

  // Generate QR code URL using standard public QR generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${pass.id}`;

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-800 bg-slate-900 px-6 pb-5 pt-14">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4 rounded-full bg-slate-800 p-1">
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-white">Pass Details</Text>
        </View>

        {isApproved && !isCheckedOut && (
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center rounded-xl border border-blue-500/30 bg-blue-600/20 px-3 py-1.5">
            <MaterialCommunityIcons
              name="share-variant"
              size={14}
              color="#60a5fa"
              className="mr-1.5"
            />
            <Text className="text-xs font-bold text-blue-400">Share Pass</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Ticket Container */}
        <View className="mb-12 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          {/* Top Banner (Status Bar) */}
          <View
            className={`flex-row items-center justify-center border-b border-slate-800 py-4 ${
              isCheckedOut
                ? 'bg-purple-950/20'
                : isCheckedIn
                  ? 'bg-blue-950/20'
                  : isApproved
                    ? 'bg-emerald-950/20'
                    : isRejected
                      ? 'bg-red-950/20'
                      : 'bg-amber-950/20'
            }`}>
            <View
              className={`mr-2 h-2.5 w-2.5 rounded-full ${
                isCheckedOut
                  ? 'bg-purple-400'
                  : isCheckedIn
                    ? 'animate-pulse bg-blue-400'
                    : isApproved
                      ? 'bg-emerald-400'
                      : isRejected
                        ? 'bg-red-400'
                        : 'bg-amber-400'
              }`}
            />
            <Text
              className={`text-xs font-bold uppercase tracking-widest ${
                isCheckedOut
                  ? 'text-purple-400'
                  : isCheckedIn
                    ? 'text-blue-400'
                    : isApproved
                      ? 'text-emerald-400'
                      : isRejected
                        ? 'text-red-400'
                        : 'text-amber-400'
              }`}>
              {isCheckedOut
                ? 'Checked Out'
                : isCheckedIn
                  ? 'Checked In (Inside)'
                  : isApproved
                    ? 'Approved Pass'
                    : isRejected
                      ? 'Pass Rejected'
                      : 'Awaiting Approval'}
            </Text>
          </View>

          {/* Ticket Body */}
          <View className="items-center p-6">
            {/* Logo Watermark */}
            <Text className="mb-6 text-xs font-extrabold uppercase tracking-widest text-slate-700">
              QUATRUS SECURITY ACCESS
            </Text>

            {/* QR Code and OTP Section */}
            {isApproved || isCheckedIn || isCheckedOut ? (
              <View className="mb-6 items-center">
                <View className="mb-4 rounded-2xl border border-slate-800 bg-white p-3 shadow-md">
                  <Image source={{ uri: qrCodeUrl }} className="h-48 w-48" resizeMode="contain" />
                </View>

                {/* OTP Passcode box */}
                <View className="mt-2 w-64 items-center rounded-2xl border border-slate-800 bg-slate-950 px-6 py-3">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Gate OTP Code
                  </Text>
                  <Text className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-white">
                    {formattedOTP}
                  </Text>
                  <Text className="mt-1 text-center text-[9px] text-slate-500">
                    Use OTP if gate scanner is offline
                  </Text>
                </View>
              </View>
            ) : isPending ? (
              <View className="mb-6 w-full items-center rounded-3xl border border-slate-800/50 bg-slate-950/40 py-10">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
                  <MaterialCommunityIcons name="clock-outline" size={32} color="#f59e0b" />
                </View>
                <Text className="text-base font-bold text-white">Awaiting Verification</Text>
                <Text className="mt-1.5 px-6 text-center text-xs leading-relaxed text-slate-500">
                  Your pass has been created. The QR code and gate OTP will activate instantly once
                  an administrator approves the request.
                </Text>
              </View>
            ) : (
              <View className="mb-6 w-full items-center rounded-3xl border border-slate-800/50 bg-slate-950/40 py-10">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                  <MaterialCommunityIcons name="close-circle-outline" size={32} color="#ef4444" />
                </View>
                <Text className="text-base font-bold text-white">Pass Rejected</Text>
                <Text className="mt-1.5 px-6 text-center text-xs leading-relaxed text-slate-500">
                  This request was rejected by the administration. You can create a new request with
                  updated visitor details.
                </Text>
              </View>
            )}

            {/* Dotted Ticket Tear Line Divider */}
            <View className="my-4 w-full flex-row items-center justify-between opacity-30">
              <View className="-ml-8 h-4 w-4 rounded-full bg-slate-950" />
              <View className="mx-2 h-[1px] flex-1 border border-dashed border-slate-500" />
              <View className="-mr-8 h-4 w-4 rounded-full bg-slate-950" />
            </View>

            {/* Guest & Visit Details */}
            <View className="mt-2 w-full">
              <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-500">
                Visitor Details
              </Text>

              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Visitor Name:</Text>
                <Text className="text-xs font-bold text-white">{pass.visitorName}</Text>
              </View>
              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Mobile Number:</Text>
                <Text className="text-xs font-semibold text-white">{pass.visitorMobile}</Text>
              </View>
              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Party Count:</Text>
                <Text className="text-xs font-semibold text-white">
                  {pass.numberOfVisitors > 1 ? `${pass.numberOfVisitors} Persons` : '1 Person'}
                </Text>
              </View>
              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Relationship:</Text>
                <Text className="text-xs font-semibold text-white">{pass.relationship}</Text>
              </View>

              {pass.idProofType && (
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-xs font-semibold text-slate-500">ID Verified:</Text>
                  <Text className="text-xs font-semibold text-white">
                    {pass.idProofType} ({pass.idNumber})
                  </Text>
                </View>
              )}

              <Text className="mb-3 mt-5 text-xs font-bold uppercase tracking-wider text-blue-500">
                Schedule & Host Info
              </Text>

              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Valid From:</Text>
                <Text className="text-xs font-semibold text-white">
                  {new Date(pass.arrivalDateTime).toLocaleDateString()}{' '}
                  {new Date(pass.arrivalDateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Valid Until:</Text>
                <Text className="text-xs font-semibold text-white">
                  {new Date(pass.departureDateTime).toLocaleDateString()}{' '}
                  {new Date(pass.departureDateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Host Resident:</Text>
                <Text className="text-xs font-bold text-white">{pass.residentName}</Text>
              </View>

              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Quarters Address:</Text>
                <Text className="text-xs font-semibold text-white">
                  Block {pass.block}, House {pass.houseNumber}
                </Text>
              </View>

              <View className="mb-2 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-500">Purpose:</Text>
                <Text className="text-xs font-semibold text-white">{pass.purpose}</Text>
              </View>

              {pass.remarks && (
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-xs font-semibold text-slate-500">Remarks:</Text>
                  <Text className="text-xs font-semibold italic text-white">
                    {'"'}
                    {pass.remarks}
                    {'"'}
                  </Text>
                </View>
              )}

              {/* Logs Info if Checked-In */}
              {(isCheckedIn || isCheckedOut) && (
                <View className="mt-5 border-t border-slate-800/80 pt-4">
                  <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-400">
                    Gate Logs
                  </Text>
                  {isCheckedIn && (
                    <View className="mb-2 flex-row justify-between">
                      <Text className="text-xs font-semibold text-slate-500">Checked In:</Text>
                      <Text className="text-xs font-semibold text-slate-300">
                        {new Date(pass.checkInTime!).toLocaleString()} by {pass.checkedInBy}
                      </Text>
                    </View>
                  )}
                  {isCheckedOut && (
                    <View className="mb-2 flex-row justify-between">
                      <Text className="text-xs font-semibold text-slate-500">Checked Out:</Text>
                      <Text className="text-xs font-semibold text-slate-300">
                        {new Date(pass.checkOutTime!).toLocaleString()} by {pass.checkedOutBy}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
