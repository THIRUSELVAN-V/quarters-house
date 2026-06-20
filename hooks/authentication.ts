import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'resident' | 'admin' | 'security';
  name: string;
  mobile: string;
  createdAt: any;
  block?: string;
  houseNumber?: string;
  gate?: string;
  isApproved?: boolean;
}

export const useAuthentication = () => {
  const register = async ({
    email,
    password,
    role,
    name,
    mobile,
    block,
    houseNumber,
    gate,
  }: {
    email: string;
    password: string;
    role: 'resident' | 'admin' | 'security';
    name: string;
    mobile: string;
    block?: string;
    houseNumber?: string;
    gate?: string;
  }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const profileData: UserProfile = {
        uid: userCredential.user.uid,
        email,
        role,
        name,
        mobile,
        createdAt: new Date(),
      };

      if (role === 'resident') {
        profileData.block = block || '';
        profileData.houseNumber = houseNumber || '';
        profileData.isApproved = true; // Approved by default for simple flow, can be managed by admin
      } else if (role === 'security') {
        profileData.gate = gate || 'Main Gate';
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), profileData);

      return { success: true, error: null, user: userCredential };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Fetch the role to make sure user exists
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        // If profile was missing, create a basic one as resident
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          role: 'resident',
          name: email.split('@')[0],
          mobile: '',
          createdAt: new Date(),
        });
      }
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  return { register, login, getUserProfile };
};
