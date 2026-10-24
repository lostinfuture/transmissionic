// history.go(1) fires popstate again. A second go(1) from that event freezes iOS Safari (#1396).
export function createHistoryGuard(restore: () => void, delayMs = 400): {
  run(work: () => Promise<boolean>): Promise<boolean>;
} {
  let locked = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function unlockLater(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      locked = false;
      timer = null;
    }, delayMs);
  }

  return {
    async run(work: () => Promise<boolean>): Promise<boolean> {
      if (locked) {
        unlockLater();
        return false;
      }
      locked = true;
      let shouldRestore = false;
      try {
        shouldRestore = await work();
        if (shouldRestore) restore();
        return true;
      } finally {
        if (shouldRestore) {
          unlockLater();
        } else {
          locked = false;
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      }
    }
  };
}
