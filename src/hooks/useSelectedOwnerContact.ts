import { useEffect } from 'react';
import { getFirebaseClient } from '../lib/firebaseClient';

type OwnerContact = { name: string; phone: string } | null;

export default function useSelectedOwnerContact(
  propertyId: string | undefined,
  setOwnerContact: (value: OwnerContact) => void,
) {
  useEffect(() => {
    let cancelled = false;
    setOwnerContact(null);
    if (!propertyId) return;
    void (async () => {
      const client = getFirebaseClient();
      const { data } = await client.from('properties')
        .select('owner_contact_name,owner_contact_phone')
        .eq('id', propertyId).maybeSingle();
      if (!cancelled && data) {
        setOwnerContact({
          name: data.owner_contact_name || '',
          phone: data.owner_contact_phone || '',
        });
      }
    })();
    return () => { cancelled = true; };
  }, [propertyId, setOwnerContact]);
}
