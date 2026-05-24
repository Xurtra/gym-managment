import { expect, test as base, type Locator, type Page } from "@playwright/test";

const observableMode = process.env.PLAYWRIGHT_OBSERVABLE === "1" || process.env.PW_OBSERVABLE === "1";
const actionDelayMs = positiveIntegerFromEnv("PLAYWRIGHT_OBSERVABLE_DELAY_MS", 400);
const cursorEnabled = process.env.PLAYWRIGHT_OBSERVABLE_CURSOR !== "0";

type ObservablePage = Page & {
  __observablePatched?: boolean;
};

export const test = base.extend({
  page: async ({ page }, use) => {
    if (observableMode) {
      await enableDeveloperObservability(page);
    }
    await use(page);
  }
});

export { expect };

async function enableDeveloperObservability(page: Page) {
  const observablePage = page as ObservablePage;
  if (observablePage.__observablePatched) {
    return;
  }
  observablePage.__observablePatched = true;

  if (cursorEnabled) {
    await page.addInitScript(cursorScript);
    await ensureCursor(page);
  }

  wrapPageMethod(page, "goto", async (original, args) => {
    await pause(actionDelayMs);
    const result = await original(...args);
    await pause(actionDelayMs);
    return result;
  });

  for (const method of ["click", "fill", "hover", "check", "uncheck", "selectOption", "press"] as const) {
    wrapPageMethod(page, method, async (original, args) => {
      const [selector] = args;
      if (typeof selector === "string") {
        await spotlightSelector(page, selector, method);
      } else {
        await pause(actionDelayMs);
      }
      const result = await original(...args);
      await pause(actionDelayMs);
      return result;
    });
  }

  const originalLocator = page.locator.bind(page);
  (page as Page & { locator: Page["locator"] }).locator = ((...args: Parameters<Page["locator"]>) =>
    instrumentLocator(originalLocator(...args), page)) as Page["locator"];
}

function instrumentLocator(locator: Locator, page: Page): Locator {
  return new Proxy(locator, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") {
        return value;
      }

      return (...args: unknown[]) => {
        const method = String(property);
        if (isObservableAction(method)) {
          return runObservableLocatorAction(target, page, method, value.bind(target), args);
        }

        const result = value.apply(target, args);
        return isLocatorLike(result) ? instrumentLocator(result, page) : result;
      };
    }
  }) as Locator;
}

async function runObservableLocatorAction(
  locator: Locator,
  page: Page,
  method: string,
  action: (...args: unknown[]) => Promise<unknown>,
  args: unknown[]
) {
  await spotlightLocator(page, locator, method);
  const result = await action(...args);
  await pause(actionDelayMs);
  return result;
}

function wrapPageMethod<K extends keyof Page>(
  page: Page,
  method: K,
  wrapper: (original: (...args: unknown[]) => Promise<unknown>, args: unknown[]) => Promise<unknown>
) {
  const original = page[method];
  if (typeof original !== "function") {
    return;
  }
  (page as Page & Record<string, unknown>)[method as string] = ((...args: unknown[]) =>
    wrapper(original.bind(page) as (...args: unknown[]) => Promise<unknown>, args)) as Page[K];
}

async function spotlightSelector(page: Page, selector: string, label: string) {
  await pause(actionDelayMs);
  try {
    const locator = page.locator(selector).first();
    await spotlightLocator(page, locator, label);
  } catch {
    // Ignore observability-only failures.
  }
}

async function spotlightLocator(page: Page, locator: Locator, label: string) {
  await pause(actionDelayMs);
  if (!cursorEnabled) {
    return;
  }
  try {
    await locator.first().scrollIntoViewIfNeeded();
    const box = await locator.first().boundingBox();
    if (!box) {
      return;
    }
    await ensureCursor(page);
    await page.evaluate(
      ({ x, y, labelText }) => {
        const observable = (window as Window & { __pwObservableCursor?: { move: (x: number, y: number, label: string) => void } })
          .__pwObservableCursor;
        observable?.move(x, y, labelText);
      },
      {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        labelText: label
      }
    );
  } catch {
    // Ignore observability-only failures.
  }
}

async function ensureCursor(page: Page) {
  try {
    await page.evaluate(() => {
      const observable = (window as Window & { __pwObservableCursor?: { ensure: () => void } }).__pwObservableCursor;
      observable?.ensure();
    });
  } catch {
    // Page may not be ready yet.
  }
}

function isLocatorLike(value: unknown): value is Locator {
  return Boolean(
    value &&
      typeof value === "object" &&
      "click" in value &&
      typeof (value as Locator).click === "function" &&
      "locator" in value &&
      typeof (value as Locator).locator === "function"
  );
}

function isObservableAction(method: string) {
  return ["click", "fill", "hover", "check", "uncheck", "selectOption", "press"].includes(method);
}

function pause(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function positiveIntegerFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const cursorScript = `(() => {
  const cursorId = '__pw-observable-cursor';
  const labelId = '__pw-observable-cursor-label';

  function ensure() {
    if (!document.body) {
      return;
    }
    let cursor = document.getElementById(cursorId);
    let label = document.getElementById(labelId);
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = cursorId;
      cursor.setAttribute('aria-hidden', 'true');
      Object.assign(cursor.style, {
        position: 'fixed',
        left: '0px',
        top: '0px',
        width: '18px',
        height: '18px',
        borderRadius: '999px',
        border: '2px solid #111827',
        background: 'rgba(251, 191, 36, 0.85)',
        boxShadow: '0 0 0 6px rgba(251, 191, 36, 0.20)',
        transform: 'translate(-9999px, -9999px)',
        transition: 'transform 180ms ease-out',
        zIndex: '2147483647',
        pointerEvents: 'none'
      });
      document.body.appendChild(cursor);
    }
    if (!label) {
      label = document.createElement('div');
      label.id = labelId;
      label.setAttribute('aria-hidden', 'true');
      Object.assign(label.style, {
        position: 'fixed',
        left: '0px',
        top: '0px',
        padding: '4px 8px',
        borderRadius: '999px',
        background: 'rgba(17, 24, 39, 0.92)',
        color: '#f9fafb',
        font: '12px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace',
        letterSpacing: '0.02em',
        transform: 'translate(-9999px, -9999px)',
        transition: 'transform 180ms ease-out',
        zIndex: '2147483647',
        pointerEvents: 'none'
      });
      document.body.appendChild(label);
    }
  }

  function move(x, y, labelText) {
    ensure();
    const cursor = document.getElementById(cursorId);
    const label = document.getElementById(labelId);
    if (!cursor || !label) {
      return;
    }
    cursor.style.transform = 'translate(' + (x - 9) + 'px, ' + (y - 9) + 'px)';
    label.textContent = labelText || '';
    label.style.transform = 'translate(' + (x + 14) + 'px, ' + (y - 8) + 'px)';
  }

  window.__pwObservableCursor = { ensure, move };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensure, { once: true });
  } else {
    ensure();
  }
})();`;