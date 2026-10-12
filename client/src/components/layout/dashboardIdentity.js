import { createContext, useContext, useEffect } from 'react';

/**
 * Lets a page tell the surrounding layout about itself:
 * - setIdentity: extra details for the sidebar account block (roll number, company name…)
 * - setPageTitle: breadcrumb title for pages that aren't nav items (e.g. a drive's detail page)
 * Outside a layout (e.g. in page tests) the setters are harmless no-ops.
 */
export const LayoutContext = createContext({ setIdentity: () => {}, setPageTitle: () => {} });

/** @deprecated alias kept for older imports */
export const DashboardIdentityContext = LayoutContext;

export function useDashboardIdentity(identity) {
  const { setIdentity } = useContext(LayoutContext);
  const name = identity?.name;
  const rollNumber = identity?.rollNumber;
  const branch = identity?.branch;
  const graduationYear = identity?.graduationYear;
  const subtitle = identity?.subtitle;

  useEffect(() => {
    setIdentity(name || rollNumber || subtitle ? { name, rollNumber, branch, graduationYear, subtitle } : null);
  }, [setIdentity, name, rollNumber, branch, graduationYear, subtitle]);
}

/** Sets the breadcrumb's last segment while the calling page is mounted. */
export function usePageTitle(title) {
  const { setPageTitle } = useContext(LayoutContext);
  useEffect(() => {
    setPageTitle(title || null);
    return () => setPageTitle(null);
  }, [setPageTitle, title]);
}
