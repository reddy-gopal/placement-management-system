import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillsTagInput from './SkillsTagInput';

function Harness({ initial = [] }) {
  const [skills, setSkills] = useState(initial);
  return <SkillsTagInput value={skills} onChange={setSkills} />;
}

const tags = () => screen.queryAllByRole('listitem').map((li) => li.textContent);

describe('SkillsTagInput', () => {
  it('adds a trimmed skill on Enter and clears the input', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Skills');

    await user.type(input, '  React  {Enter}');
    expect(tags()).toEqual(['React']);
    expect(input).toHaveValue('');
  });

  it('ignores empty values', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Skills'), '   {Enter}');
    expect(tags()).toEqual([]);
  });

  it('prevents case-insensitive duplicates and explains why', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['Java']} />);
    await user.type(screen.getByLabelText('Skills'), 'java{Enter}');

    expect(tags()).toEqual(['Java']);
    expect(screen.getByRole('alert')).toHaveTextContent('"java" has already been added.');
  });

  it('removes a skill with its keyboard-accessible remove button', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['Java', 'React', 'MongoDB']} />);

    const removeReact = screen.getByRole('button', { name: 'Remove React' });
    removeReact.focus();
    await user.keyboard('{Enter}');
    expect(tags()).toEqual(['Java', 'MongoDB']);
  });

  it('removes the last skill with Backspace on an empty input', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['Java', 'React']} />);
    await user.type(screen.getByLabelText('Skills'), '{Backspace}');
    expect(tags()).toEqual(['Java']);
  });

  it('adds via the Add button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Skills'), 'Node.js');
    await user.click(screen.getByRole('button', { name: 'Add skill' }));
    expect(tags()).toEqual(['Node.js']);
  });
});
