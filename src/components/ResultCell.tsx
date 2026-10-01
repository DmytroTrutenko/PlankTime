import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

import { ACCENT_BG_HOVER, type Accent } from '../lib/accent';

export interface ResultCellProps {
  value: number | null;
  accent: Accent;
  onSave: (value: number | null) => void;
  formatValue: (value: number | null) => string;
  parseInput: (input: string) => number | null;
  inputPlaceholder: string;
  // `desktop` is the table-cell layout (no rounded wrapper, accent hover
  // background fills the cell); `compact` is the mobile card layout (rounded
  // pill with shadow). Both share the same always-render-input pattern so
  // the input never swaps types between display and edit states — the
  // focus event never re-fires for a swapped element, which is what
  // would otherwise prevent the iOS / Android virtual keyboard from
  // appearing on first tap.
  variant: 'desktop' | 'compact';
  ariaLabel: string;
  // When true, the cell is read-only (past dates the user is not allowed
  // to edit). Combined with `readOnly` on the <input> this also suppresses
  // the iOS / Android virtual keyboard on tap, so a tap on a past cell is
  // a no-op instead of accidentally opening the editor.
  disabled?: boolean;
}

// Single source of truth for cell typography + padding — applied to the SAME
// outer <div> for both display and edit states so swapping between them
// cannot change the visual size of the cell content. Using a <div> instead of
// <button> eliminates UA button defaults entirely (Tailwind preflight is off
// here, so border / background would otherwise leak through). Colour is set
// on the wrapper (not on the inner <input>), because with preflight off some
// browsers apply a UA <input> colour that wins the cascade over Tailwind
// utility classes and renders the digits white-on-white in light mode.
const CELL_BOX =
  'flex h-full w-full items-center justify-center border-0 bg-transparent px-3 py-2 ' +
  'font-mono text-sm tabular-nums leading-5 transition-colors duration-150 ' +
  'appearance-none select-none';

// Hard reset on the input — guarantees no UA default outline / border /
// shadow / padding / background leaks in and shifts the layout on focus.
// `font-size: 16px` is the minimum iOS Safari / Android Chrome accept
// without auto-zooming the viewport when the input is focused. We render
// the input always (never readOnly), so any smaller font would cause the
// page to zoom in on tap and stay zoomed after blur — `font-size` must
// be ≥ 16 px on the element that receives focus, not just on a wrapper.
// `line-height: 20px` matches Tailwind's `leading-5` so the row geometry
// is identical to a plain text-sm cell even though the digits render
// slightly larger. `color: 'inherit'` is defensive: with Tailwind's
// preflight disabled here, some browsers apply their own (sometimes
// white-on-white) UA colour to <input> that can override utility classes
// in the cascade.
const INPUT_RESET_STYLE: CSSProperties = {
  fontSize: '16px',
  lineHeight: '20px',
  padding: '0',
  margin: '0',
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  background: 'transparent',
  color: 'inherit',
  WebkitAppearance: 'none',
  appearance: 'none',
};

// Same reset, but with the caret hidden so the input visually looks like
// plain text instead of an input that can blink / receive focus rings.
const INPUT_READONLY_STYLE: CSSProperties = {
  ...INPUT_RESET_STYLE,
  caretColor: 'transparent',
};

export function ResultCell({
  value,
  accent,
  onSave,
  formatValue,
  parseInput,
  inputPlaceholder,
  variant,
  ariaLabel,
  disabled = false,
}: ResultCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current && !disabled) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing, disabled]);

  const startEdit = () => {
    if (editing || disabled) return;
    setDraft(value != null ? formatValue(value) : '');
    setEditing(true);
  };

  const commit = () => {
    onSave(parseInput(draft));
    setEditing(false);
  };

  const cancel = () => {
    setDraft('');
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  const isEmpty = value == null;
  const valueText = formatValue(value);

  const wrapperClass =
    variant === 'desktop'
      ? `${CELL_BOX} ${ACCENT_BG_HOVER[accent]} ${
          isEmpty
            ? 'font-normal text-stone-400 dark:text-stone-500'
            : 'font-semibold text-stone-800 dark:text-stone-100'
        }${disabled ? ' cursor-default opacity-70' : ''}`
      : `flex h-9 w-full items-center justify-center rounded-lg transition-colors appearance-none ${
          editing
            ? 'bg-stone-100 px-2 text-stone-800 dark:bg-stone-800 dark:text-stone-100'
            : isEmpty
              ? 'bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-500 dark:hover:bg-stone-700'
              : 'bg-white text-stone-800 ring-1 ring-stone-300/80 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-600/80 dark:hover:bg-stone-700'
        }${disabled ? ' cursor-default opacity-70' : ''}`;

  const inputClass =
    variant === 'desktop'
      ? 'block w-full min-w-0 touch-manipulation appearance-none border-0 bg-transparent text-center ' +
        'outline-none focus:outline-none focus:ring-0 ' +
        (disabled ? 'cursor-default pointer-events-none ' : 'cursor-pointer ') +
        (isEmpty ? 'font-normal' : 'font-semibold')
      : 'block w-full min-w-0 touch-manipulation appearance-none border-0 bg-transparent text-center ' +
        'outline-none focus:outline-none focus:ring-0 font-mono text-sm leading-5 font-semibold tabular-nums';

  return (
    <div className={wrapperClass}>
      <input
        ref={inputRef}
        type="text"
        value={editing ? draft : valueText}
        // `readOnly` on a disabled cell blocks the virtual keyboard on
        // iOS / Android. Without it, tapping a past cell would focus the
        // input and pop the keyboard, even though we then bail out of
        // `startEdit` and never render the editor. `pointer-events-none`
        // (above) plus `readOnly` together guarantee a no-op tap.
        readOnly={disabled}
        onFocus={(e) => {
          if (disabled) {
            e.currentTarget.blur();
            return;
          }
          startEdit();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={editing ? inputPlaceholder : '—'}
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        aria-label={ariaLabel}
        // No `readOnly` for editable cells — iOS Safari / Android Chrome
        // will NOT show the virtual keyboard for a readOnly input, even if
        // we toggle it off synchronously in `startEdit`: the focus event
        // has already fired by the time React re-renders with the new
        // state, and `.focus()` on an already-focused node does not
        // re-trigger the keyboard. Keeping the input always editable
        // makes tap → focus → keyboard happen in a single gesture on
        // mobile. Visual "not an input" look in display mode is preserved
        // via the wrapper's styles + `caret-color: transparent` on the
        // input itself.
        // `touch-action: manipulation` removes the 300 ms tap delay and
        // stops double-tap zoom on mobile so the cell never grows on tap.
        className={inputClass}
        style={editing ? INPUT_RESET_STYLE : INPUT_READONLY_STYLE}
      />
    </div>
  );
}
