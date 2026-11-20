import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { calculateSimulation, type ScenarioInput, type SimulationResult } from './utils/simulator';
import type { BrandIdentityState, SessionContinuitySnapshot } from './utils/sessionContinuity';
import { DEFAULT_BRAND_STATE } from './utils/sessionContinuity';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function sanitizeFirestoreId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 100);
  return cleaned || `doc_${Date.now()}`;
}

export async function ensureUserProfile(user: User): Promise<void> {
  const profilePath = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    const displayName = (user.displayName || user.email || 'DoDo Maker').slice(0, 120);
    const photoURL = (user.photoURL || '').slice(0, 500);
    if (!snap.exists()) {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (photoURL) payload.photoURL = photoURL;
      await setDoc(ref, payload);
    } else {
      const payload: Record<string, unknown> = {
        displayName,
        updatedAt: serverTimestamp(),
      };
      if (photoURL) payload.photoURL = photoURL;
      await setDoc(ref, payload, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export async function saveScenarioToCloud(uid: string, result: SimulationResult): Promise<void> {
  const safeId = sanitizeFirestoreId(result.id);
  const path = `users/${uid}/scenarios/${safeId}`;
  try {
    const ref = doc(db, 'users', uid, 'scenarios', safeId);
    const payload: Record<string, unknown> = {
      id: safeId,
      ownerId: uid,
      name: (result.input.name || 'سيناريو').slice(0, 120),
      capital: Math.max(0, Number(result.input.capital) || 100),
      currency: result.input.currency === 'USD' ? 'USD' : 'EGP',
      fxRate: Math.min(500, Math.max(1, Number(result.input.fxRate) || 50)),
      location: String(result.input.location).slice(0, 40),
      market: String(result.input.market).slice(0, 40),
      category: String(result.input.category).slice(0, 40),
      fabric: String(result.input.fabric).slice(0, 40),
      gsm: Math.min(800, Math.max(80, Number(result.input.gsm) || 220)),
      sourcingOrigin: result.input.sourcingOrigin === 'imported' ? 'imported' : 'local',
      mfgModel: String(result.input.mfgModel).slice(0, 40),
      skuCount: Math.min(40, Math.max(1, Number(result.input.skuCount) || 1)),
      volatility: String(result.input.volatility).slice(0, 20),
      salesChannel: String(result.input.salesChannel).slice(0, 20),
      unitCostUsd: Math.max(0, Number(result.unitCostUsd) || 0),
      suggestedRetailUsd: Math.max(0, Number(result.suggestedRetailUsd) || 0),
      grossMarginPct: Math.min(100, Math.max(-1000, Number(result.grossMarginPct) || 0)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (result.input.customUnitCost && result.input.customUnitCost > 0) {
      payload.customUnitCost = Number(result.input.customUnitCost);
    }
    if (result.input.customSellingPrice && result.input.customSellingPrice > 0) {
      payload.customSellingPrice = Number(result.input.customSellingPrice);
    }
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteScenarioFromCloud(uid: string, scenarioId: string): Promise<void> {
  const safeId = sanitizeFirestoreId(scenarioId);
  const path = `users/${uid}/scenarios/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'scenarios', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserScenarios(
  uid: string,
  onData: (items: SimulationResult[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/scenarios`;
  const q = query(
    collection(db, 'users', uid, 'scenarios'),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const results: SimulationResult[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const input: ScenarioInput = {
          id: docSnap.id,
          name: String(d.name || 'سيناريو محفوظ'),
          capital: Number(d.capital) || 100000,
          currency: d.currency === 'USD' ? 'USD' : 'EGP',
          fxRate: Number(d.fxRate) || 50,
          location: (d.location || 'cairo_giza') as ScenarioInput['location'],
          market: (d.market || 'egypt') as ScenarioInput['market'],
          category: (d.category || 'basics') as ScenarioInput['category'],
          fabric: (d.fabric || 'egyptian_cotton') as ScenarioInput['fabric'],
          gsm: (Number(d.gsm) || 220) as ScenarioInput['gsm'],
          sourcingOrigin: d.sourcingOrigin === 'imported' ? 'imported' : 'local',
          mfgModel: (d.mfgModel || 'white_label') as ScenarioInput['mfgModel'],
          skuCount: Number(d.skuCount) || 2,
          volatility: (d.volatility || 'medium') as ScenarioInput['volatility'],
          salesChannel: (d.salesChannel || 'dtc') as ScenarioInput['salesChannel'],
          customUnitCost: d.customUnitCost ? Number(d.customUnitCost) : undefined,
          customSellingPrice: d.customSellingPrice ? Number(d.customSellingPrice) : undefined,
        };
        const sim = calculateSimulation(input);
        results.push({ ...sim, id: docSnap.id });
      });
      onData(results);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export interface CloudBrandSessionRecord {
  id: string;
  brandName: string;
  tagline: string;
  styleDirection: BrandIdentityState['styleDirection'];
  palette: [string, string, string];
  agreedGarments: BrandIdentityState['agreedGarments'];
  designNotes: string;
  logoShape: BrandIdentityState['logoShape'];
  motionStyle: BrandIdentityState['motionStyle'];
  continuityCode: string;
  summaryAr: string;
}

export async function saveBrandSessionToCloud(
  uid: string,
  sessionId: string,
  snapshot: SessionContinuitySnapshot,
  continuityCode: string,
  summaryAr: string
): Promise<void> {
  const safeId = sanitizeFirestoreId(sessionId);
  const path = `users/${uid}/brandSessions/${safeId}`;
  try {
    const ref = doc(db, 'users', uid, 'brandSessions', safeId);
    await setDoc(ref, {
      id: safeId,
      ownerId: uid,
      brandName: (snapshot.brand.brandName || DEFAULT_BRAND_STATE.brandName).slice(0, 100),
      tagline: (snapshot.brand.tagline || '').slice(0, 180),
      styleDirection: String(snapshot.brand.styleDirection || 'streetwear').slice(0, 60),
      palette: snapshot.brand.palette.slice(0, 6).map((c) => String(c).slice(0, 20)),
      agreedGarments: snapshot.brand.agreedGarments.slice(0, 12).map((g) => String(g).slice(0, 60)),
      designNotes: (snapshot.brand.designNotes || '').slice(0, 1500),
      logoShape: String(snapshot.brand.logoShape || 'monogram').slice(0, 60),
      motionStyle: String(snapshot.brand.motionStyle || 'stitch').slice(0, 60),
      continuityCode: continuityCode.slice(0, 12000),
      summaryAr: summaryAr.slice(0, 3000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserBrandSessions(
  uid: string,
  onData: (items: CloudBrandSessionRecord[]) => void
): Unsubscribe {
  const path = `users/${uid}/brandSessions`;
  const q = query(
    collection(db, 'users', uid, 'brandSessions'),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CloudBrandSessionRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          brandName: String(d.brandName || 'KHEIT'),
          tagline: String(d.tagline || ''),
          styleDirection: (d.styleDirection || 'streetwear') as BrandIdentityState['styleDirection'],
          palette: [
            d.palette?.[0] || '#0f766e',
            d.palette?.[1] || '#d97706',
            d.palette?.[2] || '#1e293b',
          ],
          agreedGarments: Array.isArray(d.agreedGarments) ? d.agreedGarments : ['oversize_tee'],
          designNotes: String(d.designNotes || ''),
          logoShape: (d.logoShape || 'monogram') as BrandIdentityState['logoShape'],
          motionStyle: (d.motionStyle || 'stitch') as BrandIdentityState['motionStyle'],
          continuityCode: String(d.continuityCode || ''),
          summaryAr: String(d.summaryAr || ''),
        });
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}
