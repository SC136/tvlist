/**
 * The tvlist mark: a rounded TV screen with a stand, holding two list rows.
 * Shared by the on-page logo (CSS-variable colours) and the generated
 * favicon/app icons (fixed colours), so they always match.
 *
 * `accent` fills the screen; `ink` draws the list rows and should contrast with it.
 */
export function LogoGlyph({
  accent,
  ink,
  size,
  className,
}: {
  accent: string;
  ink: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect x="2" y="5" width="28" height="20" rx="5" fill={accent} />
      <rect x="11" y="26" width="10" height="2.5" rx="1.25" fill={accent} />
      <rect x="8" y="10" width="3" height="3" rx="1" fill={ink} />
      <rect x="13" y="10" width="11" height="3" rx="1.5" fill={ink} />
      <rect x="8" y="16" width="3" height="3" rx="1" fill={ink} opacity="0.7" />
      <rect x="13" y="16" width="8" height="3" rx="1.5" fill={ink} opacity="0.7" />
    </svg>
  );
}
