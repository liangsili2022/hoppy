const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'] as const;

type ShutdownSignal = (typeof SHUTDOWN_SIGNALS)[number];

interface RegisterSessionShutdownSignalsOptions {
  onShutdownSignal: (signal: ShutdownSignal) => void | Promise<void>;
  processObject?: Pick<NodeJS.Process, 'on' | 'off'>;
}

export function registerSessionShutdownSignals({
  onShutdownSignal,
  processObject = process,
}: RegisterSessionShutdownSignalsOptions): () => void {
  let handled = false;
  const handlers = new Map<ShutdownSignal, () => void>();

  for (const signal of SHUTDOWN_SIGNALS) {
    const handler = () => {
      if (handled) {
        return;
      }
      handled = true;
      void onShutdownSignal(signal);
    };

    handlers.set(signal, handler);
    processObject.on(signal, handler);
  }

  return () => {
    for (const [signal, handler] of handlers) {
      processObject.off(signal, handler);
    }
  };
}
