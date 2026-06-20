import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDatabase, VisitorRequest } from "../../hooks/database";

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
        Alert.alert("Error fetching pass details", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPass();
  }, [passId]);

  const handleShare = async () => {
    if (!pass) return;

    const shareMessage = `*QUATRUS VISITOR PASS*\n` +
      `-------------------------\n` +
      `*Guest:* ${pass.visitorName} (${pass.numberOfVisitors} Person)\n` +
      `*Host:* ${pass.residentName} (${pass.block}, House ${pass.houseNumber})\n` +
      `*Schedule:* ${new Date(pass.arrivalDateTime).toLocaleDateString()} ${new Date(pass.arrivalDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n` +
      `*Status:* ${pass.status.toUpperCase()}\n` +
      `-------------------------\n` +
      `*GATE OTP CODE:* ${pass.passCode.slice(0, 3)} ${pass.passCode.slice(3)}\n` +
      `*QR Code Pass Link:* https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${pass.id}\n\n` +
      `Please show this QR code or share the OTP code with the security guard at the gate for check-in.`;

    try {
      await Share.share({
        message: shareMessage,
        title: "Quatrus Visitor Pass",
      });
    } catch (error: any) {
      Alert.alert("Sharing failed", error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!pass) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950 p-6">
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-white text-lg font-bold mt-4">Pass Not Found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 bg-slate-800 px-6 py-3 rounded-xl"
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isApproved = pass.status === "approved";
  const isPending = pass.status === "pending";
  const isRejected = pass.status === "rejected";
  const isCheckedIn = !!pass.checkInTime;
  const isCheckedOut = !!pass.checkOutTime;

  // Format OTP as "123 456" for readability
  const formattedOTP = `${pass.passCode.slice(0, 3)} ${pass.passCode.slice(3)}`;

  // Generate QR code URL using standard public QR generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${pass.id}`;

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-14 pb-5 px-6 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4 p-1 rounded-full bg-slate-800"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-extrabold">Pass Details</Text>
        </View>

        {isApproved && !isCheckedOut && (
          <TouchableOpacity
            onPress={handleShare}
            className="bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-xl flex-row items-center"
          >
            <MaterialCommunityIcons name="share-variant" size={14} color="#60a5fa" className="mr-1.5" />
            <Text className="text-blue-400 text-xs font-bold">Share Pass</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Ticket Container */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-12">
          
          {/* Top Banner (Status Bar) */}
          <View className={`py-4 items-center flex-row justify-center border-b border-slate-800 ${
            isCheckedOut ? "bg-purple-950/20" : isCheckedIn ? "bg-blue-950/20" : isApproved ? "bg-emerald-950/20" : isRejected ? "bg-red-950/20" : "bg-amber-950/20"
          }`}>
            <View className={`w-2.5 h-2.5 rounded-full mr-2 ${
              isCheckedOut ? "bg-purple-400" : isCheckedIn ? "bg-blue-400 animate-pulse" : isApproved ? "bg-emerald-400" : isRejected ? "bg-red-400" : "bg-amber-400"
            }`} />
            <Text className={`font-bold text-xs uppercase tracking-widest ${
              isCheckedOut ? "text-purple-400" : isCheckedIn ? "text-blue-400" : isApproved ? "text-emerald-400" : isRejected ? "text-red-400" : "text-amber-400"
            }`}>
              {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In (Inside)" : isApproved ? "Approved Pass" : isRejected ? "Pass Rejected" : "Awaiting Approval"}
            </Text>
          </View>

          {/* Ticket Body */}
          <View className="p-6 items-center">
            {/* Logo Watermark */}
            <Text className="text-slate-700 font-extrabold tracking-widest text-xs uppercase mb-6">QUATRUS SECURITY ACCESS</Text>

            {/* QR Code and OTP Section */}
            {isApproved || isCheckedIn || isCheckedOut ? (
              <View className="items-center mb-6">
                <View className="bg-white p-3 rounded-2xl mb-4 border border-slate-800 shadow-md">
                  <Image
                    source={{ uri: qrCodeUrl }}
                    className="w-48 h-48"
                    resizeMode="contain"
                  />
                </View>

                {/* OTP Passcode box */}
                <View className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 items-center w-64 mt-2">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Gate OTP Code</Text>
                  <Text className="text-white text-2xl font-mono font-extrabold tracking-widest mt-1">
                    {formattedOTP}
                  </Text>
                  <Text className="text-slate-500 text-[9px] text-center mt-1">
                    Use OTP if gate scanner is offline
                  </Text>
                </View>
              </View>
            ) : isPending ? (
              <View className="items-center py-10 mb-6 bg-slate-950/40 rounded-3xl w-full border border-slate-800/50">
                <View className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full items-center justify-center mb-4">
                  <MaterialCommunityIcons name="clock-outline" size={32} color="#f59e0b" />
                </View>
                <Text className="text-white font-bold text-base">Awaiting Verification</Text>
                <Text className="text-slate-500 text-xs text-center px-6 mt-1.5 leading-relaxed">
                  Your pass has been created. The QR code and gate OTP will activate instantly once an administrator approves the request.
                </Text>
              </View>
            ) : (
              <View className="items-center py-10 mb-6 bg-slate-950/40 rounded-3xl w-full border border-slate-800/50">
                <View className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full items-center justify-center mb-4">
                  <MaterialCommunityIcons name="close-circle-outline" size={32} color="#ef4444" />
                </View>
                <Text className="text-white font-bold text-base">Pass Rejected</Text>
                <Text className="text-slate-500 text-xs text-center px-6 mt-1.5 leading-relaxed">
                  This request was rejected by the administration. You can create a new request with updated visitor details.
                </Text>
              </View>
            )}

            {/* Dotted Ticket Tear Line Divider */}
            <View className="w-full flex-row items-center justify-between my-4 opacity-30">
              <View className="w-4 h-4 bg-slate-950 rounded-full -ml-8" />
              <View className="flex-1 h-[1px] border border-dashed border-slate-500 mx-2" />
              <View className="w-4 h-4 bg-slate-950 rounded-full -mr-8" />
            </View>

            {/* Guest & Visit Details */}
            <View className="w-full mt-2">
              <Text className="text-blue-500 font-bold text-xs uppercase tracking-wider mb-3">Visitor Details</Text>
              
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Visitor Name:</Text>
                <Text className="text-white text-xs font-bold">{pass.visitorName}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Mobile Number:</Text>
                <Text className="text-white text-xs font-semibold">{pass.visitorMobile}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Party Count:</Text>
                <Text className="text-white text-xs font-semibold">
                  {pass.numberOfVisitors > 1 ? `${pass.numberOfVisitors} Persons` : "1 Person"}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Relationship:</Text>
                <Text className="text-white text-xs font-semibold">{pass.relationship}</Text>
              </View>

              {pass.idProofType && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-500 text-xs font-semibold">ID Verified:</Text>
                  <Text className="text-white text-xs font-semibold">{pass.idProofType} ({pass.idNumber})</Text>
                </View>
              )}

              <Text className="text-blue-500 font-bold text-xs uppercase tracking-wider mt-5 mb-3">Schedule & Host Info</Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Valid From:</Text>
                <Text className="text-white text-xs font-semibold">
                  {new Date(pass.arrivalDateTime).toLocaleDateString()} {new Date(pass.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Valid Until:</Text>
                <Text className="text-white text-xs font-semibold">
                  {new Date(pass.departureDateTime).toLocaleDateString()} {new Date(pass.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Host Resident:</Text>
                <Text className="text-white text-xs font-bold">{pass.residentName}</Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Quarters Address:</Text>
                <Text className="text-white text-xs font-semibold">Block {pass.block}, House {pass.houseNumber}</Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500 text-xs font-semibold">Purpose:</Text>
                <Text className="text-white text-xs font-semibold">{pass.purpose}</Text>
              </View>

              {pass.remarks && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-500 text-xs font-semibold">Remarks:</Text>
                  <Text className="text-white text-xs font-semibold italic">"{pass.remarks}"</Text>
                </View>
              )}

              {/* Logs Info if Checked-In */}
              {(isCheckedIn || isCheckedOut) && (
                <View className="mt-5 pt-4 border-t border-slate-800/80">
                  <Text className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3">Gate Logs</Text>
                  {isCheckedIn && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-500 text-xs font-semibold">Checked In:</Text>
                      <Text className="text-slate-300 text-xs font-semibold">
                        {new Date(pass.checkInTime!).toLocaleString()} by {pass.checkedInBy}
                      </Text>
                    </View>
                  )}
                  {isCheckedOut && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-500 text-xs font-semibold">Checked Out:</Text>
                      <Text className="text-slate-300 text-xs font-semibold">
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
