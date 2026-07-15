type StatusBarProps = {
  notice: string;
  error: string;
};

export function StatusBar({ notice, error }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>{notice}</span>
      {error ? <strong>{error}</strong> : null}
    </footer>
  );
}
