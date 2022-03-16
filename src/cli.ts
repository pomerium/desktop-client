import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as Sentry from '@sentry/electron';
import { ChannelCredentials } from '@grpc/grpc-js';
import { createServer } from 'net';

import { pomeriumCli } from './main/binaries';
import { ConfigClient, ListenerClient } from './shared/pb/api';

async function pickPort(): Promise<number> {
  const srv = createServer();
  srv.listen(0);
  const address = srv.address();
  srv.close();
  if (typeof address === 'object') {
    return address?.port || 0;
  }
  return 0;
}

export type CLI = {
  process: ChildProcessWithoutNullStreams;
  configClient: ConfigClient;
  listenerClient: ListenerClient;
};

export async function start(sentryDSN: string): Promise<CLI> {
  const grpcPort = await pickPort();
  const grpcAddress = `127.0.0.1:${grpcPort}`;

  const args = ['api', '--sentry-dsn', sentryDSN, '--grpc-addr', grpcAddress];
  const process = spawn(pomeriumCli, args);
  process.stdout.on('data', (data) => console.info(`${data}`));
  process.stderr.on('data', (data) => console.error(`${data}`));
  process.on('error', (error) => {
    Sentry.captureEvent({
      message: 'API process failed to start',
      extra: { error },
    });
  });
  process.on('close', (code, signal) => {
    if (signal != null) return;
    Sentry.captureEvent({
      message: 'API process unexpectedly quit',
      extra: { code },
    });
  });

  const configClient = new ConfigClient(
    grpcAddress,
    ChannelCredentials.createInsecure()
  );
  const listenerClient = new ListenerClient(
    grpcAddress,
    ChannelCredentials.createInsecure()
  );

  return { process, configClient, listenerClient };
}
