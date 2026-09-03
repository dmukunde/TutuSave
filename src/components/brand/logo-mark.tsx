// TutuSave's brand mark: three ascending bars on a rounded square,
// reading as growth/progress toward a goal. Deliberately abstract
// rather than a literal dollar sign, bank, or piggy bank. The same
// shape (see scripts/generate-pwa-icons.mjs) is used for the home
// screen app icon, so this is the one glyph to keep in sync with it.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="7" className="fill-primary" />
      <rect x="4" y="13" width="4" height="7" rx="1.5" fill="white" />
      <rect x="10" y="9" width="4" height="11" rx="1.5" fill="white" />
      <rect x="16" y="5" width="4" height="15" rx="1.5" fill="white" />
    </svg>
  );
}
