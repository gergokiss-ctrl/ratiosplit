type HelpToggleProps = {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  strongLabel?: boolean;
};

export function HelpToggle({
  label,
  open,
  onToggle,
  children,
  strongLabel = false,
}: HelpToggleProps) {
  return (
    <>
      <div className="help-line">
        <span className="muted">{strongLabel ? <strong>{label}</strong> : label}</span>
        <button
          type="button"
          className="help-chip"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? `Hide ${label}` : `Show ${label}`}
        >
          ?
        </button>
      </div>
      {open && <div className="help-note">{children}</div>}
    </>
  );
}
