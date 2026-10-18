export function SkipButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" className="btn quiet skip" data-testid="skip" onClick={onClick}>
      <span className="hop" aria-hidden="true">
        <svg viewBox="0 0 36 22">
          <ellipse cx="7" cy="17" rx="6" ry="3.2" fill="#7dbe6a" />
          <ellipse cx="29" cy="17" rx="6" ry="3.2" fill="#6aae8a" />
          <path d="M8 15 C 12 3, 24 3, 28 15" fill="none" stroke="#3d6b4f" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="18" cy="5.2" r="3" fill="#3d6b4f" />
        </svg>
      </span>
      Skip
    </button>
  );
}
