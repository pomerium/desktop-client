/* eslint-disable */
import {
  ChannelCredentials,
  Client,
  ClientReadableStream,
  handleServerStreamingCall,
  makeGenericClientConstructor,
  Metadata,
} from '@grpc/grpc-js';
import type {
  CallOptions,
  ClientOptions,
  ClientUnaryCall,
  handleUnaryCall,
  ServiceError,
  UntypedServiceImplementation,
} from '@grpc/grpc-js';
import Long from 'long';
import _m0 from 'protobufjs/minimal';

import { Timestamp } from './google/protobuf/timestamp';

export const protobufPackage = 'pomerium.cli';

export enum Protocol {
  UNKNOWN = 0,
  TCP = 1,
  UDP = 2,
  UNRECOGNIZED = -1,
}

export function protocolFromJSON(object: any): Protocol {
  switch (object) {
    case 0:
    case 'UNKNOWN':
      return Protocol.UNKNOWN;
    case 1:
    case 'TCP':
      return Protocol.TCP;
    case 2:
    case 'UDP':
      return Protocol.UDP;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return Protocol.UNRECOGNIZED;
  }
}

export function protocolToJSON(object: Protocol): string {
  switch (object) {
    case Protocol.UNKNOWN:
      return 'UNKNOWN';
    case Protocol.TCP:
      return 'TCP';
    case Protocol.UDP:
      return 'UDP';
    case Protocol.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

/** Record represents a single tunnel record in the configuration */
export interface Record {
  /** if omitted, a new record would be created */
  id?: string | undefined;
  tags: string[];
  /** connection data may be omitted if i.e. just manipulating the tags data */
  conn?: Connection | undefined;
  source?: string | undefined;
}

export interface Records {
  records: Record[];
}

/**
 * Selector defines record filter
 * one of the options must be set
 * we do not use oneof as it results in inconveniences on the JS client side
 */
export interface Selector {
  /** all records */
  all: boolean;
  /** only return connections matching tag(s) */
  ids: string[];
  /** only return specific connection(s) */
  tags: string[];
}

export interface DeleteRecordsResponse {}

/**
 * Export dumps configuration (or subset of, based on provided tag filter)
 * in the JSON format
 */
export interface ExportRequest {
  selector: Selector | undefined;
  /** remove_tags to strip tags from output */
  removeTags: boolean;
  format: ExportRequest_Format;
}

export enum ExportRequest_Format {
  EXPORT_FORMAT_UNDEFINED = 0,
  EXPORT_FORMAT_JSON_COMPACT = 1,
  EXPORT_FORMAT_JSON_PRETTY = 2,
  UNRECOGNIZED = -1,
}

export function exportRequest_FormatFromJSON(
  object: any,
): ExportRequest_Format {
  switch (object) {
    case 0:
    case 'EXPORT_FORMAT_UNDEFINED':
      return ExportRequest_Format.EXPORT_FORMAT_UNDEFINED;
    case 1:
    case 'EXPORT_FORMAT_JSON_COMPACT':
      return ExportRequest_Format.EXPORT_FORMAT_JSON_COMPACT;
    case 2:
    case 'EXPORT_FORMAT_JSON_PRETTY':
      return ExportRequest_Format.EXPORT_FORMAT_JSON_PRETTY;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return ExportRequest_Format.UNRECOGNIZED;
  }
}

export function exportRequest_FormatToJSON(
  object: ExportRequest_Format,
): string {
  switch (object) {
    case ExportRequest_Format.EXPORT_FORMAT_UNDEFINED:
      return 'EXPORT_FORMAT_UNDEFINED';
    case ExportRequest_Format.EXPORT_FORMAT_JSON_COMPACT:
      return 'EXPORT_FORMAT_JSON_COMPACT';
    case ExportRequest_Format.EXPORT_FORMAT_JSON_PRETTY:
      return 'EXPORT_FORMAT_JSON_PRETTY';
    case ExportRequest_Format.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export interface GetTagsRequest {}

export interface GetTagsResponse {
  tags: string[];
}

export interface ConfigData {
  data: Uint8Array;
}

/**
 * ImportRequest would consume the previously exported data back,
 * merging it with existing configuration,
 * and performing de-duplication of the records so that multiple imports would
 * yield the same result
 */
export interface ImportRequest {
  /** if set, all connections would receive that tag instead */
  overrideTag?: string | undefined;
  data: Uint8Array;
}

export interface ImportResponse {}

export interface ListenerUpdateRequest {
  /** omit connection ids to connect all connections */
  connectionIds: string[];
  connected: boolean;
}

export interface ListenerStatus {
  listening: boolean;
  listenAddr?: string | undefined;
  lastError?: string | undefined;
}

export interface ListenerStatusResponse {
  listeners: { [key: string]: ListenerStatus };
}

export interface ListenerStatusResponse_ListenersEntry {
  key: string;
  value: ListenerStatus | undefined;
}

export interface StatusUpdatesRequest {
  connectionId: string;
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

/** ConnectionStatusUpdates represent connection state changes */
export interface ConnectionStatusUpdate {
  /** record this event relates to */
  id: string;
  /**
   * peer_addr represents connecting party remote address and may be used to
   * distinguish between individual TCP connections
   */
  peerAddr?: string | undefined;
  status: ConnectionStatusUpdate_ConnectionStatus;
  /** in case the connection failed or terminated, last error may be available */
  lastError?: string | undefined;
  /** provides an authentication URL when AUTH_REQUIRED status is set */
  authUrl?: string | undefined;
  /** event timestamp */
  ts: Date | undefined;
}

export enum ConnectionStatusUpdate_ConnectionStatus {
  CONNECTION_STATUS_UNDEFINED = 0,
  CONNECTION_STATUS_CONNECTING = 1,
  CONNECTION_STATUS_AUTH_REQUIRED = 2,
  CONNECTION_STATUS_CONNECTED = 3,
  CONNECTION_STATUS_DISCONNECTED = 4,
  /** CONNECTION_STATUS_LISTENING - listener is up; peer_addr would not be set */
  CONNECTION_STATUS_LISTENING = 5,
  /** CONNECTION_STATUS_CLOSED - listener is closed; peer_addr would not be set */
  CONNECTION_STATUS_CLOSED = 6,
  UNRECOGNIZED = -1,
}

export function connectionStatusUpdate_ConnectionStatusFromJSON(
  object: any,
): ConnectionStatusUpdate_ConnectionStatus {
  switch (object) {
    case 0:
    case 'CONNECTION_STATUS_UNDEFINED':
      return ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_UNDEFINED;
    case 1:
    case 'CONNECTION_STATUS_CONNECTING':
      return ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_CONNECTING;
    case 2:
    case 'CONNECTION_STATUS_AUTH_REQUIRED':
      return ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_AUTH_REQUIRED;
    case 3:
    case 'CONNECTION_STATUS_CONNECTED':
      return ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_CONNECTED;
    case 4:
    case 'CONNECTION_STATUS_DISCONNECTED':
      return ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_DISCONNECTED;
    case 5:
    case 'CONNECTION_STATUS_LISTENING':
      return ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_LISTENING;
    case 6:
    case 'CONNECTION_STATUS_CLOSED':
      return ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_CLOSED;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return ConnectionStatusUpdate_ConnectionStatus.UNRECOGNIZED;
  }
}

export function connectionStatusUpdate_ConnectionStatusToJSON(
  object: ConnectionStatusUpdate_ConnectionStatus,
): string {
  switch (object) {
    case ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_UNDEFINED:
      return 'CONNECTION_STATUS_UNDEFINED';
    case ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_CONNECTING:
      return 'CONNECTION_STATUS_CONNECTING';
    case ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_AUTH_REQUIRED:
      return 'CONNECTION_STATUS_AUTH_REQUIRED';
    case ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_CONNECTED:
      return 'CONNECTION_STATUS_CONNECTED';
    case ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_DISCONNECTED:
      return 'CONNECTION_STATUS_DISCONNECTED';
    case ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_LISTENING:
      return 'CONNECTION_STATUS_LISTENING';
    case ConnectionStatusUpdate_ConnectionStatus.CONNECTION_STATUS_CLOSED:
      return 'CONNECTION_STATUS_CLOSED';
    case ConnectionStatusUpdate_ConnectionStatus.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export interface KeyUsage {
  /** standard key usages */
  digitalSignature: boolean;
  contentCommitment: boolean;
  keyEncipherment: boolean;
  dataEncipherment: boolean;
  keyAgreement: boolean;
  /** certificate authority */
  certSign: boolean;
  crlSign: boolean;
  encipherOnly: boolean;
  decipherOnly: boolean;
  /**
   * extensions derived from x509.ExtKeyUsage
   * server certificate
   */
  serverAuth: boolean;
  /** client certificate */
  clientAuth: boolean;
}

/** Name defines the x509 identity */
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
  /** error is set if there was an error parsing provided certificate */
  error?: string | undefined;
}

export interface Certificate {
  cert: Uint8Array;
  key?: Uint8Array | undefined;
  /**
   * info field is ignored during upsert requests
   * and is set when returning certificate info
   */
  info?: CertificateInfo | undefined;
}

/**
 * ClientCertFromStore contains additional filters to apply when searching for
 * a client certificate in the system trust store. (This search will always
 * take into account any CA names from the TLS CertificateRequest message.)
 */
export interface ClientCertFromStore {
  /** filters based on a single name attribute (e.g. "CN=my cert" or "O=my org") */
  issuerFilter?: string | undefined;
  subjectFilter?: string | undefined;
}

/** Connection */
export interface Connection {
  /** name is a user friendly connection name that a user may define */
  name?: string | undefined;
  /** the protocol to use for the connection */
  protocol?: Protocol | undefined;
  /** remote_addr is a remote pomerium host:port */
  remoteAddr: string;
  /** listen_address, if not provided, will assign a random port each time */
  listenAddr?: string | undefined;
  /** the URL of the pomerium server to connect to */
  pomeriumUrl?: string | undefined;
  disableTlsVerification?: boolean | undefined;
  caCert?: Uint8Array | undefined;
  clientCert?: Certificate | undefined;
  /** indicates to search the system trust store for a client certificate */
  clientCertFromStore?: ClientCertFromStore | undefined;
  autostart?: boolean | undefined;
}

function createBaseRecord(): Record {
  return { id: undefined, tags: [], conn: undefined, source: undefined };
}

export const Record = {
  encode(
    message: Record,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.id !== undefined) {
      writer.uint32(10).string(message.id);
    }
    for (const v of message.tags) {
      writer.uint32(18).string(v!);
    }
    if (message.conn !== undefined) {
      Connection.encode(message.conn, writer.uint32(26).fork()).ldelim();
    }
    if (message.source !== undefined) {
      writer.uint32(34).string(message.source);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Record {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRecord();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.tags.push(reader.string());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.conn = Connection.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.source = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Record {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : undefined,
      tags: globalThis.Array.isArray(object?.tags)
        ? object.tags.map((e: any) => globalThis.String(e))
        : [],
      conn: isSet(object.conn) ? Connection.fromJSON(object.conn) : undefined,
      source: isSet(object.source)
        ? globalThis.String(object.source)
        : undefined,
    };
  },

  toJSON(message: Record): unknown {
    const obj: any = {};
    if (message.id !== undefined) {
      obj.id = message.id;
    }
    if (message.tags?.length) {
      obj.tags = message.tags;
    }
    if (message.conn !== undefined) {
      obj.conn = Connection.toJSON(message.conn);
    }
    if (message.source !== undefined) {
      obj.source = message.source;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Record>, I>>(base?: I): Record {
    return Record.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Record>, I>>(object: I): Record {
    const message = createBaseRecord();
    message.id = object.id ?? undefined;
    message.tags = object.tags?.map((e) => e) || [];
    message.conn =
      object.conn !== undefined && object.conn !== null
        ? Connection.fromPartial(object.conn)
        : undefined;
    message.source = object.source ?? undefined;
    return message;
  },
};

function createBaseRecords(): Records {
  return { records: [] };
}

export const Records = {
  encode(
    message: Records,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.records) {
      Record.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Records {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRecords();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.records.push(Record.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Records {
    return {
      records: globalThis.Array.isArray(object?.records)
        ? object.records.map((e: any) => Record.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Records): unknown {
    const obj: any = {};
    if (message.records?.length) {
      obj.records = message.records.map((e) => Record.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Records>, I>>(base?: I): Records {
    return Records.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Records>, I>>(object: I): Records {
    const message = createBaseRecords();
    message.records = object.records?.map((e) => Record.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSelector(): Selector {
  return { all: false, ids: [], tags: [] };
}

export const Selector = {
  encode(
    message: Selector,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.all === true) {
      writer.uint32(8).bool(message.all);
    }
    for (const v of message.ids) {
      writer.uint32(18).string(v!);
    }
    for (const v of message.tags) {
      writer.uint32(26).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Selector {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSelector();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.all = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.ids.push(reader.string());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.tags.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Selector {
    return {
      all: isSet(object.all) ? globalThis.Boolean(object.all) : false,
      ids: globalThis.Array.isArray(object?.ids)
        ? object.ids.map((e: any) => globalThis.String(e))
        : [],
      tags: globalThis.Array.isArray(object?.tags)
        ? object.tags.map((e: any) => globalThis.String(e))
        : [],
    };
  },

  toJSON(message: Selector): unknown {
    const obj: any = {};
    if (message.all === true) {
      obj.all = message.all;
    }
    if (message.ids?.length) {
      obj.ids = message.ids;
    }
    if (message.tags?.length) {
      obj.tags = message.tags;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Selector>, I>>(base?: I): Selector {
    return Selector.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Selector>, I>>(object: I): Selector {
    const message = createBaseSelector();
    message.all = object.all ?? false;
    message.ids = object.ids?.map((e) => e) || [];
    message.tags = object.tags?.map((e) => e) || [];
    return message;
  },
};

function createBaseDeleteRecordsResponse(): DeleteRecordsResponse {
  return {};
}

export const DeleteRecordsResponse = {
  encode(
    _: DeleteRecordsResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number,
  ): DeleteRecordsResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteRecordsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): DeleteRecordsResponse {
    return {};
  },

  toJSON(_: DeleteRecordsResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<DeleteRecordsResponse>, I>>(
    base?: I,
  ): DeleteRecordsResponse {
    return DeleteRecordsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<DeleteRecordsResponse>, I>>(
    _: I,
  ): DeleteRecordsResponse {
    const message = createBaseDeleteRecordsResponse();
    return message;
  },
};

function createBaseExportRequest(): ExportRequest {
  return { selector: undefined, removeTags: false, format: 0 };
}

export const ExportRequest = {
  encode(
    message: ExportRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.selector !== undefined) {
      Selector.encode(message.selector, writer.uint32(10).fork()).ldelim();
    }
    if (message.removeTags === true) {
      writer.uint32(16).bool(message.removeTags);
    }
    if (message.format !== 0) {
      writer.uint32(24).int32(message.format);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExportRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExportRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.selector = Selector.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.removeTags = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.format = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ExportRequest {
    return {
      selector: isSet(object.selector)
        ? Selector.fromJSON(object.selector)
        : undefined,
      removeTags: isSet(object.removeTags)
        ? globalThis.Boolean(object.removeTags)
        : false,
      format: isSet(object.format)
        ? exportRequest_FormatFromJSON(object.format)
        : 0,
    };
  },

  toJSON(message: ExportRequest): unknown {
    const obj: any = {};
    if (message.selector !== undefined) {
      obj.selector = Selector.toJSON(message.selector);
    }
    if (message.removeTags === true) {
      obj.removeTags = message.removeTags;
    }
    if (message.format !== 0) {
      obj.format = exportRequest_FormatToJSON(message.format);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ExportRequest>, I>>(
    base?: I,
  ): ExportRequest {
    return ExportRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ExportRequest>, I>>(
    object: I,
  ): ExportRequest {
    const message = createBaseExportRequest();
    message.selector =
      object.selector !== undefined && object.selector !== null
        ? Selector.fromPartial(object.selector)
        : undefined;
    message.removeTags = object.removeTags ?? false;
    message.format = object.format ?? 0;
    return message;
  },
};

function createBaseGetTagsRequest(): GetTagsRequest {
  return {};
}

export const GetTagsRequest = {
  encode(
    _: GetTagsRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTagsRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTagsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetTagsRequest {
    return {};
  },

  toJSON(_: GetTagsRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTagsRequest>, I>>(
    base?: I,
  ): GetTagsRequest {
    return GetTagsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTagsRequest>, I>>(
    _: I,
  ): GetTagsRequest {
    const message = createBaseGetTagsRequest();
    return message;
  },
};

function createBaseGetTagsResponse(): GetTagsResponse {
  return { tags: [] };
}

export const GetTagsResponse = {
  encode(
    message: GetTagsResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.tags) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTagsResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTagsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.tags.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetTagsResponse {
    return {
      tags: globalThis.Array.isArray(object?.tags)
        ? object.tags.map((e: any) => globalThis.String(e))
        : [],
    };
  },

  toJSON(message: GetTagsResponse): unknown {
    const obj: any = {};
    if (message.tags?.length) {
      obj.tags = message.tags;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTagsResponse>, I>>(
    base?: I,
  ): GetTagsResponse {
    return GetTagsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTagsResponse>, I>>(
    object: I,
  ): GetTagsResponse {
    const message = createBaseGetTagsResponse();
    message.tags = object.tags?.map((e) => e) || [];
    return message;
  },
};

function createBaseConfigData(): ConfigData {
  return { data: new Uint8Array(0) };
}

export const ConfigData = {
  encode(
    message: ConfigData,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.data.length !== 0) {
      writer.uint32(10).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConfigData {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConfigData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.data = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ConfigData {
    return {
      data: isSet(object.data)
        ? bytesFromBase64(object.data)
        : new Uint8Array(0),
    };
  },

  toJSON(message: ConfigData): unknown {
    const obj: any = {};
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConfigData>, I>>(base?: I): ConfigData {
    return ConfigData.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ConfigData>, I>>(
    object: I,
  ): ConfigData {
    const message = createBaseConfigData();
    message.data = object.data ?? new Uint8Array(0);
    return message;
  },
};

function createBaseImportRequest(): ImportRequest {
  return { overrideTag: undefined, data: new Uint8Array(0) };
}

export const ImportRequest = {
  encode(
    message: ImportRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.overrideTag !== undefined) {
      writer.uint32(10).string(message.overrideTag);
    }
    if (message.data.length !== 0) {
      writer.uint32(18).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ImportRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseImportRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.overrideTag = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.data = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ImportRequest {
    return {
      overrideTag: isSet(object.overrideTag)
        ? globalThis.String(object.overrideTag)
        : undefined,
      data: isSet(object.data)
        ? bytesFromBase64(object.data)
        : new Uint8Array(0),
    };
  },

  toJSON(message: ImportRequest): unknown {
    const obj: any = {};
    if (message.overrideTag !== undefined) {
      obj.overrideTag = message.overrideTag;
    }
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ImportRequest>, I>>(
    base?: I,
  ): ImportRequest {
    return ImportRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ImportRequest>, I>>(
    object: I,
  ): ImportRequest {
    const message = createBaseImportRequest();
    message.overrideTag = object.overrideTag ?? undefined;
    message.data = object.data ?? new Uint8Array(0);
    return message;
  },
};

function createBaseImportResponse(): ImportResponse {
  return {};
}

export const ImportResponse = {
  encode(
    _: ImportResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ImportResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseImportResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): ImportResponse {
    return {};
  },

  toJSON(_: ImportResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<ImportResponse>, I>>(
    base?: I,
  ): ImportResponse {
    return ImportResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ImportResponse>, I>>(
    _: I,
  ): ImportResponse {
    const message = createBaseImportResponse();
    return message;
  },
};

function createBaseListenerUpdateRequest(): ListenerUpdateRequest {
  return { connectionIds: [], connected: false };
}

export const ListenerUpdateRequest = {
  encode(
    message: ListenerUpdateRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.connectionIds) {
      writer.uint32(10).string(v!);
    }
    if (message.connected === true) {
      writer.uint32(16).bool(message.connected);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number,
  ): ListenerUpdateRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListenerUpdateRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.connectionIds.push(reader.string());
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.connected = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListenerUpdateRequest {
    return {
      connectionIds: globalThis.Array.isArray(object?.connectionIds)
        ? object.connectionIds.map((e: any) => globalThis.String(e))
        : [],
      connected: isSet(object.connected)
        ? globalThis.Boolean(object.connected)
        : false,
    };
  },

  toJSON(message: ListenerUpdateRequest): unknown {
    const obj: any = {};
    if (message.connectionIds?.length) {
      obj.connectionIds = message.connectionIds;
    }
    if (message.connected === true) {
      obj.connected = message.connected;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListenerUpdateRequest>, I>>(
    base?: I,
  ): ListenerUpdateRequest {
    return ListenerUpdateRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListenerUpdateRequest>, I>>(
    object: I,
  ): ListenerUpdateRequest {
    const message = createBaseListenerUpdateRequest();
    message.connectionIds = object.connectionIds?.map((e) => e) || [];
    message.connected = object.connected ?? false;
    return message;
  },
};

function createBaseListenerStatus(): ListenerStatus {
  return { listening: false, listenAddr: undefined, lastError: undefined };
}

export const ListenerStatus = {
  encode(
    message: ListenerStatus,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.listening === true) {
      writer.uint32(8).bool(message.listening);
    }
    if (message.listenAddr !== undefined) {
      writer.uint32(18).string(message.listenAddr);
    }
    if (message.lastError !== undefined) {
      writer.uint32(26).string(message.lastError);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListenerStatus {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListenerStatus();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.listening = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.listenAddr = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.lastError = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListenerStatus {
    return {
      listening: isSet(object.listening)
        ? globalThis.Boolean(object.listening)
        : false,
      listenAddr: isSet(object.listenAddr)
        ? globalThis.String(object.listenAddr)
        : undefined,
      lastError: isSet(object.lastError)
        ? globalThis.String(object.lastError)
        : undefined,
    };
  },

  toJSON(message: ListenerStatus): unknown {
    const obj: any = {};
    if (message.listening === true) {
      obj.listening = message.listening;
    }
    if (message.listenAddr !== undefined) {
      obj.listenAddr = message.listenAddr;
    }
    if (message.lastError !== undefined) {
      obj.lastError = message.lastError;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListenerStatus>, I>>(
    base?: I,
  ): ListenerStatus {
    return ListenerStatus.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListenerStatus>, I>>(
    object: I,
  ): ListenerStatus {
    const message = createBaseListenerStatus();
    message.listening = object.listening ?? false;
    message.listenAddr = object.listenAddr ?? undefined;
    message.lastError = object.lastError ?? undefined;
    return message;
  },
};

function createBaseListenerStatusResponse(): ListenerStatusResponse {
  return { listeners: {} };
}

export const ListenerStatusResponse = {
  encode(
    message: ListenerStatusResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    Object.entries(message.listeners).forEach(([key, value]) => {
      ListenerStatusResponse_ListenersEntry.encode(
        { key: key as any, value },
        writer.uint32(10).fork(),
      ).ldelim();
    });
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number,
  ): ListenerStatusResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListenerStatusResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = ListenerStatusResponse_ListenersEntry.decode(
            reader,
            reader.uint32(),
          );
          if (entry1.value !== undefined) {
            message.listeners[entry1.key] = entry1.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListenerStatusResponse {
    return {
      listeners: isObject(object.listeners)
        ? Object.entries(object.listeners).reduce<{
            [key: string]: ListenerStatus;
          }>((acc, [key, value]) => {
            acc[key] = ListenerStatus.fromJSON(value);
            return acc;
          }, {})
        : {},
    };
  },

  toJSON(message: ListenerStatusResponse): unknown {
    const obj: any = {};
    if (message.listeners) {
      const entries = Object.entries(message.listeners);
      if (entries.length > 0) {
        obj.listeners = {};
        entries.forEach(([k, v]) => {
          obj.listeners[k] = ListenerStatus.toJSON(v);
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListenerStatusResponse>, I>>(
    base?: I,
  ): ListenerStatusResponse {
    return ListenerStatusResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListenerStatusResponse>, I>>(
    object: I,
  ): ListenerStatusResponse {
    const message = createBaseListenerStatusResponse();
    message.listeners = Object.entries(object.listeners ?? {}).reduce<{
      [key: string]: ListenerStatus;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = ListenerStatus.fromPartial(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseListenerStatusResponse_ListenersEntry(): ListenerStatusResponse_ListenersEntry {
  return { key: '', value: undefined };
}

export const ListenerStatusResponse_ListenersEntry = {
  encode(
    message: ListenerStatusResponse_ListenersEntry,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      ListenerStatus.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number,
  ): ListenerStatusResponse_ListenersEntry {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListenerStatusResponse_ListenersEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = ListenerStatus.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListenerStatusResponse_ListenersEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : '',
      value: isSet(object.value)
        ? ListenerStatus.fromJSON(object.value)
        : undefined,
    };
  },

  toJSON(message: ListenerStatusResponse_ListenersEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value !== undefined) {
      obj.value = ListenerStatus.toJSON(message.value);
    }
    return obj;
  },

  create<
    I extends Exact<DeepPartial<ListenerStatusResponse_ListenersEntry>, I>,
  >(base?: I): ListenerStatusResponse_ListenersEntry {
    return ListenerStatusResponse_ListenersEntry.fromPartial(
      base ?? ({} as any),
    );
  },
  fromPartial<
    I extends Exact<DeepPartial<ListenerStatusResponse_ListenersEntry>, I>,
  >(object: I): ListenerStatusResponse_ListenersEntry {
    const message = createBaseListenerStatusResponse_ListenersEntry();
    message.key = object.key ?? '';
    message.value =
      object.value !== undefined && object.value !== null
        ? ListenerStatus.fromPartial(object.value)
        : undefined;
    return message;
  },
};

function createBaseStatusUpdatesRequest(): StatusUpdatesRequest {
  return { connectionId: '' };
}

export const StatusUpdatesRequest = {
  encode(
    message: StatusUpdatesRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.connectionId !== '') {
      writer.uint32(10).string(message.connectionId);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number,
  ): StatusUpdatesRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatusUpdatesRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.connectionId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StatusUpdatesRequest {
    return {
      connectionId: isSet(object.connectionId)
        ? globalThis.String(object.connectionId)
        : '',
    };
  },

  toJSON(message: StatusUpdatesRequest): unknown {
    const obj: any = {};
    if (message.connectionId !== '') {
      obj.connectionId = message.connectionId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<StatusUpdatesRequest>, I>>(
    base?: I,
  ): StatusUpdatesRequest {
    return StatusUpdatesRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<StatusUpdatesRequest>, I>>(
    object: I,
  ): StatusUpdatesRequest {
    const message = createBaseStatusUpdatesRequest();
    message.connectionId = object.connectionId ?? '';
    return message;
  },
};

function createBaseFetchRoutesRequest(): FetchRoutesRequest {
  return {
    serverUrl: '',
    disableTlsVerification: undefined,
    caCert: undefined,
    clientCert: undefined,
    clientCertFromStore: undefined,
  };
}

export const FetchRoutesRequest = {
  encode(
    message: FetchRoutesRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.serverUrl !== '') {
      writer.uint32(10).string(message.serverUrl);
    }
    if (message.disableTlsVerification !== undefined) {
      writer.uint32(16).bool(message.disableTlsVerification);
    }
    if (message.caCert !== undefined) {
      writer.uint32(26).bytes(message.caCert);
    }
    if (message.clientCert !== undefined) {
      Certificate.encode(message.clientCert, writer.uint32(34).fork()).ldelim();
    }
    if (message.clientCertFromStore !== undefined) {
      ClientCertFromStore.encode(
        message.clientCertFromStore,
        writer.uint32(42).fork(),
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FetchRoutesRequest {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFetchRoutesRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.serverUrl = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.disableTlsVerification = reader.bool();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.caCert = reader.bytes();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.clientCert = Certificate.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.clientCertFromStore = ClientCertFromStore.decode(
            reader,
            reader.uint32(),
          );
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FetchRoutesRequest {
    return {
      serverUrl: isSet(object.serverUrl)
        ? globalThis.String(object.serverUrl)
        : '',
      disableTlsVerification: isSet(object.disableTlsVerification)
        ? globalThis.Boolean(object.disableTlsVerification)
        : undefined,
      caCert: isSet(object.caCert) ? bytesFromBase64(object.caCert) : undefined,
      clientCert: isSet(object.clientCert)
        ? Certificate.fromJSON(object.clientCert)
        : undefined,
      clientCertFromStore: isSet(object.clientCertFromStore)
        ? ClientCertFromStore.fromJSON(object.clientCertFromStore)
        : undefined,
    };
  },

  toJSON(message: FetchRoutesRequest): unknown {
    const obj: any = {};
    if (message.serverUrl !== '') {
      obj.serverUrl = message.serverUrl;
    }
    if (message.disableTlsVerification !== undefined) {
      obj.disableTlsVerification = message.disableTlsVerification;
    }
    if (message.caCert !== undefined) {
      obj.caCert = base64FromBytes(message.caCert);
    }
    if (message.clientCert !== undefined) {
      obj.clientCert = Certificate.toJSON(message.clientCert);
    }
    if (message.clientCertFromStore !== undefined) {
      obj.clientCertFromStore = ClientCertFromStore.toJSON(
        message.clientCertFromStore,
      );
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FetchRoutesRequest>, I>>(
    base?: I,
  ): FetchRoutesRequest {
    return FetchRoutesRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FetchRoutesRequest>, I>>(
    object: I,
  ): FetchRoutesRequest {
    const message = createBaseFetchRoutesRequest();
    message.serverUrl = object.serverUrl ?? '';
    message.disableTlsVerification = object.disableTlsVerification ?? undefined;
    message.caCert = object.caCert ?? undefined;
    message.clientCert =
      object.clientCert !== undefined && object.clientCert !== null
        ? Certificate.fromPartial(object.clientCert)
        : undefined;
    message.clientCertFromStore =
      object.clientCertFromStore !== undefined &&
      object.clientCertFromStore !== null
        ? ClientCertFromStore.fromPartial(object.clientCertFromStore)
        : undefined;
    return message;
  },
};

function createBaseFetchRoutesResponse(): FetchRoutesResponse {
  return { routes: [] };
}

export const FetchRoutesResponse = {
  encode(
    message: FetchRoutesResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.routes) {
      PortalRoute.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FetchRoutesResponse {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFetchRoutesResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.routes.push(PortalRoute.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FetchRoutesResponse {
    return {
      routes: globalThis.Array.isArray(object?.routes)
        ? object.routes.map((e: any) => PortalRoute.fromJSON(e))
        : [],
    };
  },

  toJSON(message: FetchRoutesResponse): unknown {
    const obj: any = {};
    if (message.routes?.length) {
      obj.routes = message.routes.map((e) => PortalRoute.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FetchRoutesResponse>, I>>(
    base?: I,
  ): FetchRoutesResponse {
    return FetchRoutesResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FetchRoutesResponse>, I>>(
    object: I,
  ): FetchRoutesResponse {
    const message = createBaseFetchRoutesResponse();
    message.routes =
      object.routes?.map((e) => PortalRoute.fromPartial(e)) || [];
    return message;
  },
};

function createBasePortalRoute(): PortalRoute {
  return {
    id: '',
    name: '',
    type: '',
    from: '',
    description: '',
    connectCommand: undefined,
    logoUrl: '',
  };
}

export const PortalRoute = {
  encode(
    message: PortalRoute,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    if (message.type !== '') {
      writer.uint32(26).string(message.type);
    }
    if (message.from !== '') {
      writer.uint32(34).string(message.from);
    }
    if (message.description !== '') {
      writer.uint32(42).string(message.description);
    }
    if (message.connectCommand !== undefined) {
      writer.uint32(50).string(message.connectCommand);
    }
    if (message.logoUrl !== '') {
      writer.uint32(58).string(message.logoUrl);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PortalRoute {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePortalRoute();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.type = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.from = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.description = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.connectCommand = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.logoUrl = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PortalRoute {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : '',
      name: isSet(object.name) ? globalThis.String(object.name) : '',
      type: isSet(object.type) ? globalThis.String(object.type) : '',
      from: isSet(object.from) ? globalThis.String(object.from) : '',
      description: isSet(object.description)
        ? globalThis.String(object.description)
        : '',
      connectCommand: isSet(object.connectCommand)
        ? globalThis.String(object.connectCommand)
        : undefined,
      logoUrl: isSet(object.logoUrl) ? globalThis.String(object.logoUrl) : '',
    };
  },

  toJSON(message: PortalRoute): unknown {
    const obj: any = {};
    if (message.id !== '') {
      obj.id = message.id;
    }
    if (message.name !== '') {
      obj.name = message.name;
    }
    if (message.type !== '') {
      obj.type = message.type;
    }
    if (message.from !== '') {
      obj.from = message.from;
    }
    if (message.description !== '') {
      obj.description = message.description;
    }
    if (message.connectCommand !== undefined) {
      obj.connectCommand = message.connectCommand;
    }
    if (message.logoUrl !== '') {
      obj.logoUrl = message.logoUrl;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<PortalRoute>, I>>(base?: I): PortalRoute {
    return PortalRoute.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<PortalRoute>, I>>(
    object: I,
  ): PortalRoute {
    const message = createBasePortalRoute();
    message.id = object.id ?? '';
    message.name = object.name ?? '';
    message.type = object.type ?? '';
    message.from = object.from ?? '';
    message.description = object.description ?? '';
    message.connectCommand = object.connectCommand ?? undefined;
    message.logoUrl = object.logoUrl ?? '';
    return message;
  },
};

function createBaseConnectionStatusUpdate(): ConnectionStatusUpdate {
  return {
    id: '',
    peerAddr: undefined,
    status: 0,
    lastError: undefined,
    authUrl: undefined,
    ts: undefined,
  };
}

export const ConnectionStatusUpdate = {
  encode(
    message: ConnectionStatusUpdate,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }
    if (message.peerAddr !== undefined) {
      writer.uint32(18).string(message.peerAddr);
    }
    if (message.status !== 0) {
      writer.uint32(24).int32(message.status);
    }
    if (message.lastError !== undefined) {
      writer.uint32(34).string(message.lastError);
    }
    if (message.authUrl !== undefined) {
      writer.uint32(42).string(message.authUrl);
    }
    if (message.ts !== undefined) {
      Timestamp.encode(
        toTimestamp(message.ts),
        writer.uint32(50).fork(),
      ).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number,
  ): ConnectionStatusUpdate {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectionStatusUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerAddr = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.status = reader.int32() as any;
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.lastError = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.authUrl = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.ts = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ConnectionStatusUpdate {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : '',
      peerAddr: isSet(object.peerAddr)
        ? globalThis.String(object.peerAddr)
        : undefined,
      status: isSet(object.status)
        ? connectionStatusUpdate_ConnectionStatusFromJSON(object.status)
        : 0,
      lastError: isSet(object.lastError)
        ? globalThis.String(object.lastError)
        : undefined,
      authUrl: isSet(object.authUrl)
        ? globalThis.String(object.authUrl)
        : undefined,
      ts: isSet(object.ts) ? fromJsonTimestamp(object.ts) : undefined,
    };
  },

  toJSON(message: ConnectionStatusUpdate): unknown {
    const obj: any = {};
    if (message.id !== '') {
      obj.id = message.id;
    }
    if (message.peerAddr !== undefined) {
      obj.peerAddr = message.peerAddr;
    }
    if (message.status !== 0) {
      obj.status = connectionStatusUpdate_ConnectionStatusToJSON(
        message.status,
      );
    }
    if (message.lastError !== undefined) {
      obj.lastError = message.lastError;
    }
    if (message.authUrl !== undefined) {
      obj.authUrl = message.authUrl;
    }
    if (message.ts !== undefined) {
      obj.ts = message.ts.toISOString();
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectionStatusUpdate>, I>>(
    base?: I,
  ): ConnectionStatusUpdate {
    return ConnectionStatusUpdate.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ConnectionStatusUpdate>, I>>(
    object: I,
  ): ConnectionStatusUpdate {
    const message = createBaseConnectionStatusUpdate();
    message.id = object.id ?? '';
    message.peerAddr = object.peerAddr ?? undefined;
    message.status = object.status ?? 0;
    message.lastError = object.lastError ?? undefined;
    message.authUrl = object.authUrl ?? undefined;
    message.ts = object.ts ?? undefined;
    return message;
  },
};

function createBaseKeyUsage(): KeyUsage {
  return {
    digitalSignature: false,
    contentCommitment: false,
    keyEncipherment: false,
    dataEncipherment: false,
    keyAgreement: false,
    certSign: false,
    crlSign: false,
    encipherOnly: false,
    decipherOnly: false,
    serverAuth: false,
    clientAuth: false,
  };
}

export const KeyUsage = {
  encode(
    message: KeyUsage,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.digitalSignature === true) {
      writer.uint32(8).bool(message.digitalSignature);
    }
    if (message.contentCommitment === true) {
      writer.uint32(16).bool(message.contentCommitment);
    }
    if (message.keyEncipherment === true) {
      writer.uint32(24).bool(message.keyEncipherment);
    }
    if (message.dataEncipherment === true) {
      writer.uint32(32).bool(message.dataEncipherment);
    }
    if (message.keyAgreement === true) {
      writer.uint32(40).bool(message.keyAgreement);
    }
    if (message.certSign === true) {
      writer.uint32(48).bool(message.certSign);
    }
    if (message.crlSign === true) {
      writer.uint32(56).bool(message.crlSign);
    }
    if (message.encipherOnly === true) {
      writer.uint32(64).bool(message.encipherOnly);
    }
    if (message.decipherOnly === true) {
      writer.uint32(72).bool(message.decipherOnly);
    }
    if (message.serverAuth === true) {
      writer.uint32(80).bool(message.serverAuth);
    }
    if (message.clientAuth === true) {
      writer.uint32(88).bool(message.clientAuth);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): KeyUsage {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseKeyUsage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.digitalSignature = reader.bool();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.contentCommitment = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.keyEncipherment = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.dataEncipherment = reader.bool();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.keyAgreement = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.certSign = reader.bool();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.crlSign = reader.bool();
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.encipherOnly = reader.bool();
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.decipherOnly = reader.bool();
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.serverAuth = reader.bool();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.clientAuth = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): KeyUsage {
    return {
      digitalSignature: isSet(object.digitalSignature)
        ? globalThis.Boolean(object.digitalSignature)
        : false,
      contentCommitment: isSet(object.contentCommitment)
        ? globalThis.Boolean(object.contentCommitment)
        : false,
      keyEncipherment: isSet(object.keyEncipherment)
        ? globalThis.Boolean(object.keyEncipherment)
        : false,
      dataEncipherment: isSet(object.dataEncipherment)
        ? globalThis.Boolean(object.dataEncipherment)
        : false,
      keyAgreement: isSet(object.keyAgreement)
        ? globalThis.Boolean(object.keyAgreement)
        : false,
      certSign: isSet(object.certSign)
        ? globalThis.Boolean(object.certSign)
        : false,
      crlSign: isSet(object.crlSign)
        ? globalThis.Boolean(object.crlSign)
        : false,
      encipherOnly: isSet(object.encipherOnly)
        ? globalThis.Boolean(object.encipherOnly)
        : false,
      decipherOnly: isSet(object.decipherOnly)
        ? globalThis.Boolean(object.decipherOnly)
        : false,
      serverAuth: isSet(object.serverAuth)
        ? globalThis.Boolean(object.serverAuth)
        : false,
      clientAuth: isSet(object.clientAuth)
        ? globalThis.Boolean(object.clientAuth)
        : false,
    };
  },

  toJSON(message: KeyUsage): unknown {
    const obj: any = {};
    if (message.digitalSignature === true) {
      obj.digitalSignature = message.digitalSignature;
    }
    if (message.contentCommitment === true) {
      obj.contentCommitment = message.contentCommitment;
    }
    if (message.keyEncipherment === true) {
      obj.keyEncipherment = message.keyEncipherment;
    }
    if (message.dataEncipherment === true) {
      obj.dataEncipherment = message.dataEncipherment;
    }
    if (message.keyAgreement === true) {
      obj.keyAgreement = message.keyAgreement;
    }
    if (message.certSign === true) {
      obj.certSign = message.certSign;
    }
    if (message.crlSign === true) {
      obj.crlSign = message.crlSign;
    }
    if (message.encipherOnly === true) {
      obj.encipherOnly = message.encipherOnly;
    }
    if (message.decipherOnly === true) {
      obj.decipherOnly = message.decipherOnly;
    }
    if (message.serverAuth === true) {
      obj.serverAuth = message.serverAuth;
    }
    if (message.clientAuth === true) {
      obj.clientAuth = message.clientAuth;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<KeyUsage>, I>>(base?: I): KeyUsage {
    return KeyUsage.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<KeyUsage>, I>>(object: I): KeyUsage {
    const message = createBaseKeyUsage();
    message.digitalSignature = object.digitalSignature ?? false;
    message.contentCommitment = object.contentCommitment ?? false;
    message.keyEncipherment = object.keyEncipherment ?? false;
    message.dataEncipherment = object.dataEncipherment ?? false;
    message.keyAgreement = object.keyAgreement ?? false;
    message.certSign = object.certSign ?? false;
    message.crlSign = object.crlSign ?? false;
    message.encipherOnly = object.encipherOnly ?? false;
    message.decipherOnly = object.decipherOnly ?? false;
    message.serverAuth = object.serverAuth ?? false;
    message.clientAuth = object.clientAuth ?? false;
    return message;
  },
};

function createBaseName(): Name {
  return {
    country: [],
    organization: [],
    organizationalUnit: [],
    locality: [],
    province: [],
    streetAddress: [],
    postalCode: [],
    serialNumber: '',
    commonName: '',
  };
}

export const Name = {
  encode(message: Name, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.country) {
      writer.uint32(10).string(v!);
    }
    for (const v of message.organization) {
      writer.uint32(18).string(v!);
    }
    for (const v of message.organizationalUnit) {
      writer.uint32(26).string(v!);
    }
    for (const v of message.locality) {
      writer.uint32(34).string(v!);
    }
    for (const v of message.province) {
      writer.uint32(42).string(v!);
    }
    for (const v of message.streetAddress) {
      writer.uint32(50).string(v!);
    }
    for (const v of message.postalCode) {
      writer.uint32(58).string(v!);
    }
    if (message.serialNumber !== '') {
      writer.uint32(66).string(message.serialNumber);
    }
    if (message.commonName !== '') {
      writer.uint32(74).string(message.commonName);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Name {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseName();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.country.push(reader.string());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.organization.push(reader.string());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.organizationalUnit.push(reader.string());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.locality.push(reader.string());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.province.push(reader.string());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.streetAddress.push(reader.string());
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.postalCode.push(reader.string());
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.serialNumber = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.commonName = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Name {
    return {
      country: globalThis.Array.isArray(object?.country)
        ? object.country.map((e: any) => globalThis.String(e))
        : [],
      organization: globalThis.Array.isArray(object?.organization)
        ? object.organization.map((e: any) => globalThis.String(e))
        : [],
      organizationalUnit: globalThis.Array.isArray(object?.organizationalUnit)
        ? object.organizationalUnit.map((e: any) => globalThis.String(e))
        : [],
      locality: globalThis.Array.isArray(object?.locality)
        ? object.locality.map((e: any) => globalThis.String(e))
        : [],
      province: globalThis.Array.isArray(object?.province)
        ? object.province.map((e: any) => globalThis.String(e))
        : [],
      streetAddress: globalThis.Array.isArray(object?.streetAddress)
        ? object.streetAddress.map((e: any) => globalThis.String(e))
        : [],
      postalCode: globalThis.Array.isArray(object?.postalCode)
        ? object.postalCode.map((e: any) => globalThis.String(e))
        : [],
      serialNumber: isSet(object.serialNumber)
        ? globalThis.String(object.serialNumber)
        : '',
      commonName: isSet(object.commonName)
        ? globalThis.String(object.commonName)
        : '',
    };
  },

  toJSON(message: Name): unknown {
    const obj: any = {};
    if (message.country?.length) {
      obj.country = message.country;
    }
    if (message.organization?.length) {
      obj.organization = message.organization;
    }
    if (message.organizationalUnit?.length) {
      obj.organizationalUnit = message.organizationalUnit;
    }
    if (message.locality?.length) {
      obj.locality = message.locality;
    }
    if (message.province?.length) {
      obj.province = message.province;
    }
    if (message.streetAddress?.length) {
      obj.streetAddress = message.streetAddress;
    }
    if (message.postalCode?.length) {
      obj.postalCode = message.postalCode;
    }
    if (message.serialNumber !== '') {
      obj.serialNumber = message.serialNumber;
    }
    if (message.commonName !== '') {
      obj.commonName = message.commonName;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Name>, I>>(base?: I): Name {
    return Name.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Name>, I>>(object: I): Name {
    const message = createBaseName();
    message.country = object.country?.map((e) => e) || [];
    message.organization = object.organization?.map((e) => e) || [];
    message.organizationalUnit = object.organizationalUnit?.map((e) => e) || [];
    message.locality = object.locality?.map((e) => e) || [];
    message.province = object.province?.map((e) => e) || [];
    message.streetAddress = object.streetAddress?.map((e) => e) || [];
    message.postalCode = object.postalCode?.map((e) => e) || [];
    message.serialNumber = object.serialNumber ?? '';
    message.commonName = object.commonName ?? '';
    return message;
  },
};

function createBaseCertificateInfo(): CertificateInfo {
  return {
    version: 0,
    serial: '',
    issuer: undefined,
    subject: undefined,
    notBefore: undefined,
    notAfter: undefined,
    keyUsage: undefined,
    dnsNames: [],
    emailAddresses: [],
    ipAddresses: [],
    uris: [],
    permittedDnsDomainsCritical: false,
    permittedDnsDomains: [],
    excludedDnsDomains: [],
    permittedIpRanges: [],
    excludedIpRanges: [],
    permittedEmailAddresses: [],
    excludedEmailAddresses: [],
    permittedUriDomains: [],
    excludedUriDomains: [],
    error: undefined,
  };
}

export const CertificateInfo = {
  encode(
    message: CertificateInfo,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.version !== 0) {
      writer.uint32(8).int64(message.version);
    }
    if (message.serial !== '') {
      writer.uint32(18).string(message.serial);
    }
    if (message.issuer !== undefined) {
      Name.encode(message.issuer, writer.uint32(26).fork()).ldelim();
    }
    if (message.subject !== undefined) {
      Name.encode(message.subject, writer.uint32(34).fork()).ldelim();
    }
    if (message.notBefore !== undefined) {
      Timestamp.encode(
        toTimestamp(message.notBefore),
        writer.uint32(42).fork(),
      ).ldelim();
    }
    if (message.notAfter !== undefined) {
      Timestamp.encode(
        toTimestamp(message.notAfter),
        writer.uint32(50).fork(),
      ).ldelim();
    }
    if (message.keyUsage !== undefined) {
      KeyUsage.encode(message.keyUsage, writer.uint32(58).fork()).ldelim();
    }
    for (const v of message.dnsNames) {
      writer.uint32(82).string(v!);
    }
    for (const v of message.emailAddresses) {
      writer.uint32(90).string(v!);
    }
    for (const v of message.ipAddresses) {
      writer.uint32(98).string(v!);
    }
    for (const v of message.uris) {
      writer.uint32(106).string(v!);
    }
    if (message.permittedDnsDomainsCritical === true) {
      writer.uint32(112).bool(message.permittedDnsDomainsCritical);
    }
    for (const v of message.permittedDnsDomains) {
      writer.uint32(122).string(v!);
    }
    for (const v of message.excludedDnsDomains) {
      writer.uint32(130).string(v!);
    }
    for (const v of message.permittedIpRanges) {
      writer.uint32(138).string(v!);
    }
    for (const v of message.excludedIpRanges) {
      writer.uint32(146).string(v!);
    }
    for (const v of message.permittedEmailAddresses) {
      writer.uint32(154).string(v!);
    }
    for (const v of message.excludedEmailAddresses) {
      writer.uint32(162).string(v!);
    }
    for (const v of message.permittedUriDomains) {
      writer.uint32(170).string(v!);
    }
    for (const v of message.excludedUriDomains) {
      writer.uint32(178).string(v!);
    }
    if (message.error !== undefined) {
      writer.uint32(186).string(message.error);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CertificateInfo {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCertificateInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.version = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.serial = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.issuer = Name.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.subject = Name.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.notBefore = fromTimestamp(
            Timestamp.decode(reader, reader.uint32()),
          );
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.notAfter = fromTimestamp(
            Timestamp.decode(reader, reader.uint32()),
          );
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.keyUsage = KeyUsage.decode(reader, reader.uint32());
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.dnsNames.push(reader.string());
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.emailAddresses.push(reader.string());
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.ipAddresses.push(reader.string());
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.uris.push(reader.string());
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.permittedDnsDomainsCritical = reader.bool();
          continue;
        case 15:
          if (tag !== 122) {
            break;
          }

          message.permittedDnsDomains.push(reader.string());
          continue;
        case 16:
          if (tag !== 130) {
            break;
          }

          message.excludedDnsDomains.push(reader.string());
          continue;
        case 17:
          if (tag !== 138) {
            break;
          }

          message.permittedIpRanges.push(reader.string());
          continue;
        case 18:
          if (tag !== 146) {
            break;
          }

          message.excludedIpRanges.push(reader.string());
          continue;
        case 19:
          if (tag !== 154) {
            break;
          }

          message.permittedEmailAddresses.push(reader.string());
          continue;
        case 20:
          if (tag !== 162) {
            break;
          }

          message.excludedEmailAddresses.push(reader.string());
          continue;
        case 21:
          if (tag !== 170) {
            break;
          }

          message.permittedUriDomains.push(reader.string());
          continue;
        case 22:
          if (tag !== 178) {
            break;
          }

          message.excludedUriDomains.push(reader.string());
          continue;
        case 23:
          if (tag !== 186) {
            break;
          }

          message.error = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CertificateInfo {
    return {
      version: isSet(object.version) ? globalThis.Number(object.version) : 0,
      serial: isSet(object.serial) ? globalThis.String(object.serial) : '',
      issuer: isSet(object.issuer) ? Name.fromJSON(object.issuer) : undefined,
      subject: isSet(object.subject)
        ? Name.fromJSON(object.subject)
        : undefined,
      notBefore: isSet(object.notBefore)
        ? fromJsonTimestamp(object.notBefore)
        : undefined,
      notAfter: isSet(object.notAfter)
        ? fromJsonTimestamp(object.notAfter)
        : undefined,
      keyUsage: isSet(object.keyUsage)
        ? KeyUsage.fromJSON(object.keyUsage)
        : undefined,
      dnsNames: globalThis.Array.isArray(object?.dnsNames)
        ? object.dnsNames.map((e: any) => globalThis.String(e))
        : [],
      emailAddresses: globalThis.Array.isArray(object?.emailAddresses)
        ? object.emailAddresses.map((e: any) => globalThis.String(e))
        : [],
      ipAddresses: globalThis.Array.isArray(object?.ipAddresses)
        ? object.ipAddresses.map((e: any) => globalThis.String(e))
        : [],
      uris: globalThis.Array.isArray(object?.uris)
        ? object.uris.map((e: any) => globalThis.String(e))
        : [],
      permittedDnsDomainsCritical: isSet(object.permittedDnsDomainsCritical)
        ? globalThis.Boolean(object.permittedDnsDomainsCritical)
        : false,
      permittedDnsDomains: globalThis.Array.isArray(object?.permittedDnsDomains)
        ? object.permittedDnsDomains.map((e: any) => globalThis.String(e))
        : [],
      excludedDnsDomains: globalThis.Array.isArray(object?.excludedDnsDomains)
        ? object.excludedDnsDomains.map((e: any) => globalThis.String(e))
        : [],
      permittedIpRanges: globalThis.Array.isArray(object?.permittedIpRanges)
        ? object.permittedIpRanges.map((e: any) => globalThis.String(e))
        : [],
      excludedIpRanges: globalThis.Array.isArray(object?.excludedIpRanges)
        ? object.excludedIpRanges.map((e: any) => globalThis.String(e))
        : [],
      permittedEmailAddresses: globalThis.Array.isArray(
        object?.permittedEmailAddresses,
      )
        ? object.permittedEmailAddresses.map((e: any) => globalThis.String(e))
        : [],
      excludedEmailAddresses: globalThis.Array.isArray(
        object?.excludedEmailAddresses,
      )
        ? object.excludedEmailAddresses.map((e: any) => globalThis.String(e))
        : [],
      permittedUriDomains: globalThis.Array.isArray(object?.permittedUriDomains)
        ? object.permittedUriDomains.map((e: any) => globalThis.String(e))
        : [],
      excludedUriDomains: globalThis.Array.isArray(object?.excludedUriDomains)
        ? object.excludedUriDomains.map((e: any) => globalThis.String(e))
        : [],
      error: isSet(object.error) ? globalThis.String(object.error) : undefined,
    };
  },

  toJSON(message: CertificateInfo): unknown {
    const obj: any = {};
    if (message.version !== 0) {
      obj.version = Math.round(message.version);
    }
    if (message.serial !== '') {
      obj.serial = message.serial;
    }
    if (message.issuer !== undefined) {
      obj.issuer = Name.toJSON(message.issuer);
    }
    if (message.subject !== undefined) {
      obj.subject = Name.toJSON(message.subject);
    }
    if (message.notBefore !== undefined) {
      obj.notBefore = message.notBefore.toISOString();
    }
    if (message.notAfter !== undefined) {
      obj.notAfter = message.notAfter.toISOString();
    }
    if (message.keyUsage !== undefined) {
      obj.keyUsage = KeyUsage.toJSON(message.keyUsage);
    }
    if (message.dnsNames?.length) {
      obj.dnsNames = message.dnsNames;
    }
    if (message.emailAddresses?.length) {
      obj.emailAddresses = message.emailAddresses;
    }
    if (message.ipAddresses?.length) {
      obj.ipAddresses = message.ipAddresses;
    }
    if (message.uris?.length) {
      obj.uris = message.uris;
    }
    if (message.permittedDnsDomainsCritical === true) {
      obj.permittedDnsDomainsCritical = message.permittedDnsDomainsCritical;
    }
    if (message.permittedDnsDomains?.length) {
      obj.permittedDnsDomains = message.permittedDnsDomains;
    }
    if (message.excludedDnsDomains?.length) {
      obj.excludedDnsDomains = message.excludedDnsDomains;
    }
    if (message.permittedIpRanges?.length) {
      obj.permittedIpRanges = message.permittedIpRanges;
    }
    if (message.excludedIpRanges?.length) {
      obj.excludedIpRanges = message.excludedIpRanges;
    }
    if (message.permittedEmailAddresses?.length) {
      obj.permittedEmailAddresses = message.permittedEmailAddresses;
    }
    if (message.excludedEmailAddresses?.length) {
      obj.excludedEmailAddresses = message.excludedEmailAddresses;
    }
    if (message.permittedUriDomains?.length) {
      obj.permittedUriDomains = message.permittedUriDomains;
    }
    if (message.excludedUriDomains?.length) {
      obj.excludedUriDomains = message.excludedUriDomains;
    }
    if (message.error !== undefined) {
      obj.error = message.error;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<CertificateInfo>, I>>(
    base?: I,
  ): CertificateInfo {
    return CertificateInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<CertificateInfo>, I>>(
    object: I,
  ): CertificateInfo {
    const message = createBaseCertificateInfo();
    message.version = object.version ?? 0;
    message.serial = object.serial ?? '';
    message.issuer =
      object.issuer !== undefined && object.issuer !== null
        ? Name.fromPartial(object.issuer)
        : undefined;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Name.fromPartial(object.subject)
        : undefined;
    message.notBefore = object.notBefore ?? undefined;
    message.notAfter = object.notAfter ?? undefined;
    message.keyUsage =
      object.keyUsage !== undefined && object.keyUsage !== null
        ? KeyUsage.fromPartial(object.keyUsage)
        : undefined;
    message.dnsNames = object.dnsNames?.map((e) => e) || [];
    message.emailAddresses = object.emailAddresses?.map((e) => e) || [];
    message.ipAddresses = object.ipAddresses?.map((e) => e) || [];
    message.uris = object.uris?.map((e) => e) || [];
    message.permittedDnsDomainsCritical =
      object.permittedDnsDomainsCritical ?? false;
    message.permittedDnsDomains =
      object.permittedDnsDomains?.map((e) => e) || [];
    message.excludedDnsDomains = object.excludedDnsDomains?.map((e) => e) || [];
    message.permittedIpRanges = object.permittedIpRanges?.map((e) => e) || [];
    message.excludedIpRanges = object.excludedIpRanges?.map((e) => e) || [];
    message.permittedEmailAddresses =
      object.permittedEmailAddresses?.map((e) => e) || [];
    message.excludedEmailAddresses =
      object.excludedEmailAddresses?.map((e) => e) || [];
    message.permittedUriDomains =
      object.permittedUriDomains?.map((e) => e) || [];
    message.excludedUriDomains = object.excludedUriDomains?.map((e) => e) || [];
    message.error = object.error ?? undefined;
    return message;
  },
};

function createBaseCertificate(): Certificate {
  return { cert: new Uint8Array(0), key: undefined, info: undefined };
}

export const Certificate = {
  encode(
    message: Certificate,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.cert.length !== 0) {
      writer.uint32(10).bytes(message.cert);
    }
    if (message.key !== undefined) {
      writer.uint32(18).bytes(message.key);
    }
    if (message.info !== undefined) {
      CertificateInfo.encode(message.info, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Certificate {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCertificate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.cert = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.key = reader.bytes();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.info = CertificateInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Certificate {
    return {
      cert: isSet(object.cert)
        ? bytesFromBase64(object.cert)
        : new Uint8Array(0),
      key: isSet(object.key) ? bytesFromBase64(object.key) : undefined,
      info: isSet(object.info)
        ? CertificateInfo.fromJSON(object.info)
        : undefined,
    };
  },

  toJSON(message: Certificate): unknown {
    const obj: any = {};
    if (message.cert.length !== 0) {
      obj.cert = base64FromBytes(message.cert);
    }
    if (message.key !== undefined) {
      obj.key = base64FromBytes(message.key);
    }
    if (message.info !== undefined) {
      obj.info = CertificateInfo.toJSON(message.info);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Certificate>, I>>(base?: I): Certificate {
    return Certificate.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Certificate>, I>>(
    object: I,
  ): Certificate {
    const message = createBaseCertificate();
    message.cert = object.cert ?? new Uint8Array(0);
    message.key = object.key ?? undefined;
    message.info =
      object.info !== undefined && object.info !== null
        ? CertificateInfo.fromPartial(object.info)
        : undefined;
    return message;
  },
};

function createBaseClientCertFromStore(): ClientCertFromStore {
  return { issuerFilter: undefined, subjectFilter: undefined };
}

export const ClientCertFromStore = {
  encode(
    message: ClientCertFromStore,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.issuerFilter !== undefined) {
      writer.uint32(10).string(message.issuerFilter);
    }
    if (message.subjectFilter !== undefined) {
      writer.uint32(18).string(message.subjectFilter);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientCertFromStore {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClientCertFromStore();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.issuerFilter = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.subjectFilter = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClientCertFromStore {
    return {
      issuerFilter: isSet(object.issuerFilter)
        ? globalThis.String(object.issuerFilter)
        : undefined,
      subjectFilter: isSet(object.subjectFilter)
        ? globalThis.String(object.subjectFilter)
        : undefined,
    };
  },

  toJSON(message: ClientCertFromStore): unknown {
    const obj: any = {};
    if (message.issuerFilter !== undefined) {
      obj.issuerFilter = message.issuerFilter;
    }
    if (message.subjectFilter !== undefined) {
      obj.subjectFilter = message.subjectFilter;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClientCertFromStore>, I>>(
    base?: I,
  ): ClientCertFromStore {
    return ClientCertFromStore.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClientCertFromStore>, I>>(
    object: I,
  ): ClientCertFromStore {
    const message = createBaseClientCertFromStore();
    message.issuerFilter = object.issuerFilter ?? undefined;
    message.subjectFilter = object.subjectFilter ?? undefined;
    return message;
  },
};

function createBaseConnection(): Connection {
  return {
    name: undefined,
    protocol: undefined,
    remoteAddr: '',
    listenAddr: undefined,
    pomeriumUrl: undefined,
    disableTlsVerification: undefined,
    caCert: undefined,
    clientCert: undefined,
    clientCertFromStore: undefined,
    autostart: undefined,
  };
}

export const Connection = {
  encode(
    message: Connection,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.name !== undefined) {
      writer.uint32(10).string(message.name);
    }
    if (message.protocol !== undefined) {
      writer.uint32(80).int32(message.protocol);
    }
    if (message.remoteAddr !== '') {
      writer.uint32(18).string(message.remoteAddr);
    }
    if (message.listenAddr !== undefined) {
      writer.uint32(26).string(message.listenAddr);
    }
    if (message.pomeriumUrl !== undefined) {
      writer.uint32(34).string(message.pomeriumUrl);
    }
    if (message.disableTlsVerification !== undefined) {
      writer.uint32(40).bool(message.disableTlsVerification);
    }
    if (message.caCert !== undefined) {
      writer.uint32(50).bytes(message.caCert);
    }
    if (message.clientCert !== undefined) {
      Certificate.encode(message.clientCert, writer.uint32(58).fork()).ldelim();
    }
    if (message.clientCertFromStore !== undefined) {
      ClientCertFromStore.encode(
        message.clientCertFromStore,
        writer.uint32(74).fork(),
      ).ldelim();
    }
    if (message.autostart !== undefined) {
      writer.uint32(88).bool(message.autostart);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Connection {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnection();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.protocol = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.remoteAddr = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.listenAddr = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.pomeriumUrl = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.disableTlsVerification = reader.bool();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.caCert = reader.bytes();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.clientCert = Certificate.decode(reader, reader.uint32());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.clientCertFromStore = ClientCertFromStore.decode(
            reader,
            reader.uint32(),
          );
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.autostart = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Connection {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : undefined,
      protocol: isSet(object.protocol)
        ? protocolFromJSON(object.protocol)
        : undefined,
      remoteAddr: isSet(object.remoteAddr)
        ? globalThis.String(object.remoteAddr)
        : '',
      listenAddr: isSet(object.listenAddr)
        ? globalThis.String(object.listenAddr)
        : undefined,
      pomeriumUrl: isSet(object.pomeriumUrl)
        ? globalThis.String(object.pomeriumUrl)
        : undefined,
      disableTlsVerification: isSet(object.disableTlsVerification)
        ? globalThis.Boolean(object.disableTlsVerification)
        : undefined,
      caCert: isSet(object.caCert) ? bytesFromBase64(object.caCert) : undefined,
      clientCert: isSet(object.clientCert)
        ? Certificate.fromJSON(object.clientCert)
        : undefined,
      clientCertFromStore: isSet(object.clientCertFromStore)
        ? ClientCertFromStore.fromJSON(object.clientCertFromStore)
        : undefined,
      autostart: isSet(object.autostart)
        ? globalThis.Boolean(object.autostart)
        : undefined,
    };
  },

  toJSON(message: Connection): unknown {
    const obj: any = {};
    if (message.name !== undefined) {
      obj.name = message.name;
    }
    if (message.protocol !== undefined) {
      obj.protocol = protocolToJSON(message.protocol);
    }
    if (message.remoteAddr !== '') {
      obj.remoteAddr = message.remoteAddr;
    }
    if (message.listenAddr !== undefined) {
      obj.listenAddr = message.listenAddr;
    }
    if (message.pomeriumUrl !== undefined) {
      obj.pomeriumUrl = message.pomeriumUrl;
    }
    if (message.disableTlsVerification !== undefined) {
      obj.disableTlsVerification = message.disableTlsVerification;
    }
    if (message.caCert !== undefined) {
      obj.caCert = base64FromBytes(message.caCert);
    }
    if (message.clientCert !== undefined) {
      obj.clientCert = Certificate.toJSON(message.clientCert);
    }
    if (message.clientCertFromStore !== undefined) {
      obj.clientCertFromStore = ClientCertFromStore.toJSON(
        message.clientCertFromStore,
      );
    }
    if (message.autostart !== undefined) {
      obj.autostart = message.autostart;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Connection>, I>>(base?: I): Connection {
    return Connection.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Connection>, I>>(
    object: I,
  ): Connection {
    const message = createBaseConnection();
    message.name = object.name ?? undefined;
    message.protocol = object.protocol ?? undefined;
    message.remoteAddr = object.remoteAddr ?? '';
    message.listenAddr = object.listenAddr ?? undefined;
    message.pomeriumUrl = object.pomeriumUrl ?? undefined;
    message.disableTlsVerification = object.disableTlsVerification ?? undefined;
    message.caCert = object.caCert ?? undefined;
    message.clientCert =
      object.clientCert !== undefined && object.clientCert !== null
        ? Certificate.fromPartial(object.clientCert)
        : undefined;
    message.clientCertFromStore =
      object.clientCertFromStore !== undefined &&
      object.clientCertFromStore !== null
        ? ClientCertFromStore.fromPartial(object.clientCertFromStore)
        : undefined;
    message.autostart = object.autostart ?? undefined;
    return message;
  },
};

/** Config represents desktop client configuration */
export type ConfigService = typeof ConfigService;
export const ConfigService = {
  /** List returns records that match Selector */
  list: {
    path: '/pomerium.cli.Config/List',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Selector) =>
      Buffer.from(Selector.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Selector.decode(value),
    responseSerialize: (value: Records) =>
      Buffer.from(Records.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Records.decode(value),
  },
  /** Delete deletes records that match Selector */
  delete: {
    path: '/pomerium.cli.Config/Delete',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Selector) =>
      Buffer.from(Selector.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Selector.decode(value),
    responseSerialize: (value: DeleteRecordsResponse) =>
      Buffer.from(DeleteRecordsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => DeleteRecordsResponse.decode(value),
  },
  /**
   * Upsert inserts (if no ID is provided) or updates records
   * you may omit the Connection data to just manipulate tags
   */
  upsert: {
    path: '/pomerium.cli.Config/Upsert',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Record) =>
      Buffer.from(Record.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Record.decode(value),
    responseSerialize: (value: Record) =>
      Buffer.from(Record.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Record.decode(value),
  },
  /** GetTags returns all tags. Note that tags are case sensitive */
  getTags: {
    path: '/pomerium.cli.Config/GetTags',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetTagsRequest) =>
      Buffer.from(GetTagsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetTagsRequest.decode(value),
    responseSerialize: (value: GetTagsResponse) =>
      Buffer.from(GetTagsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetTagsResponse.decode(value),
  },
  /** Export dumps config into serialized format */
  export: {
    path: '/pomerium.cli.Config/Export',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ExportRequest) =>
      Buffer.from(ExportRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ExportRequest.decode(value),
    responseSerialize: (value: ConfigData) =>
      Buffer.from(ConfigData.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ConfigData.decode(value),
  },
  /** Import imports previously serialized records */
  import: {
    path: '/pomerium.cli.Config/Import',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ImportRequest) =>
      Buffer.from(ImportRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ImportRequest.decode(value),
    responseSerialize: (value: ImportResponse) =>
      Buffer.from(ImportResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ImportResponse.decode(value),
  },
  /** FetchRoutes fetches all the routes from the routes portal. */
  fetchRoutes: {
    path: '/pomerium.cli.Config/FetchRoutes',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FetchRoutesRequest) =>
      Buffer.from(FetchRoutesRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FetchRoutesRequest.decode(value),
    responseSerialize: (value: FetchRoutesResponse) =>
      Buffer.from(FetchRoutesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => FetchRoutesResponse.decode(value),
  },
} as const;

export interface ConfigServer extends UntypedServiceImplementation {
  /** List returns records that match Selector */
  list: handleUnaryCall<Selector, Records>;
  /** Delete deletes records that match Selector */
  delete: handleUnaryCall<Selector, DeleteRecordsResponse>;
  /**
   * Upsert inserts (if no ID is provided) or updates records
   * you may omit the Connection data to just manipulate tags
   */
  upsert: handleUnaryCall<Record, Record>;
  /** GetTags returns all tags. Note that tags are case sensitive */
  getTags: handleUnaryCall<GetTagsRequest, GetTagsResponse>;
  /** Export dumps config into serialized format */
  export: handleUnaryCall<ExportRequest, ConfigData>;
  /** Import imports previously serialized records */
  import: handleUnaryCall<ImportRequest, ImportResponse>;
  /** FetchRoutes fetches all the routes from the routes portal. */
  fetchRoutes: handleUnaryCall<FetchRoutesRequest, FetchRoutesResponse>;
}

export interface ConfigClient extends Client {
  /** List returns records that match Selector */
  list(
    request: Selector,
    callback: (error: ServiceError | null, response: Records) => void,
  ): ClientUnaryCall;
  list(
    request: Selector,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Records) => void,
  ): ClientUnaryCall;
  list(
    request: Selector,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Records) => void,
  ): ClientUnaryCall;
  /** Delete deletes records that match Selector */
  delete(
    request: Selector,
    callback: (
      error: ServiceError | null,
      response: DeleteRecordsResponse,
    ) => void,
  ): ClientUnaryCall;
  delete(
    request: Selector,
    metadata: Metadata,
    callback: (
      error: ServiceError | null,
      response: DeleteRecordsResponse,
    ) => void,
  ): ClientUnaryCall;
  delete(
    request: Selector,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (
      error: ServiceError | null,
      response: DeleteRecordsResponse,
    ) => void,
  ): ClientUnaryCall;
  /**
   * Upsert inserts (if no ID is provided) or updates records
   * you may omit the Connection data to just manipulate tags
   */
  upsert(
    request: Record,
    callback: (error: ServiceError | null, response: Record) => void,
  ): ClientUnaryCall;
  upsert(
    request: Record,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Record) => void,
  ): ClientUnaryCall;
  upsert(
    request: Record,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Record) => void,
  ): ClientUnaryCall;
  /** GetTags returns all tags. Note that tags are case sensitive */
  getTags(
    request: GetTagsRequest,
    callback: (error: ServiceError | null, response: GetTagsResponse) => void,
  ): ClientUnaryCall;
  getTags(
    request: GetTagsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetTagsResponse) => void,
  ): ClientUnaryCall;
  getTags(
    request: GetTagsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetTagsResponse) => void,
  ): ClientUnaryCall;
  /** Export dumps config into serialized format */
  export(
    request: ExportRequest,
    callback: (error: ServiceError | null, response: ConfigData) => void,
  ): ClientUnaryCall;
  export(
    request: ExportRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ConfigData) => void,
  ): ClientUnaryCall;
  export(
    request: ExportRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ConfigData) => void,
  ): ClientUnaryCall;
  /** Import imports previously serialized records */
  import(
    request: ImportRequest,
    callback: (error: ServiceError | null, response: ImportResponse) => void,
  ): ClientUnaryCall;
  import(
    request: ImportRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ImportResponse) => void,
  ): ClientUnaryCall;
  import(
    request: ImportRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ImportResponse) => void,
  ): ClientUnaryCall;
  /** FetchRoutes fetches all the routes from the routes portal. */
  fetchRoutes(
    request: FetchRoutesRequest,
    callback: (
      error: ServiceError | null,
      response: FetchRoutesResponse,
    ) => void,
  ): ClientUnaryCall;
  fetchRoutes(
    request: FetchRoutesRequest,
    metadata: Metadata,
    callback: (
      error: ServiceError | null,
      response: FetchRoutesResponse,
    ) => void,
  ): ClientUnaryCall;
  fetchRoutes(
    request: FetchRoutesRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (
      error: ServiceError | null,
      response: FetchRoutesResponse,
    ) => void,
  ): ClientUnaryCall;
}

export const ConfigClient = makeGenericClientConstructor(
  ConfigService,
  'pomerium.cli.Config',
) as unknown as {
  new (
    address: string,
    credentials: ChannelCredentials,
    options?: Partial<ClientOptions>,
  ): ConfigClient;
  service: typeof ConfigService;
  serviceName: string;
};

/** Listener service controls listeners */
export type ListenerService = typeof ListenerService;
export const ListenerService = {
  /** Update alters connection status. */
  update: {
    path: '/pomerium.cli.Listener/Update',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ListenerUpdateRequest) =>
      Buffer.from(ListenerUpdateRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ListenerUpdateRequest.decode(value),
    responseSerialize: (value: ListenerStatusResponse) =>
      Buffer.from(ListenerStatusResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) =>
      ListenerStatusResponse.decode(value),
  },
  /** GetStatus returns current listener status for active tunnels */
  getStatus: {
    path: '/pomerium.cli.Listener/GetStatus',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Selector) =>
      Buffer.from(Selector.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Selector.decode(value),
    responseSerialize: (value: ListenerStatusResponse) =>
      Buffer.from(ListenerStatusResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) =>
      ListenerStatusResponse.decode(value),
  },
  /**
   * StatusUpdates opens a stream to listen to connection status updates
   * a client has to subscribe and continuously
   * listen to the broadcasted updates
   */
  statusUpdates: {
    path: '/pomerium.cli.Listener/StatusUpdates',
    requestStream: false,
    responseStream: true,
    requestSerialize: (value: StatusUpdatesRequest) =>
      Buffer.from(StatusUpdatesRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => StatusUpdatesRequest.decode(value),
    responseSerialize: (value: ConnectionStatusUpdate) =>
      Buffer.from(ConnectionStatusUpdate.encode(value).finish()),
    responseDeserialize: (value: Buffer) =>
      ConnectionStatusUpdate.decode(value),
  },
} as const;

export interface ListenerServer extends UntypedServiceImplementation {
  /** Update alters connection status. */
  update: handleUnaryCall<ListenerUpdateRequest, ListenerStatusResponse>;
  /** GetStatus returns current listener status for active tunnels */
  getStatus: handleUnaryCall<Selector, ListenerStatusResponse>;
  /**
   * StatusUpdates opens a stream to listen to connection status updates
   * a client has to subscribe and continuously
   * listen to the broadcasted updates
   */
  statusUpdates: handleServerStreamingCall<
    StatusUpdatesRequest,
    ConnectionStatusUpdate
  >;
}

export interface ListenerClient extends Client {
  /** Update alters connection status. */
  update(
    request: ListenerUpdateRequest,
    callback: (
      error: ServiceError | null,
      response: ListenerStatusResponse,
    ) => void,
  ): ClientUnaryCall;
  update(
    request: ListenerUpdateRequest,
    metadata: Metadata,
    callback: (
      error: ServiceError | null,
      response: ListenerStatusResponse,
    ) => void,
  ): ClientUnaryCall;
  update(
    request: ListenerUpdateRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (
      error: ServiceError | null,
      response: ListenerStatusResponse,
    ) => void,
  ): ClientUnaryCall;
  /** GetStatus returns current listener status for active tunnels */
  getStatus(
    request: Selector,
    callback: (
      error: ServiceError | null,
      response: ListenerStatusResponse,
    ) => void,
  ): ClientUnaryCall;
  getStatus(
    request: Selector,
    metadata: Metadata,
    callback: (
      error: ServiceError | null,
      response: ListenerStatusResponse,
    ) => void,
  ): ClientUnaryCall;
  getStatus(
    request: Selector,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (
      error: ServiceError | null,
      response: ListenerStatusResponse,
    ) => void,
  ): ClientUnaryCall;
  /**
   * StatusUpdates opens a stream to listen to connection status updates
   * a client has to subscribe and continuously
   * listen to the broadcasted updates
   */
  statusUpdates(
    request: StatusUpdatesRequest,
    options?: Partial<CallOptions>,
  ): ClientReadableStream<ConnectionStatusUpdate>;
  statusUpdates(
    request: StatusUpdatesRequest,
    metadata?: Metadata,
    options?: Partial<CallOptions>,
  ): ClientReadableStream<ConnectionStatusUpdate>;
}

export const ListenerClient = makeGenericClientConstructor(
  ListenerService,
  'pomerium.cli.Listener',
) as unknown as {
  new (
    address: string,
    credentials: ChannelCredentials,
    options?: Partial<ClientOptions>,
  ): ListenerClient;
  service: typeof ListenerService;
  serviceName: string;
};

function bytesFromBase64(b64: string): Uint8Array {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, 'base64'));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(''));
  }
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends globalThis.Array<infer U>
    ? globalThis.Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T extends {}
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & {
      [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
    };

function toTimestamp(date: Date): Timestamp {
  const seconds = Math.trunc(date.getTime() / 1_000);
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = (t.seconds || 0) * 1_000;
  millis += (t.nanos || 0) / 1_000_000;
  return new globalThis.Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof globalThis.Date) {
    return o;
  } else if (typeof o === 'string') {
    return new globalThis.Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER');
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
