/* eslint-disable no-use-before-define, no-shadow */
export enum Protocol {
  UNKNOWN = 0,
  TCP = 1,
  UDP = 2,
  UNRECOGNIZED = -1,
}

export interface Record {
  id?: string | undefined;
  tags: string[];
  conn?: Connection | undefined;
  source?: string | undefined;
}

export interface Records {
  records: Record[];
}

export interface Selector {
  all: boolean;
  ids: string[];
  tags: string[];
}

export interface ListenerUpdateRequest {
  connectionIds: string[];
  connected: boolean;
}

export interface ListenerStatus {
  listening: boolean;
  listenAddr?: string | undefined;
  lastError?: string | undefined;
}

export interface FetchRoutesRequest {
  serverUrl: string;
  disableTlsVerification?: boolean | undefined;
  caCert?: Uint8Array | undefined;
  clientCert?: Certificate | undefined;
  clientCertFromStore?: ClientCertFromStore | undefined;
}

export interface FetchRoutesResponse {
  routes: PortalRoute[];
}

export interface PortalRoute {
  id: string;
  name: string;
  type: string;
  from: string;
  description: string;
  connectCommand?: string | undefined;
  logoUrl: string;
}

export interface ConnectionStatusUpdate {
  id: string;
  peerAddr?: string | undefined;
  status: number;
  lastError?: string | undefined;
  authUrl?: string | undefined;
  ts: Date | undefined;
}

export interface KeyUsage {
  digitalSignature: boolean;
  contentCommitment: boolean;
  keyEncipherment: boolean;
  dataEncipherment: boolean;
  keyAgreement: boolean;
  certSign: boolean;
  crlSign: boolean;
  encipherOnly: boolean;
  decipherOnly: boolean;
  serverAuth: boolean;
  clientAuth: boolean;
}

export interface Name {
  country: string[];
  organization: string[];
  organizationalUnit: string[];
  locality: string[];
  province: string[];
  streetAddress: string[];
  postalCode: string[];
  serialNumber: string;
  commonName: string;
}

export interface CertificateInfo {
  version: number;
  serial: string;
  issuer: Name | undefined;
  subject: Name | undefined;
  notBefore: Date | undefined;
  notAfter: Date | undefined;
  keyUsage: KeyUsage | undefined;
  dnsNames: string[];
  emailAddresses: string[];
  ipAddresses: string[];
  uris: string[];
  permittedDnsDomainsCritical: boolean;
  permittedDnsDomains: string[];
  excludedDnsDomains: string[];
  permittedIpRanges: string[];
  excludedIpRanges: string[];
  permittedEmailAddresses: string[];
  excludedEmailAddresses: string[];
  permittedUriDomains: string[];
  excludedUriDomains: string[];
  error?: string | undefined;
}

export interface Certificate {
  cert: Uint8Array;
  key?: Uint8Array | undefined;
  info?: CertificateInfo | undefined;
}

export interface ClientCertFromStore {
  issuerFilter?: string | undefined;
  subjectFilter?: string | undefined;
}

export interface Connection {
  name?: string | undefined;
  protocol?: Protocol | undefined;
  remoteAddr: string;
  listenAddr?: string | undefined;
  pomeriumUrl?: string | undefined;
  disableTlsVerification?: boolean | undefined;
  caCert?: Uint8Array | undefined;
  clientCert?: Certificate | undefined;
  clientCertFromStore?: ClientCertFromStore | undefined;
  autostart?: boolean | undefined;
}
