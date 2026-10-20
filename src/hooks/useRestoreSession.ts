import { useEffect } from 'react';
import { restoreUsernameSession } from '../lib/usernameAuth';

type RestoreSessionOptions = {
  setAuthBusy: (value: boolean) => void;
  setAuthError: (value: string) => void;
  setRole: (value: any) => void;
  setOfficeId: (value: string) => void;
  loadProperties: (officeId: string) => Promise<any>;
  loadCustomers: (officeId: string) => Promise<any>;
  loadMatches: (officeId: string) => Promise<any>;
  loadNotifications: (officeId: string) => Promise<any>;
  loadTeamMembers: (officeId: string) => Promise<any>;
  setMustChangePassword: (value: boolean) => void;
  setAuthenticated: (value: boolean) => void;
};

export default function useRestoreSession(options: RestoreSessionOptions) {
  const { setAuthBusy, setAuthError, setRole, setOfficeId, loadProperties, loadCustomers, loadMatches, loadNotifications, loadTeamMembers, setMustChangePassword, setAuthenticated } = options;
    useEffect(() => {
      let cancelled = false;
      const restoreSession = async () => {
        setAuthBusy(true);
        try {
          const result = await restoreUsernameSession();
          if (!result || cancelled) return;
          setRole(result.role);
          if (result.role !== 'superadmin') {
            setOfficeId(result.officeId);
            await Promise.all([
              loadProperties(result.officeId),
              loadCustomers(result.officeId),
              loadMatches(result.officeId),
              loadNotifications(result.officeId),
              ...(result.role === 'owner' ? [loadTeamMembers(result.officeId)] : []),
            ]);
            if (cancelled) return;
            setMustChangePassword(result.mustChangePassword);
          }
          if (!cancelled) setAuthenticated(true);
        } catch (error) {
          if (!cancelled) setAuthError('Oturum kontrol edilemedi. İnternet bağlantısını kontrol edip tekrar deneyin.');
        } finally {
          if (!cancelled) setAuthBusy(false);
        }
      };
      void restoreSession();
      return () => { cancelled = true; };
    }, []);
}
