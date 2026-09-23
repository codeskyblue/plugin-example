/// <reference path="./plugin-runtime.d.ts" />
import { render } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { Home } from 'lucide-preact';

async function shell(cmd: string): Promise<string> {
  const result = await $u.shell(cmd);
  return result.output.trim();
}

function Button({
  children,
  onClick,
  disabled,
}: {
  children: preact.ComponentChildren;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      class="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function App() {
  const [loading, setLoading] = useState(false);

  const goHome = useCallback(async () => {
    setLoading(true);
    try {
      await shell('input keyevent HOME');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Button onClick={goHome} disabled={loading}>
      <Home size={14} />
      {loading ? 'Going...' : 'Home'}
    </Button>
  );
}

render(<App />, document.getElementById('app')!);
