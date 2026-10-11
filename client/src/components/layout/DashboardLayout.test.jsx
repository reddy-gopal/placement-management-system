import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { useDashboardIdentity } from './dashboardIdentity';

function Page({ identity = null }) {
  useDashboardIdentity(identity);
  return <p>Page body</p>;
}

function renderLayout(identity) {
  return render(
    <MemoryRouter initialEntries={['/student/profile']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/student/profile" element={<Page identity={identity} />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('DashboardLayout', () => {
  it('renders the page inside main with breadcrumb and nav', () => {
    renderLayout();
    expect(within(screen.getByRole('main')).getByText('Page body')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('My Profile')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Student' });
    expect(within(nav).getByRole('link', { name: 'My Profile' })).toHaveAttribute('aria-current', 'page');
    // Unbuilt sections are visible but not links.
    expect(within(nav).queryByRole('link', { name: /Placement Drives/ })).not.toBeInTheDocument();
    expect(within(nav).getByText('Placement Drives').closest('[aria-disabled="true"]')).toBeInTheDocument();
  });

  it('shows avatar initials from the page identity, falling back to ST', () => {
    const { unmount } = renderLayout();
    expect(screen.getByRole('img', { name: 'Student account' })).toHaveTextContent('ST');
    unmount();

    renderLayout({ rollNumber: '21CSE101', branch: 'CSE', graduationYear: 2027 });
    expect(screen.getByRole('img', { name: 'Signed in as 21CSE101' })).toHaveTextContent('CS');
  });

  it('opens the mobile drawer and closes it with Escape, returning focus', async () => {
    const user = userEvent.setup();
    renderLayout();
    const menuButton = screen.getByRole('button', { name: 'Open navigation' });

    await user.click(menuButton);
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    expect(within(drawer).getByRole('button', { name: 'Close navigation' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(menuButton).toHaveFocus();
  });
});
