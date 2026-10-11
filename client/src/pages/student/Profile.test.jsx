import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';
import { getStudentProfile, saveStudentProfile } from '../../services/studentProfileApi';
import { ApiError, NETWORK_ERROR_MESSAGE } from '../../services/apiClient';

vi.mock('../../services/studentProfileApi', () => ({
  getStudentProfile: vi.fn(),
  saveStudentProfile: vi.fn(),
}));

const savedProfile = {
  _id: 'p1',
  userId: 'u1',
  rollNumber: '21CSE101',
  branch: 'CSE',
  graduationYear: 2027,
  cgpa: 8.4,
  activeBacklogs: 0,
  skills: ['Java', 'React', 'MongoDB'],
  resumeUrl: 'https://example.com/resume.pdf',
  isPlaced: false,
};

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/Roll Number/), '21IT042');
  await user.selectOptions(screen.getByLabelText(/Branch/), 'IT');
  await user.type(screen.getByLabelText(/Graduation Year/), '2026');
  await user.type(screen.getByLabelText(/CGPA/), '7.5');
}

const form = () => screen.getByRole('form', { name: 'Edit student profile' });

describe('Student Profile page', () => {
  beforeEach(() => {
    vi.mocked(getStudentProfile).mockReset();
    vi.mocked(saveStudentProfile).mockReset();
  });

  it('shows a loading state while fetching', async () => {
    const pending = deferred();
    getStudentProfile.mockReturnValue(pending.promise);
    render(<Profile />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    pending.resolve(null);
    await screen.findByRole('form', { name: 'Edit student profile' });
  });

  it('populates the form with an existing profile', async () => {
    getStudentProfile.mockResolvedValue(savedProfile);
    render(<Profile />);

    expect(await screen.findByLabelText(/Roll Number/)).toHaveValue('21CSE101');
    expect(screen.getByLabelText(/Branch/)).toHaveValue('CSE');
    expect(screen.getByLabelText(/Graduation Year/)).toHaveValue(2027);
    expect(screen.getByLabelText(/CGPA/)).toHaveValue(8.4);
    expect(screen.getByLabelText(/Active Backlogs/)).toHaveValue(0);
    expect(screen.getByRole('button', { name: 'Remove MongoDB' })).toBeInTheDocument();
    expect(screen.getByLabelText('Resume PDF URL')).toHaveValue('https://example.com/resume.pdf');

    // Summary card reflects saved data
    const summary = screen.getByRole('region', { name: 'Student Profile' });
    expect(within(summary).getByText('CSE • 2027')).toBeInTheDocument();
    expect(within(summary).getByText('Available')).toBeInTheDocument();
  });

  it('shows an empty form (not an error) when no profile exists', async () => {
    getStudentProfile.mockResolvedValue(null);
    render(<Profile />);

    expect(await screen.findByLabelText(/Roll Number/)).toHaveValue('');
    expect(screen.getByText(/Fill in your details below/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a load error with a working Retry button', async () => {
    const user = userEvent.setup();
    getStudentProfile.mockRejectedValueOnce(new ApiError(NETWORK_ERROR_MESSAGE)).mockResolvedValueOnce(null);
    render(<Profile />);

    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('form', { name: 'Edit student profile' })).toBeInTheDocument();
    expect(getStudentProfile).toHaveBeenCalledTimes(2);
  });

  it('blocks submission and shows field errors for invalid input', async () => {
    const user = userEvent.setup();
    getStudentProfile.mockResolvedValue(null);
    render(<Profile />);
    await screen.findByRole('form', { name: 'Edit student profile' });

    await user.type(screen.getByLabelText(/CGPA/), '11');
    const backlogs = screen.getByLabelText(/Active Backlogs/);
    await user.clear(backlogs);
    await user.type(backlogs, '-1');
    await user.click(screen.getByRole('button', { name: 'Save Profile' }));

    expect(screen.getByText('Roll number is required.')).toBeInTheDocument();
    expect(screen.getByText('Branch is required.')).toBeInTheDocument();
    expect(screen.getByText('Graduation year is required.')).toBeInTheDocument();
    expect(screen.getByText('CGPA must be between 0 and 10.')).toBeInTheDocument();
    expect(screen.getByText('Active backlogs cannot be negative.')).toBeInTheDocument();
    expect(screen.getByLabelText(/CGPA/)).toHaveAttribute('aria-invalid', 'true');
    expect(saveStudentProfile).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Roll Number/)).toHaveFocus();
  });

  it('saves the profile, disabling the button while saving', async () => {
    const user = userEvent.setup();
    getStudentProfile.mockResolvedValue(null);
    const pending = deferred();
    saveStudentProfile.mockReturnValue(pending.promise);
    render(<Profile />);
    await screen.findByRole('form', { name: 'Edit student profile' });

    await fillValidForm(user);
    await user.type(screen.getByLabelText('Skills'), 'Python{Enter}');
    await user.type(screen.getByLabelText('Resume PDF URL'), 'https://example.com/cv.pdf');
    await user.click(screen.getByRole('button', { name: 'Save Profile' }));

    const savingButton = screen.getByRole('button', { name: 'Saving...' });
    expect(savingButton).toBeDisabled();
    expect(saveStudentProfile).toHaveBeenCalledWith({
      rollNumber: '21IT042',
      branch: 'IT',
      graduationYear: 2026,
      cgpa: 7.5,
      activeBacklogs: 0,
      skills: ['Python'],
      resumeUrl: 'https://example.com/cv.pdf',
    });

    pending.resolve({
      message: 'Profile created successfully',
      profile: { ...savedProfile, rollNumber: '21IT042', branch: 'IT', graduationYear: 2026, cgpa: 7.5, skills: ['Python'] },
    });

    expect(await screen.findByText('Profile created successfully')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Profile' })).toBeEnabled();
    const summary = screen.getByRole('region', { name: 'Student Profile' });
    expect(within(summary).getByText('21IT042')).toBeInTheDocument();
    expect(within(summary).getByText('IT • 2026')).toBeInTheDocument();
  });

  it('displays API errors, including field errors from the server', async () => {
    const user = userEvent.setup();
    getStudentProfile.mockResolvedValue(savedProfile);
    saveStudentProfile.mockRejectedValue(
      new ApiError('This roll number is already registered to another student.', {
        status: 409,
        errors: { rollNumber: 'This roll number is already registered to another student.' },
      })
    );
    render(<Profile />);
    await screen.findByRole('form', { name: 'Edit student profile' });

    await user.click(screen.getByRole('button', { name: 'Save Profile' }));

    await waitFor(() =>
      expect(screen.getAllByText('This roll number is already registered to another student.')).toHaveLength(2)
    );
    expect(screen.getByLabelText(/Roll Number/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the network error message when the server is unreachable', async () => {
    const user = userEvent.setup();
    getStudentProfile.mockResolvedValue(savedProfile);
    saveStudentProfile.mockRejectedValue(new ApiError(NETWORK_ERROR_MESSAGE));
    render(<Profile />);
    await screen.findByRole('form', { name: 'Edit student profile' });

    await user.click(screen.getByRole('button', { name: 'Save Profile' }));
    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('opens and closes the resume preview using the current URL', async () => {
    const user = userEvent.setup();
    getStudentProfile.mockResolvedValue(savedProfile);
    render(<Profile />);
    await screen.findByRole('form', { name: 'Edit student profile' });

    await user.click(screen.getByRole('button', { name: 'Preview Resume' }));
    expect(screen.getByRole('dialog', { name: 'Resume Preview' })).toBeInTheDocument();
    expect(screen.getByTitle('Resume preview')).toHaveAttribute('src', 'https://example.com/resume.pdf');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview Resume' })).toHaveFocus();
  });

  it('Edit Profile focuses the form', async () => {
    const user = userEvent.setup();
    Element.prototype.scrollIntoView = vi.fn();
    getStudentProfile.mockResolvedValue(savedProfile);
    render(<Profile />);
    await screen.findByRole('form', { name: 'Edit student profile' });

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));
    expect(screen.getByLabelText(/Roll Number/)).toHaveFocus();
  });

  it('never sends userId or isPlaced from the form', async () => {
    const user = userEvent.setup();
    getStudentProfile.mockResolvedValue(savedProfile);
    saveStudentProfile.mockResolvedValue({ message: 'Profile updated successfully', profile: savedProfile });
    render(<Profile />);
    await screen.findByRole('form', { name: 'Edit student profile' });

    await user.click(screen.getByRole('button', { name: 'Save Profile' }));
    expect(await screen.findByText('Profile updated successfully')).toBeInTheDocument();
    const payload = saveStudentProfile.mock.calls[0][0];
    expect(payload).not.toHaveProperty('userId');
    expect(payload).not.toHaveProperty('isPlaced');
    expect(payload).not.toHaveProperty('_id');
  });
});
