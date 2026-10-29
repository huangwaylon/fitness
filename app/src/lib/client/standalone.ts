// Whether the app runs as the installed Home Screen PWA (iOS keeps its storage separate from Safari's).
export function isStandalone(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
