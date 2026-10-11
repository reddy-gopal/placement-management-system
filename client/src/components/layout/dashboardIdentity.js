import { createContext, useContext, useEffect } from 'react';

/**
 * Lets a page tell the surrounding DashboardLayout who is signed in
 * (used for the top-bar avatar and the sidebar identity block).
 * Outside a layout (e.g. in page tests) the setter is a harmless no-op.
 */
export const DashboardIdentityContext = createContext(() => {});

export function useDashboardIdentity(identity) {
  const setIdentity = useContext(DashboardIdentityContext);
  const rollNumber = identity?.rollNumber;
  const branch = identity?.branch;
  const graduationYear = identity?.graduationYear;

  useEffect(() => {
    setIdentity(rollNumber ? { rollNumber, branch, graduationYear } : null);
  }, [setIdentity, rollNumber, branch, graduationYear]);
}
