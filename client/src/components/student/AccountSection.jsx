import FormField from '../ui/FormField';
import ProfileSection from './ProfileSection';

/** Name and email come from the login account and can't be edited here. */
export default function AccountSection({ user }) {
  return (
    <ProfileSection title="Account" description="Managed by your university login.">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField id="accountName" label="Full name">
          <input id="accountName" className="input" value={user?.name ?? ''} placeholder="—" disabled readOnly />
        </FormField>
        <FormField id="accountEmail" label="Email">
          <input id="accountEmail" className="input" value={user?.email ?? ''} placeholder="—" disabled readOnly />
        </FormField>
      </div>
    </ProfileSection>
  );
}
