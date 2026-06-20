import { db } from '../firebase/config';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

export interface VisitorRequest {
  id: string;
  passCode: string; // 6-digit OTP code (e.g. "489281")
  visitorName: string;
  visitorMobile: string;
  numberOfVisitors: number;
  relationship: string;
  idProofType?: string;
  idNumber?: string;
  arrivalDateTime: string;
  departureDateTime: string;
  purpose: string;
  remarks?: string;
  status: 'pending' | 'approved' | 'rejected';
  residentUid: string;
  residentName: string;
  residentMobile?: string;
  block: string;
  houseNumber: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
  createdAt: any;
}

export interface Block {
  id: string;
  name: string;
  createdAt?: any;
}

export interface House {
  id: string;
  blockId: string;
  blockName: string;
  houseNumber: string;
  familyMembersCount: number;
  createdAt?: any;
}

export const useDatabase = () => {
  // Helper to generate a unique 6-digit numeric OTP code
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // --- SEED DATA ---
  const seedCommunityData = async () => {
    try {
      // 1. Seed Blocks
      const blocksRef = collection(db, 'blocks');
      const existingBlocks = await getDocs(blocksRef);
      if (!existingBlocks.empty) return { success: true, message: 'Already seeded' };

      const batch = writeBatch(db);
      const defaultBlocks = ['Block A', 'Block B', 'Block C', 'Block D'];

      const blockIds: string[] = [];
      defaultBlocks.forEach((blockName) => {
        const blockDocRef = doc(collection(db, 'blocks'));
        blockIds.push(blockDocRef.id);
        batch.set(blockDocRef, {
          id: blockDocRef.id,
          name: blockName,
          createdAt: Timestamp.now(),
        });
      });

      // 2. Seed Houses for each block
      const houseNumbers = ['101', '102', '201', '202', '301', '302'];
      blockIds.forEach((blockId, index) => {
        const blockName = defaultBlocks[index];
        houseNumbers.forEach((houseNum) => {
          const houseDocRef = doc(collection(db, 'houses'));
          batch.set(houseDocRef, {
            id: houseDocRef.id,
            blockId,
            blockName,
            houseNumber: houseNum,
            familyMembersCount: Math.floor(Math.random() * 4) + 2,
            createdAt: Timestamp.now(),
          });
        });
      });

      await batch.commit();
      return { success: true, message: 'Community data seeded successfully!' };
    } catch (error: any) {
      console.error('Error seeding data:', error);
      return { success: false, error: error.message };
    }
  };

  // --- BLOCKS & HOUSES ---
  const getBlocks = async (): Promise<Block[]> => {
    try {
      const q = query(collection(db, 'blocks'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const blocks: Block[] = [];
      querySnapshot.forEach((doc) => {
        blocks.push(doc.data() as Block);
      });
      return blocks;
    } catch (error) {
      console.error('Error fetching blocks:', error);
      return [];
    }
  };

  const getHouses = async (): Promise<House[]> => {
    try {
      const q = query(collection(db, 'houses'), orderBy('houseNumber', 'asc'));
      const querySnapshot = await getDocs(q);
      const houses: House[] = [];
      querySnapshot.forEach((doc) => {
        houses.push(doc.data() as House);
      });
      return houses;
    } catch (error) {
      console.error('Error fetching houses:', error);
      return [];
    }
  };

  const getHousesByBlock = async (blockName: string): Promise<House[]> => {
    try {
      const q = query(
        collection(db, 'houses'),
        where('blockName', '==', blockName)
      );
      const querySnapshot = await getDocs(q);
      const houses: House[] = [];
      querySnapshot.forEach((doc) => {
        houses.push(doc.data() as House);
      });

      // Sort client-side to prevent Firestore composite index requirements
      houses.sort((a, b) => a.houseNumber.localeCompare(b.houseNumber, undefined, { numeric: true, sensitivity: 'base' }));

      return houses;
    } catch (error) {
      console.error('Error fetching houses by block:', error);
      return [];
    }
  };

  const addBlock = async (name: string) => {
    try {
      const docRef = doc(collection(db, 'blocks'));
      await setDoc(docRef, {
        id: docRef.id,
        name,
        createdAt: new Date(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const addHouse = async (blockName: string, houseNumber: string, familyMembersCount: number) => {
    try {
      // Find block id if possible
      const blockQuery = query(collection(db, 'blocks'), where('name', '==', blockName));
      const blockSnap = await getDocs(blockQuery);
      let blockId = 'custom';
      if (!blockSnap.empty) {
        blockId = blockSnap.docs[0].id;
      }

      const docRef = doc(collection(db, 'houses'));
      await setDoc(docRef, {
        id: docRef.id,
        blockId,
        blockName,
        houseNumber,
        familyMembersCount,
        createdAt: new Date(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // --- VISITOR PASS REQUESTS ---
  const createVisitorRequest = async (
    data: Omit<VisitorRequest, 'id' | 'passCode' | 'status' | 'createdAt'>
  ) => {
    try {
      const requestDocRef = doc(collection(db, 'visitor_requests'));
      const passCode = generateOTP();

      const newRequest: VisitorRequest = {
        ...data,
        id: requestDocRef.id,
        passCode,
        status: 'pending',
        createdAt: new Date(),
      };

      await setDoc(requestDocRef, newRequest);
      return { success: true, passId: requestDocRef.id, passCode };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const getResidentVisitorRequests = async (residentUid: string): Promise<VisitorRequest[]> => {
    try {
      const q = query(
        collection(db, 'visitor_requests'),
        where('residentUid', '==', residentUid)
      );
      const querySnapshot = await getDocs(q);
      const requests: VisitorRequest[] = [];
      querySnapshot.forEach((doc) => {
        requests.push(doc.data() as VisitorRequest);
      });

      // Sort client-side to prevent Firestore composite index requirements
      requests.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime() || 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime() || 0);
        return timeB - timeA;
      });

      return requests;
    } catch (error) {
      console.error('Error fetching resident visitor requests:', error);
      return [];
    }
  };

  const getAllVisitorRequests = async (): Promise<VisitorRequest[]> => {
    try {
      const q = query(collection(db, 'visitor_requests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const requests: VisitorRequest[] = [];
      querySnapshot.forEach((doc) => {
        requests.push(doc.data() as VisitorRequest);
      });
      return requests;
    } catch (error) {
      console.error('Error fetching all visitor requests:', error);
      return [];
    }
  };

  const reviewVisitorRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const passRef = doc(db, 'visitor_requests', id);
      await updateDoc(passRef, { status });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // --- SECURITY GUARD OPERATIONS ---
  // Find pass by ID (from QR code) or by 6-digit OTP code
  const getVisitorRequestByIdOrOTP = async (searchStr: string): Promise<VisitorRequest | null> => {
    try {
      const docRef = doc(db, 'visitor_requests', searchStr);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as VisitorRequest;
      }

      // Try searching by 6-digit OTP
      const q = query(collection(db, 'visitor_requests'), where('passCode', '==', searchStr));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as VisitorRequest;
      }

      return null;
    } catch (error) {
      console.error('Error searching for pass:', error);
      return null;
    }
  };

  const recordCheckIn = async (passId: string, guardUid: string, guardName: string) => {
    try {
      const passRef = doc(db, 'visitor_requests', passId);
      await updateDoc(passRef, {
        checkInTime: new Date().toISOString(),
        checkedInBy: guardName,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const recordCheckOut = async (passId: string, guardUid: string, guardName: string) => {
    try {
      const passRef = doc(db, 'visitor_requests', passId);
      await updateDoc(passRef, {
        checkOutTime: new Date().toISOString(),
        checkedOutBy: guardName,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Fetch all users registered in the system (Residents, Admins, Security)
  const getAllUsersProfile = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const profiles: any[] = [];
      querySnapshot.forEach((doc) => {
        profiles.push(doc.data());
      });
      return profiles;
    } catch (error) {
      console.error('Error fetching users profile:', error);
      return [];
    }
  };

  return {
    seedCommunityData,
    getBlocks,
    getHouses,
    getHousesByBlock,
    addBlock,
    addHouse,
    createVisitorRequest,
    getResidentVisitorRequests,
    getAllVisitorRequests,
    reviewVisitorRequest,
    getVisitorRequestByIdOrOTP,
    recordCheckIn,
    recordCheckOut,
    getAllUsersProfile,
  };
};
