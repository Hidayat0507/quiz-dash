import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  DocumentData,
  QueryDocumentSnapshot,
  setDoc,
  orderBy,
  limit,
  Timestamp,
  getDoc
} from 'firebase/firestore';

// ... (keep all interfaces)

// Error handler wrapper
const handleFirebaseError = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw error;
  }
};

// Users collection
export const createUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  if (!userId) throw new Error('User ID is required');

  return handleFirebaseError(async () => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  }, 'Failed to create user profile');
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) throw new Error('User ID is required');

  return handleFirebaseError(async () => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        id: userSnap.id,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        photoURL: userData.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        userId: userData.userId
      };
    }

    // If no profile exists, create a default one
    const defaultProfile: Partial<UserProfile> = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      userId
    };

    await createUserProfile(userId, defaultProfile);
    return {
      id: userId,
      ...defaultProfile,
      userId
    } as UserProfile;
  }, 'Failed to fetch user profile');
};

// ... (keep all other functions)