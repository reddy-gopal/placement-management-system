import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumePreviewModal, { PREVIEW_ERROR_MESSAGE } from './ResumePreviewModal';

describe('ResumePreviewModal', () => {
  afterEach(() => vi.useRealTimers());

  it('renders nothing when closed', () => {
    render(<ResumePreviewModal open={false} url="https://example.com/r.pdf" onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('embeds a valid URL and offers to open it in a new tab', () => {
    render(<ResumePreviewModal open url="https://example.com/r.pdf" onClose={() => {}} />);

    expect(screen.getByRole('dialog', { name: 'Resume Preview' })).toBeInTheDocument();
    expect(screen.getByTitle('Resume preview')).toHaveAttribute('src', 'https://example.com/r.pdf');
    const open = screen.getByRole('link', { name: /Open Resume/ });
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('hides the loading overlay once the preview loads', () => {
    render(<ResumePreviewModal open url="https://example.com/r.pdf" onClose={() => {}} />);
    expect(screen.getByText('Loading preview…')).toBeInTheDocument();
    fireEvent.load(screen.getByTitle('Resume preview'));
    expect(screen.queryByText('Loading preview…')).not.toBeInTheDocument();
  });

  it('shows a helpful message when there is no URL', () => {
    render(<ResumePreviewModal open url="" onClose={() => {}} />);
    expect(screen.getByText('No resume URL added yet.')).toBeInTheDocument();
    expect(screen.queryByTitle('Resume preview')).not.toBeInTheDocument();
  });

  it('does not embed a malformed or unsafe URL', () => {
    render(<ResumePreviewModal open url="javascript:alert(1)" onClose={() => {}} />);
    expect(screen.getByText(PREVIEW_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByTitle('Resume preview')).not.toBeInTheDocument();
  });

  it('shows an error if the preview never loads', () => {
    vi.useFakeTimers();
    render(<ResumePreviewModal open url="https://example.com/broken.pdf" onClose={() => {}} />);
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByText(PREVIEW_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('closes via Escape, the Close button and the X button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ResumePreviewModal open url="https://example.com/r.pdf" onClose={onClose} />);

    await user.keyboard('{Escape}');
    const closeButtons = screen.getAllByRole('button', { name: 'Close' }); // header X + footer
    expect(closeButtons).toHaveLength(2);
    for (const button of closeButtons) await user.click(button);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('moves focus into the dialog when opened', () => {
    render(<ResumePreviewModal open url="" onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement);
  });
});
