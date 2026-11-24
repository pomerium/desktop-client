import net from "node:net";

import { expect, type ElectronApplication, type Page } from "@playwright/test";

export const findFreePort = async (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("failed to allocate a free port"));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });

export type EchoServer = { port: number; close: () => Promise<void> };

/** A local TCP echo server, standing in for the remote end of a tunnel. */
export const startEchoServer = async (): Promise<EchoServer> => {
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    socket.on("data", (chunk) => socket.write(chunk));
  });
  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to start echo server");
  }
  return {
    port: address.port,
    close: () =>
      new Promise((resolve) => {
        sockets.forEach((s) => s.destroy());
        server.close(() => resolve());
      }),
  };
};

/** Connects to a local listener and checks that it accepts a client. */
export const expectListenerAcceptsConnection = async (port: number, payload: string) => {
  await new Promise<void>((resolve, reject) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    let connected = false;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(
      () => finish(new Error(`timed out waiting for listener on ${port}`)),
      8000,
    );
    socket.on("connect", () => {
      connected = true;
      socket.write(payload);
      // Without a Pomerium server the tunnel can't complete, so an accepted
      // connection is the signal; data back is a bonus.
      setTimeout(() => finish(), 250);
    });
    socket.on("data", () => finish());
    socket.on("error", (error: NodeJS.ErrnoException) => {
      if (connected && error.code === "ECONNRESET") finish();
      else finish(error);
    });
    socket.on("close", () => {
      if (connected) finish();
      else finish(new Error(`listener ${port} closed before accepting a client`));
    });
  });
};

export const expectPortClosed = async (port: number) => {
  await expect
    .poll(
      () =>
        new Promise<boolean>((resolve) => {
          const socket = net.connect({ host: "127.0.0.1", port });
          socket.setTimeout(1500, () => {
            socket.destroy();
            resolve(false);
          });
          socket.on("connect", () => {
            socket.destroy();
            resolve(false);
          });
          socket.on("error", () => resolve(true));
        }),
      { message: `listener on ${port} should close`, timeout: 15_000 },
    )
    .toBe(true);
};

export const routeOf = (page: Page) => page.evaluate(() => window.location.hash);

export const gotoRoute = async (page: Page, hash: string) => {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await expect.poll(() => routeOf(page)).toBe(hash);
};

// Exports go through a blob URL and an <a download> click. Capture them in the
// renderer instead of letting Electron open a save dialog.
export type CapturedDownload = { filename: string; text: string };

export const installDownloadCapture = async (page: Page) => {
  await page.evaluate(() => {
    const scope = window as typeof window & {
      e2eDownloads?: CapturedDownload[];
      e2eBlobs?: Map<string, Blob>;
    };
    if (scope.e2eDownloads) return;
    scope.e2eDownloads = [];
    scope.e2eBlobs = new Map();
    const createObjectURL = URL.createObjectURL.bind(URL);
    const click = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (blob: Blob) => {
      const url = createObjectURL(blob);
      scope.e2eBlobs?.set(url, blob);
      return url;
    };
    HTMLAnchorElement.prototype.click = function clickAnchor(this: HTMLAnchorElement) {
      const blob = scope.e2eBlobs?.get(this.href);
      if (this.download && blob) {
        const filename = this.download;
        void blob.text().then((text) => scope.e2eDownloads?.push({ filename, text }));
        return;
      }
      click.call(this);
    };
  });
};

export const lastDownload = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { e2eDownloads?: unknown[] }).e2eDownloads?.length ?? 0,
      ),
    )
    .toBeGreaterThan(0);
  return page.evaluate(() =>
    (window as typeof window & { e2eDownloads?: CapturedDownload[] }).e2eDownloads!.at(-1)!,
  );
};

/** How many downloads the renderer has captured so far. */
export const downloadCount = (page: Page) =>
  page.evaluate(
    () => (window as typeof window & { e2eDownloads?: unknown[] }).e2eDownloads?.length ?? 0,
  );

/** Runs `action` and returns the download it causes. */
export const captureDownload = async (page: Page, action: () => Promise<void>) => {
  const before = await downloadCount(page);
  await action();
  await expect.poll(() => downloadCount(page)).toBeGreaterThan(before);
  return lastDownload(page);
};

export type ConnectionInput = {
  name: string;
  destination: string;
  localAddress?: string;
  tags?: string[];
};

/** Creates a connection through the UI and returns its id. */
export const createConnection = async (page: Page, input: ConnectionInput): Promise<string> => {
  await gotoRoute(page, "#/manage");
  await page.getByRole("button", { name: "New Connection" }).click();
  // The menu item label has a long-standing typo.
  await page.getByRole("menuitem", { name: /Add Connect(i)?on/ }).click();
  await expect(page.getByText("Add Connection", { exact: true })).toBeVisible();
  await page.getByLabel("Name").fill(input.name);
  await page.getByLabel("Destination").fill(input.destination);
  if (input.localAddress) {
    await page.getByLabel("Local Address").fill(input.localAddress);
  }
  for (const tag of input.tags ?? []) {
    await addTag(page, tag);
  }
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));
  await expect(page.getByText(input.name, { exact: true })).toBeVisible();
  const hash = await routeOf(page);
  return hash.replace("#/view_connection/", "");
};

/**
 * An item in the open menu. Every row and folder keeps its menu mounted, so
 * match only the visible one.
 */
export const menuItem = (page: Page, name: string) =>
  page.getByRole("menuitem", { name, exact: true }).filter({ visible: true });

/** Adds a tag in the tag selector by typing it and pressing Enter. */
export const addTag = async (page: Page, tag: string) => {
  const input = page.getByRole("combobox", { name: "Tags..." });
  await input.fill(tag);
  await input.press("Enter");
  await expect(page.getByRole("button", { name: tag, exact: true })).toBeVisible();
};

/** Opens the edit form for a connection. */
export const gotoEditForm = async (page: Page, id: string) => {
  await gotoRoute(page, `#/edit_connect/${id}`);
  await expect(page.getByText("Edit Connection", { exact: true })).toBeVisible();
  // The form fills in once the record arrives from the CLI.
  await expect(page.getByLabel("Name")).not.toHaveValue("");
};

export const expandAdvancedSettings = async (page: Page) => {
  await page.getByText("Advanced Settings", { exact: true }).click();
  await expect(page.getByText("Disable TLS Verification", { exact: true })).toBeVisible();
};

/** Sets the renderer viewport width, keeping the window's height. */
export const setViewportWidth = async (page: Page, width: number) => {
  await page.setViewportSize({ width, height: 728 });
  await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(width);
};

export const setColorScheme = async (
  electronApp: ElectronApplication,
  page: Page,
  scheme: "light" | "dark",
) => {
  await electronApp.evaluate(({ nativeTheme }, s) => {
    nativeTheme.themeSource = s;
  }, scheme);
  await page.emulateMedia({ colorScheme: scheme });
};

export type LayoutReport = {
  /** Viewport width minus any vertical scrollbar. */
  clientWidth: number;
  scrollWidth: number;
  offscreen: string[];
};

/**
 * Measures the page the same way the 0.34.2 QA run did: horizontal overflow,
 * plus every visible element whose box sticks out past the left or right edge
 * of the viewport. Elements clipped by a scrolling or overflow-hidden ancestor
 * are measured by their visible part only.
 */
export const measureLayout = (page: Page): Promise<LayoutReport> =>
  page.evaluate(() => {
    // Exclude a vertical scrollbar, which tall pages get on Windows and Linux.
    const clientWidth = document.documentElement.clientWidth;
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : "";
      const cls =
        typeof el.className === "string" && el.className
          ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
          : "";
      const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()}${id}${cls} "${text}"`;
    };
    const visibleBox = (el: Element) => {
      const r = el.getBoundingClientRect();
      let left = r.left;
      let right = r.right;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox !== "visible") {
          const pr = p.getBoundingClientRect();
          left = Math.max(left, pr.left);
          right = Math.min(right, pr.right);
        }
      }
      return { left, right, width: right - left, height: r.height };
    };
    const offscreen: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const box = visibleBox(el);
      if (box.width <= 0 || box.height <= 0) continue;
      if (box.right > clientWidth + 1 || box.left < -1) {
        offscreen.push(
          `${describe(el)} [${Math.round(box.left)}..${Math.round(box.right)}] of ${clientWidth}`,
        );
      }
    }
    return {
      clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offscreen,
    };
  });
