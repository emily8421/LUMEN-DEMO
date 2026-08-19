type StatusBarProps = {
  notice: string;
  error: string;
};

export function StatusBar({ notice, error }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span role="status" aria-live={error ? 'off' : 'polite'} aria-atomic="true">{notice}</span>
      {error ? <strong role="alert" aria-atomic="true">{error}</strong> : null}
    </footer>
  );
}
