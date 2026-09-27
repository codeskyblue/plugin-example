/// <reference path="./plugin-runtime.d.ts" />
import { render } from 'preact';
import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import {
  Info,
  Terminal,
  Keyboard,
  Type,
  MousePointerClick,
  Camera,
  Image as ImageIcon,
  ImageOff,
  Radio,
  Globe,
  Bot,
  Send,
  Square,
  Loader2,
} from 'lucide-preact';

const ScreenModes = {
  Control: 'control',
  Readonly: 'readonly',
  Recording: 'recording',
} as const;

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

function IconButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: preact.ComponentChildren;
  title?: string;
}) {
  return (
    <button
      title={title}
      class={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-transparent text-foreground border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      class="inline-flex cursor-pointer items-center gap-2"
    >
      <span
        class={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
        }`}
      >
        <span
          class={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
      {label && <span class="text-xs">{label}</span>}
    </button>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: preact.ComponentChildren;
  title: string;
  children: preact.ComponentChildren;
}) {
  return (
    <section class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h2 class="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      <div class="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Output({ value }: { value: string }) {
  if (!value) return null;
  return (
    <pre class="rounded-md bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300 whitespace-pre-wrap break-all">
      {value}
    </pre>
  );
}

function b64ToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function json(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function App() {
  const [info, setInfo] = useState(() => json({ deviceId: $u.deviceId, plugin: $u.plugin }));

  // shell
  const [shellCmd, setShellCmd] = useState('echo hello');
  const [shellOut, setShellOut] = useState('');

  // input text
  const [text, setText] = useState('hello');
  const [inputMsg, setInputMsg] = useState('');

  // tap
  const [tapX, setTapX] = useState('540');
  const [tapY, setTapY] = useState('1200');
  const [tapW, setTapW] = useState('1080');
  const [tapH, setTapH] = useState('2400');
  const [tapMsg, setTapMsg] = useState('');

  // screenshot
  const [shot, setShot] = useState<string | null>(null);
  const [frozen, setFrozen] = useState(false);

  // screen tap subscription
  const [screenTaps, setScreenTaps] = useState<ScreenTapEvent[]>([]);
  const [recording, setRecording] = useState(false);
  const [touchControl, setTouchControl] = useState(true);
  const [syncControl, setSyncControl] = useState(true);
  const syncControlRef = useRef(syncControl);
  useEffect(() => {
    syncControlRef.current = syncControl;
  }, [syncControl]);

  // fetch
  const [fetchUrl, setFetchUrl] = useState('https://httpbin.org/get');
  const [fetchOut, setFetchOut] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  // openai
  const [prompt, setPrompt] = useState('说一句你好');
  const [aiOut, setAiOut] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    return $u.onScreenTap((evt) => {
      setScreenTaps((prev) => [evt, ...prev].slice(0, 50));
      setTapX(String(Math.round(evt.x)));
      setTapY(String(Math.round(evt.y)));
      setTapW(String(evt.screenWidth));
      setTapH(String(evt.screenHeight));
      if (syncControlRef.current) {
        $u.tap(evt.x, evt.y, evt.screenWidth, evt.screenHeight);
      }
    });
  }, []);

  const clearTaps = useCallback(() => setScreenTaps([]), []);

  const runShell = useCallback(async () => {
    setShellOut('');
    try {
      const r = await $u.shell({ command: shellCmd, timeoutMs: 10000 });
      setShellOut(r.output);
    } catch (e) {
      setShellOut(String(e));
    }
  }, [shellCmd]);

  const doPressKey = useCallback(async (key: string) => {
    try {
      await $u.pressKey(key);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sendText = useCallback(async () => {
    setInputMsg('');
    try {
      await $u.inputText(text);
      setInputMsg(`已发送: ${text}`);
    } catch (e) {
      setInputMsg(String(e));
    }
  }, [text]);

  const doTap = useCallback(async () => {
    setTapMsg('');
    try {
      await $u.tap(Number(tapX), Number(tapY), Number(tapW), Number(tapH));
      setTapMsg(`已点击 (${tapX}, ${tapY})`);
    } catch (e) {
      setTapMsg(String(e));
    }
  }, [tapX, tapY, tapW, tapH]);

  const takeScreenshot = useCallback(async () => {
    const b64 = await $u.screenshotAsBase64();
    setShot(b64);
  }, []);

  const toggleFreeze = useCallback(async () => {
    if (frozen) {
      await $u.setScreenImage(null);
      setFrozen(false);
    } else {
      const b64 = await $u.screenshotAsBase64();
      await $u.setScreenImage(b64ToBlob(b64));
      setFrozen(true);
    }
  }, [frozen]);

  const toggleRecording = useCallback(async () => {
    await $u.setMode(recording ? ScreenModes.Control : ScreenModes.Recording);
  }, [recording]);

  const toggleTouch = useCallback(async (enabled: boolean) => {
    await $u.setMode(enabled ? ScreenModes.Control : ScreenModes.Readonly);
  }, []);

  useEffect(() => {
    const off = $u.onModeChange((mode) => {
      setRecording(mode === ScreenModes.Recording);
      setTouchControl(mode !== ScreenModes.Readonly);
    });
    return off;
  }, []);

  const doFetch = useCallback(async () => {
    setFetchOut('');
    setFetchLoading(true);
    try {
      const res = await $u.fetch(fetchUrl);
      const body = await res.text();
      setFetchOut(`status: ${res.status}\n${body}`);
    } catch (e) {
      setFetchOut(String(e));
    } finally {
      setFetchLoading(false);
    }
  }, [fetchUrl]);

  const doOpenAI = useCallback(async () => {
    setAiLoading(true);
    setAiOut('');
    try {
      const r = await $u.openai({
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });
      if (Symbol.asyncIterator in Object(r)) {
        let acc = '';
        for await (const chunk of r as AsyncIterable<OpenAIChatCompletionChunk>) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            acc += delta;
            setAiOut(acc);
          }
        }
      } else {
        const c = r as OpenAIChatCompletion;
        setAiOut(c.choices?.[0]?.message?.content ?? '');
      }
    } catch (e) {
      setAiOut(String(e));
    } finally {
      setAiLoading(false);
    }
  }, [prompt]);

  const [activeTab, setActiveTab] = useState('info');

  const numberInput = (value: string, setter: (v: string) => void, label: string) => (
    <label class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      {label}
      <input
        type="number"
        value={value}
        onInput={(e) => setter((e.target as HTMLInputElement).value)}
        class="w-20 rounded-md border border-gray-300 px-1.5 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
      />
    </label>
  );

  const tabs = [
    { id: 'info', label: '信息', icon: <Info size={14} /> },
    { id: 'shell', label: 'Shell', icon: <Terminal size={14} /> },
    { id: 'key', label: '按键', icon: <Keyboard size={14} /> },
    { id: 'text', label: '输入', icon: <Type size={14} /> },
    { id: 'tap', label: '点击', icon: <MousePointerClick size={14} /> },
    { id: 'screen', label: '画面', icon: <Camera size={14} /> },
    { id: 'interact', label: '交互', icon: <Radio size={14} /> },
    { id: 'fetch', label: 'Fetch', icon: <Globe size={14} /> },
    { id: 'openai', label: 'AI', icon: <Bot size={14} /> },
  ];

  return (
    <div class="flex max-w-2xl flex-col gap-4">
      <h1 class="text-base font-bold">接口示例</h1>

      <div class="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            class={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
              activeTab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <Section icon={<Info size={16} />} title="基本信息">
          <Output value={info} />
        </Section>
      )}

      {activeTab === 'shell' && (
        <Section icon={<Terminal size={16} />} title="shell 执行命令">
          <div class="flex gap-2">
            <input
              value={shellCmd}
              onInput={(e) => setShellCmd((e.target as HTMLInputElement).value)}
              class="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
            />
            <Button onClick={runShell}>执行</Button>
          </div>
          <Output value={shellOut} />
        </Section>
      )}

      {activeTab === 'key' && (
        <Section icon={<Keyboard size={16} />} title="pressKey 按键">
          <div class="flex flex-wrap gap-2">
            {['home', 'back', 'enter', 'tab', 'volume_up', 'volume_down'].map((k) => (
              <IconButton key={k} onClick={() => doPressKey(k)}>
                {k}
              </IconButton>
            ))}
          </div>
        </Section>
      )}

      {activeTab === 'text' && (
        <Section icon={<Type size={16} />} title="inputText 输入文本">
          <div class="flex gap-2">
            <input
              value={text}
              onInput={(e) => setText((e.target as HTMLInputElement).value)}
              class="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
            />
            <Button onClick={sendText}>
              <Send size={14} />
              发送
            </Button>
          </div>
          <Output value={inputMsg} />
        </Section>
      )}

      {activeTab === 'tap' && (
        <Section icon={<MousePointerClick size={16} />} title="tap 点击屏幕">
          <div class="flex flex-wrap items-center gap-2">
            {numberInput(tapX, setTapX, 'x')}
            {numberInput(tapY, setTapY, 'y')}
            {numberInput(tapW, setTapW, 'w')}
            {numberInput(tapH, setTapH, 'h')}
            <Button onClick={doTap}>点击</Button>
          </div>
          <Output value={tapMsg} />
        </Section>
      )}

      {activeTab === 'screen' && (
        <Section icon={<Camera size={16} />} title="屏幕画面">
          <div class="flex gap-2">
            <Button onClick={takeScreenshot}>
              <Camera size={14} />
              截图
            </Button>
          <Button onClick={toggleFreeze}>
            {frozen ? <ImageOff size={14} /> : <ImageIcon size={14} />}
            {frozen ? '恢复画面' : '冻结画面'}
          </Button>
          <Button onClick={() => setShot(null)}>重置</Button>
        </div>
          {shot && <img src={shot} class="w-full rounded-md border border-gray-200 dark:border-gray-700" />}
        </Section>
      )}

      {activeTab === 'interact' && (
        <Section icon={<Radio size={16} />} title="交互订阅">
          <div class="flex flex-wrap items-center gap-2">
            <IconButton active={recording} onClick={toggleRecording}>
              {recording ? <Square size={14} /> : <Radio size={14} />}
              {recording ? '关闭录制' : '开启录制'}
            </IconButton>
            <Switch checked={touchControl} onChange={toggleTouch} label="触摸控制" />
            <Switch checked={syncControl} onChange={setSyncControl} label="同步控制" />
            <IconButton onClick={clearTaps}>清空记录</IconButton>
          </div>
          {screenTaps.length > 0 && (
            <pre class="rounded-md bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {screenTaps.map((t) => `(${Math.round(t.x)}, ${Math.round(t.y)}) @ ${t.screenWidth}x${t.screenHeight}`).join('\n')}
            </pre>
          )}
        </Section>
      )}

      {activeTab === 'fetch' && (
        <Section icon={<Globe size={16} />} title="fetch 代理请求">
          <div class="flex gap-2">
            <input
              value={fetchUrl}
              onInput={(e) => setFetchUrl((e.target as HTMLInputElement).value)}
              class="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
            />
            <Button onClick={doFetch} disabled={fetchLoading}>
              {fetchLoading ? <Loader2 size={14} class="animate-spin" /> : <Globe size={14} />}
              请求
            </Button>
          </div>
          <Output value={fetchOut} />
        </Section>
      )}

      {activeTab === 'openai' && (
        <Section icon={<Bot size={16} />} title="openai 调用模型">
          <div class="flex gap-2">
            <input
              value={prompt}
              onInput={(e) => setPrompt((e.target as HTMLInputElement).value)}
              class="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
            />
            <Button onClick={doOpenAI} disabled={aiLoading}>
              {aiLoading ? '生成中...' : '生成'}
            </Button>
          </div>
          <Output value={aiOut} />
        </Section>
      )}
    </div>
  );
}

render(<App />, document.getElementById('app')!);
