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

export type ConnectionInput = { name: string; destination: string; localAddress?: string };

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
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));
  await expect(page.getByText(input.name, { exact: true })).toBeVisible();
  const hash = await routeOf(page);
  return hash.replace("#/view_connection/", "");
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
