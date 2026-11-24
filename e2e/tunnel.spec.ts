import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { realpathSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import type { Page } from "@playwright/test";

import { CA_NAME, CLIENT_NAME, P12_PASSWORD, certPaths } from "./certs";
import { test, expect, runFixme } from "./fixtures";
import {
  expandAdvancedSettings,
  expectEcho,
  expectNoEcho,
  findFreePort,
  gotoRoute,
  startEchoServer,
  startFakePomerium,
  type EchoServer,
  type FakePomerium,
} from "./helpers";

// Traffic through a real tunnel: pomerium-cli connects to a fake Pomerium
// proxy (helpers.ts), which pipes CONNECT requests to a local echo server.
// This checks what the TLS settings actually do, not just that they're saved.

const hasCertStore = process.platform === "darwin" || process.platform === "win32";

type ProxiedConnection = {
  name: string;
  proxy: FakePomerium;
  echo: EchoServer;
  localPort: number;
  disableTlsVerification?: boolean;
  clientCertFromFiles?: boolean;
  /** Search the OS certificate store, with this issuer filter. */
  certStoreIssuerCN?: string;
};

/** Adds a connection that goes through `proxy` to `echo`, and connects it. */
const connectThroughProxy = async (page: Page, c: ProxiedConnection) => {
  await gotoRoute(page, "#/connectForm");
  await page.getByLabel("Name").fill(c.name);
  await page.getByLabel("Destination").fill(`127.0.0.1:${c.echo.port}`);
  await page.getByLabel("Local Address").fill(`127.0.0.1:${c.localPort}`);
  await expandAdvancedSettings(page);
  await page.getByLabel("Pomerium URL").fill(c.proxy.url);
  if (c.disableTlsVerification) {
    await page.getByRole("switch", { name: "Disable TLS Verification" }).check();
  }
  if (c.clientCertFromFiles) {
    if (hasCertStore) {
      await page.getByText("Set client certificate manually", { exact: true }).click();
    }
    await page.locator("#cert-file").setInputFiles(certPaths().clientCert);
    await page.locator("#key-file").setInputFiles(certPaths().clientKey);
    await expect(page.getByPlaceholder("e.g. copy/paste the key in PEM format")).toHaveValue(
      /BEGIN PRIVATE KEY/,
    );
  }
  if (c.certStoreIssuerCN) {
    await page.getByRole("switch", { name: "Search OS certificate store" }).check();
    await page.getByText("Additional OS certificate store filters").click();
    await page.getByRole("combobox", { name: "Attribute" }).first().click();
    await page.getByRole("option", { name: /^CN \(/ }).click();
    await page.getByLabel("Value").fill(c.certStoreIssuerCN);
  }
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(() => /^#\/view_connection\/.+/.test(window.location.hash));
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
  await page.locator("#log-header").click();
};

const logs = (page: Page) => page.locator(".MuiAccordionDetails-root").getByText(/Pomerium/);

let echo: EchoServer;
let localPort: number;

test.beforeEach(async () => {
  echo = await startEchoServer();
  localPort = await findFreePort();
});

test.afterEach(async () => {
  await echo?.close();
});

test.describe("TLS verification", () => {
  let proxy: FakePomerium;
  test.beforeEach(async () => {
    proxy = await startFakePomerium();
  });
  test.afterEach(async () => {
    await proxy?.close();
  });

  test("with Disable TLS Verification on, traffic goes through a proxy with an untrusted certificate", async ({
    page,
  }) => {
    await connectThroughProxy(page, {
      name: "E2E TLS Skip",
      proxy,
      echo,
      localPort,
      disableTlsVerification: true,
    });
    await expectEcho(localPort, "hello through the tunnel");
    expect(proxy.tunnels.map((t) => t.target)).toContain(`127.0.0.1:${echo.port}`);
    await expect(logs(page).filter({ hasText: "Connected to Pomerium" }).first()).toBeVisible();
  });

  test("with Disable TLS Verification off, the untrusted proxy certificate stops the tunnel", async ({
    page,
  }) => {
    await connectThroughProxy(page, { name: "E2E TLS Verify", proxy, echo, localPort });
    await expectNoEcho(localPort, "should not arrive");
    expect(proxy.tunnels).toEqual([]);
    expect(proxy.tlsErrors.length).toBeGreaterThan(0);
    await expect(logs(page).filter({ hasText: "Connected to Pomerium" })).toHaveCount(0);
  });

  test("a failed TLS handshake is reported in the Logs panel", async ({ page }) => {
    // The CLI returns the dial error without a "disconnected" status update,
    // so the Logs panel shows "Connecting to Pomerium..." and nothing else
    // (#640).
    test.fixme(!runFixme, "https://github.com/pomerium/desktop-client/issues/640");
    await connectThroughProxy(page, { name: "E2E TLS Error", proxy, echo, localPort });
    await expectNoEcho(localPort, "should not arrive");
    await expect(
      logs(page)
        .filter({ hasText: /certificate|x509|tls/i })
        .first(),
    ).toBeVisible();
  });
});

test.describe("client certificate", () => {
  let proxy: FakePomerium;
  test.beforeEach(async () => {
    proxy = await startFakePomerium({ requireClientCert: true });
  });
  test.afterEach(async () => {
    await proxy?.close();
  });

  test("a client certificate from files is presented to the proxy", async ({ page }) => {
    await connectThroughProxy(page, {
      name: "E2E mTLS",
      proxy,
      echo,
      localPort,
      disableTlsVerification: true,
      clientCertFromFiles: true,
    });
    await expectEcho(localPort, "hello with a client cert");
    expect(proxy.tunnels.at(-1)?.clientSubject).toMatchObject(CLIENT_NAME);
  });

  test("without a client certificate the proxy rejects the handshake", async ({ page }) => {
    await connectThroughProxy(page, {
      name: "E2E mTLS Missing",
      proxy,
      echo,
      localPort,
      disableTlsVerification: true,
    });
    await expectNoEcho(localPort, "should not arrive");
    expect(proxy.tunnels).toEqual([]);
    expect(proxy.tlsErrors.join("\n")).toMatch(/certificate/i);
  });
});

// The keychain partition for the pomerium-cli the app runs: its team ID when
// it's a signed release, or its code hash for a local (ad-hoc signed) build.
const cliPartition = () => {
  const cli = realpathSync(path.join(__dirname, "..", "assets", "bin", "pomerium-cli"));
  const info = spawnSync("codesign", ["-dvvv", cli], { encoding: "utf8" }).stderr;
  const team = /^TeamIdentifier=(\w+)$/m.exec(info)?.[1];
  if (team && team !== "not") return `teamid:${team}`;
  const cdhash = /^CDHash=(\w+)$/m.exec(info)?.[1];
  if (!cdhash) throw new Error(`can't read the code signature of ${cli}:\n${info}`);
  return `cdhash:${cdhash}`;
};

// Installs the test client identity in the OS certificate store for one test.
// macOS: a new keychain inside the test's throwaway HOME, on that HOME's own
// keychain search list (the app and CLI run with that HOME), so the real
// user's keychains and search list are never touched. Windows: the
// CurrentUser\My store, removed again by thumbprint.
const installClientIdentity = async (tempHome: string): Promise<() => void> => {
  const p12 = certPaths().clientP12;
  const p12Password = P12_PASSWORD;
  if (process.platform === "darwin") {
    const env = { ...process.env, HOME: tempHome };
    const security = (...args: string[]) =>
      execFileSync("security", args, { env, stdio: ["ignore", "pipe", "pipe"] }).toString();
    const realSearchList = execFileSync("security", ["list-keychains", "-d", "user"]).toString();
    await fs.mkdir(path.join(tempHome, "Library", "Preferences"), { recursive: true });
    await fs.mkdir(path.join(tempHome, "Library", "Keychains"), { recursive: true });
    const keychain = path.join(tempHome, "Library", "Keychains", "e2e.keychain-db");
    const password = crypto.randomBytes(12).toString("hex");
    security("create-keychain", "-p", password, keychain);
    try {
      security("set-keychain-settings", keychain); // no auto-lock
      security("unlock-keychain", "-p", password, keychain);
      security("import", p12, "-k", keychain, "-P", p12Password, "-A");
      // Let pomerium-cli use the key without a "wants to access key" prompt,
      // which Playwright can't answer. -A alone isn't enough: the key's
      // partition list must also name the binary's code signing identity.
      security(
        "set-key-partition-list",
        "-S",
        ["apple-tool:", "apple:", "unsigned:", cliPartition()].join(","),
        "-s",
        "-k",
        password,
        keychain,
      );
      security("list-keychains", "-d", "user", "-s", keychain);
      expect(security("list-keychains", "-d", "user")).toContain("e2e.keychain-db");
    } catch (error) {
      security("delete-keychain", keychain);
      throw error;
    }
    return () => {
      try {
        security("delete-keychain", keychain);
      } finally {
        // The real search list must be exactly as it was.
        expect(execFileSync("security", ["list-keychains", "-d", "user"]).toString()).toBe(
          realSearchList,
        );
      }
    };
  }
  if (process.platform === "win32") {
    const pem = await fs.readFile(certPaths().clientCert, "utf8");
    const thumbprint = new crypto.X509Certificate(pem).fingerprint.replace(/:/g, "");
    execFileSync("certutil", ["-f", "-user", "-p", p12Password, "-importpfx", "My", p12], {
      stdio: "ignore",
    });
    return () => {
      execFileSync("certutil", ["-user", "-delstore", "My", thumbprint], { stdio: "ignore" });
    };
  }
  throw new Error(`no OS certificate store on ${process.platform}`);
};

test.describe("OS certificate store", () => {
  // These change the OS certificate store (on macOS only inside the test's
  // throwaway HOME), so they run on CI or when asked for.
  test.skip(!hasCertStore, "pomerium-cli only searches an OS store on macOS and Windows");
  test.skip(
    !process.env.CI && process.env.E2E_OS_CERT_STORE !== "1",
    "set E2E_OS_CERT_STORE=1 to run the OS certificate store tests locally",
  );

  let proxy: FakePomerium;
  test.beforeEach(async () => {
    proxy = await startFakePomerium({ requireClientCert: true });
  });
  test.afterEach(async () => {
    await proxy?.close();
  });

  test("a client certificate in the OS store is found at connect time and presented", async ({
    page,
    tempHome,
  }) => {
    const uninstall = await installClientIdentity(tempHome);
    try {
      await connectThroughProxy(page, {
        name: "E2E Cert Store",
        proxy,
        echo,
        localPort,
        disableTlsVerification: true,
        certStoreIssuerCN: CA_NAME.CN,
      });
      await expectEcho(localPort, "hello from the cert store");
      expect(proxy.tunnels.at(-1)?.clientSubject).toMatchObject({ CN: CLIENT_NAME.CN });
    } finally {
      uninstall();
    }
  });

  test("an issuer filter that matches nothing in the OS store sends no certificate", async ({
    page,
    tempHome,
  }) => {
    const uninstall = await installClientIdentity(tempHome);
    try {
      await connectThroughProxy(page, {
        name: "E2E Cert Store Miss",
        proxy,
        echo,
        localPort,
        disableTlsVerification: true,
        certStoreIssuerCN: "Some Other CA",
      });
      await expectNoEcho(localPort, "should not arrive");
      expect(proxy.tunnels).toEqual([]);
    } finally {
      uninstall();
    }
  });
});
