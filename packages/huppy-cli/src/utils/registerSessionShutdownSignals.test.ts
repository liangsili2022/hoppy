import { describe, expect, it, vi } from 'vitest';

import { registerSessionShutdownSignals } from './registerSessionShutdownSignals';

function createProcessMock() {
  const handlers = new Map<string, () => void>();
  const processObject = {
    on: vi.fn((event: string, handler: () => void) => {
      handlers.set(event, handler);
      return processObject;
    }),
    off: vi.fn((event: string, handler: () => void) => {
      if (handlers.get(event) === handler) {
        handlers.delete(event);
      }
      return processObject;
    }),
  };

  return {
    handlers,
    processObject: processObject as unknown as Pick<NodeJS.Process, 'on' | 'off'>,
  };
}

describe('registerSessionShutdownSignals', () => {
  it('registers SIGTERM, SIGINT, and SIGHUP handlers', () => {
    const onShutdownSignal = vi.fn();
    const { processObject } = createProcessMock();

    registerSessionShutdownSignals({ processObject, onShutdownSignal });

    expect(processObject.on).toHaveBeenCalledTimes(3);
    expect(processObject.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processObject.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(processObject.on).toHaveBeenCalledWith('SIGHUP', expect.any(Function));
  });

  it('forwards only the first shutdown signal', () => {
    const onShutdownSignal = vi.fn();
    const { handlers, processObject } = createProcessMock();

    registerSessionShutdownSignals({ processObject, onShutdownSignal });

    handlers.get('SIGTERM')?.();
    handlers.get('SIGINT')?.();
    handlers.get('SIGHUP')?.();

    expect(onShutdownSignal).toHaveBeenCalledTimes(1);
    expect(onShutdownSignal).toHaveBeenCalledWith('SIGTERM');
  });

  it('returns a disposer that unregisters every signal handler', () => {
    const onShutdownSignal = vi.fn();
    const { handlers, processObject } = createProcessMock();

    const dispose = registerSessionShutdownSignals({ processObject, onShutdownSignal });
    const registeredHandlers = {
      SIGTERM: handlers.get('SIGTERM'),
      SIGINT: handlers.get('SIGINT'),
      SIGHUP: handlers.get('SIGHUP'),
    };

    dispose();

    expect(processObject.off).toHaveBeenCalledTimes(3);
    expect(processObject.off).toHaveBeenCalledWith('SIGTERM', registeredHandlers.SIGTERM);
    expect(processObject.off).toHaveBeenCalledWith('SIGINT', registeredHandlers.SIGINT);
    expect(processObject.off).toHaveBeenCalledWith('SIGHUP', registeredHandlers.SIGHUP);
  });
});
