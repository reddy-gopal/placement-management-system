import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentProfileSummary from './StudentProfileSummary';

const profile = {
  rollNumber: '21CSE101',
  branch: 'CSE',
  graduationYear: 2027,
  cgpa: 8.4,
  activeBacklogs: 0,
  skills: ['Java', 'React', 'MongoDB'],
  resumeUrl: 'https://example.com/resume.pdf',
  isPlaced: false,
};

describe('StudentProfileSummary', () => {
  it('shows the saved profile details', () => {
    render(<StudentProfileSummary profile={profile} />);

    expect(screen.getByText('21CSE101')).toBeInTheDocument();
    expect(screen.getByText('CSE • 2027')).toBeInTheDocument();
    expect(screen.getByText('8.4')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    ['Java', 'React', 'MongoDB'].forEach((skill) => expect(screen.getByText(skill)).toBeInTheDocument());
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.queryByText('Placed')).not.toBeInTheDocument();
  });

  it('shows "Not added" when there is no resume', () => {
    render(<StudentProfileSummary profile={{ ...profile, resumeUrl: undefined }} />);
    expect(screen.getByText('Not added')).toBeInTheDocument();
  });

  it('shows a Placed badge when placed', () => {
    render(<StudentProfileSummary profile={{ ...profile, isPlaced: true }} />);
    expect(screen.getByText('Placed')).toBeInTheDocument();
  });

  it('calls onEdit from the Edit Profile button', async () => {
    const onEdit = vi.fn();
    render(<StudentProfileSummary profile={profile} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders an empty state when there is no profile', () => {
    render(<StudentProfileSummary profile={null} onEdit={() => {}} />);
    expect(screen.getByText(/haven't created your profile yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Profile' })).toBeInTheDocument();
  });
});
