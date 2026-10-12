import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Status changes a recruiter may make from each drive status (the API allows OPEN ↔ CLOSED). */
export const DRIVE_STATUS_OPTIONS = {
  OPEN: [{ status: 'CLOSED', label: 'Close · CLOSED' }],
  CLOSED: [{ status: 'OPEN', label: 'Reopen · OPEN' }],
  DRAFT: [{ status: 'OPEN', label: 'Publish · OPEN' }],
  CANCELLED: [],
};

const MENU_WIDTH = 230;

/**
 * "⋯" row menu for changing a drive's status. The menu is portalled and fixed-positioned so the
 * scrolling table container can't clip it. Escape, outside clicks, scrolling and resizing close it.
 */
export default function DriveStatusMenu({ drive, onChangeStatus, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const options = DRIVE_STATUS_OPTIONS[drive.status] ?? [];

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setPosition(spaceBelow < 200 ? { left, bottom: window.innerHeight - rect.top + 6 } : { left, top: rect.bottom + 6 });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') ?? [])];
        if (!items.length) return;
        event.preventDefault();
        const index = items.indexOf(document.activeElement);
        const step = event.key === 'ArrowDown' ? 1 : -1;
        items[(index + step + items.length) % items.length].focus();
      }
      if (event.key === 'Tab') close(false);
    };
    const handlePointer = (event) => {
      if (menuRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
      close(false);
    };
    const handleViewportChange = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      close(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointer);
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [open, close]);

  const choose = (status) => {
    close(true);
    onChangeStatus(drive, status);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label={`More actions for ${drive.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={`icon-btn icon-btn-sm text-base leading-none ${open ? 'border-ink' : ''}`}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={`Change status of ${drive.title}`}
            style={{ position: 'fixed', width: MENU_WIDTH, ...position }}
            className="animate-fade-in z-50 flex flex-col rounded-lg border border-line bg-white p-1.5 text-left shadow-[0_16px_32px_-12px_rgb(17_17_17/0.2)]"
          >
            <span className="eyebrow px-2.5 pb-1 pt-2">Change status</span>
            {options.map((option) => (
              <button key={option.status} type="button" role="menuitem" onClick={() => choose(option.status)} className="menu-item">
                {option.label}
              </button>
            ))}
            {!options.length && <span className="px-2.5 py-2 text-[13px] text-muted">A cancelled drive can’t be changed.</span>}
            <div className="my-1.5 h-px bg-line" />
            <span className="px-2.5 pb-2 pt-1.5 text-xs leading-[1.45] text-muted">
              Only the placement cell can cancel or delete a drive.
            </span>
          </div>,
          document.body
        )}
    </>
  );
}
