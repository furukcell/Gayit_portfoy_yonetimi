import { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGAL_VERSION } from '../legalDocuments';
import { getFirebaseAuth } from '../lib/firebase';

type LegalAcceptanceOptions = {
  authenticated: boolean;
  legalReadPrivacy: boolean;
  legalAcceptTerms: boolean;
  legalGateBusy: boolean;
  setLegalReady: (value: boolean) => void;
  setLegalAccepted: (value: boolean) => void;
  setLegalGateBusy: (value: boolean) => void;
  setLegalDocument: (value: 'privacy' | 'terms' | 'about' | null) => void;
};

export default function useLegalAcceptance(options: LegalAcceptanceOptions) {
  const { authenticated, legalReadPrivacy, legalAcceptTerms, legalGateBusy, setLegalReady, setLegalAccepted, setLegalGateBusy, setLegalDocument } = options;
    useEffect(() => {
      let cancelled = false;
      const checkLegalAcceptance = async () => {
        if (!authenticated) { setLegalReady(false); setLegalAccepted(false); return; }
        const uid = getFirebaseAuth().currentUser?.uid;
        if (!uid) { setLegalReady(true); setLegalAccepted(false); return; }
        setLegalReady(false);
        try {
          const stored = await AsyncStorage.getItem('gayit_legal_acceptance_' + uid);
          if (!cancelled) setLegalAccepted(stored === LEGAL_VERSION);
        } catch { if (!cancelled) setLegalAccepted(false); }
        finally { if (!cancelled) setLegalReady(true); }
      };
      void checkLegalAcceptance();
      return () => { cancelled = true; };
    }, [authenticated]);
  
    const confirmLegalAcceptance = async () => {
      if (!legalReadPrivacy || !legalAcceptTerms || legalGateBusy) return;
      const uid = getFirebaseAuth().currentUser?.uid;
      if (!uid) { Alert.alert('Oturum bulunamadı', 'Devam etmek için yeniden giriş yap.'); return; }
      setLegalGateBusy(true);
      try {
        await AsyncStorage.setItem('gayit_legal_acceptance_' + uid, LEGAL_VERSION);
        setLegalAccepted(true); setLegalDocument(null);
      } catch { Alert.alert('Kaydedilemedi', 'Kabul kaydı bu cihazda saklanamadı. Lütfen tekrar dene.'); }
      finally { setLegalGateBusy(false); }
    };
  return { confirmLegalAcceptance };
}
