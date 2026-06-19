
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export const useAuthentication = () => {
  const register = async ({ email, password }: { email: string; password: string }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        createdAt: new Date(),
      });

      return { success: true, error: null, user: userCredential};
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  const login = async ({ email, password }: { email: string; password: string }) => {
      try {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        return { success: true, error: null };
  
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    };

  return { register, login };
};
