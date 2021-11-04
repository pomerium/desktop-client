/* eslint-disable */
import Long from 'long';
import {
  makeGenericClientConstructor,
  ChannelCredentials,
  ChannelOptions,
  UntypedServiceImplementation,
  handleUnaryCall,
  Client,
  ClientUnaryCall,
  Metadata,
  CallOptions,
  handleServerStreamingCall,
  ClientReadableStream,
  ServiceError,
} from '@grpc/grpc-js';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'pomerium.cli';

export interface Record {
  /** if omitted, a new record would be created */
  id?: string | undefined;
  tags: string[];
  /** connection data may be omitted if i.e. just manipulating the tags data */
  conn?: Connection | undefined;
}

export interface Records {
  records: Record[];
}

export interface Selector {
  /** all records */
  all: boolean | undefined;
  /** only return connections matching tag(s) */
  tags: Selector_TagFilter | undefined;
  /** only return specific connection(s) */
  ids: Selector_IdFilter | undefined;
}

export interface Selector_IdFilter {
  ids: string[];
}

export interface Selector_TagFilter {
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
  object: any
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
  object: ExportRequest_Format
): string {
  switch (object) {
    case ExportRequest_Format.EXPORT_FORMAT_UNDEFINED:
      return 'EXPORT_FORMAT_UNDEFINED';
    case ExportRequest_Format.EXPORT_FORMAT_JSON_COMPACT:
      return 'EXPORT_FORMAT_JSON_COMPACT';
    case ExportRequest_Format.EXPORT_FORMAT_JSON_PRETTY:
      return 'EXPORT_FORMAT_JSON_PRETTY';
    default:
      return 'UNKNOWN';
  }
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
  /** active listeners with their current ports */
  active: { [key: string]: string };
  /** if some listeners were unable to start up */
  errors: { [key: string]: string };
}

export interface ListenerStatus_ActiveEntry {
  key: string;
  value: string;
}

export interface ListenerStatus_ErrorsEntry {
  key: string;
  value: string;
}

export interface StatusUpdatesRequest {
  connectionId: string;
}

/** ConnectionStatusUpdates represent connection state changes */
export interface ConnectionStatusUpdate {
  /** record this event relates to */
  id: string;
  /**
   * peer_addr represents connecting party remote address and may be used to
   * distinguish between individual TCP connections
   */
  peerAddr: string;
  status: ConnectionStatusUpdate_ConnectionStatus;
  /** in case the connection failed or terminated, last error may be available */
  lastError?: string | undefined;
  /** provides an authentication URL when AUTH_REQUIRED status is set */
  authUrl?: string | undefined;
}

export enum ConnectionStatusUpdate_ConnectionStatus {
  CONNECTION_STATUS_UNDEFINED = 0,
  CONNECTION_STATUS_CONNECTING = 1,
  CONNECTION_STATUS_AUTH_REQUIRED = 2,
  CONNECTION_STATUS_CONNECTED = 3,
  CONNECTION_STATUS_DISCONNECTED = 4,
  UNRECOGNIZED = -1,
}

export function connectionStatusUpdate_ConnectionStatusFromJSON(
  object: any
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
    case -1:
    case 'UNRECOGNIZED':
    default:
      return ConnectionStatusUpdate_ConnectionStatus.UNRECOGNIZED;
  }
}

export function connectionStatusUpdate_ConnectionStatusToJSON(
  object: ConnectionStatusUpdate_ConnectionStatus
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
    default:
      return 'UNKNOWN';
  }
}

/** Connection */
export interface Connection {
  /** name is a user friendly connection name that a user may define */
  name?: string | undefined;
  /** remote_addr is a remote pomerium host:port */
  remoteAddr: string;
  /** listen_address, if not provided, will assign a random port each time */
  listenAddr?: string | undefined;
  /** the URL of the pomerium server to connect to */
  pomeriumUrl?: string | undefined;
  disableTlsVerification: boolean | undefined;
  caCert: Uint8Array | undefined;
}

const baseRecord: object = { tags: '' };

export const Record = {
  encode(
    message: Record,
    writer: _m0.Writer = _m0.Writer.create()
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
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Record {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseRecord } as Record;
    message.tags = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.tags.push(reader.string());
          break;
        case 3:
          message.conn = Connection.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Record {
    const message = { ...baseRecord } as Record;
    message.tags = [];
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = undefined;
    }
    if (object.tags !== undefined && object.tags !== null) {
      for (const e of object.tags) {
        message.tags.push(String(e));
      }
    }
    if (object.conn !== undefined && object.conn !== null) {
      message.conn = Connection.fromJSON(object.conn);
    } else {
      message.conn = undefined;
    }
    return message;
  },

  toJSON(message: Record): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    if (message.tags) {
      obj.tags = message.tags.map((e) => e);
    } else {
      obj.tags = [];
    }
    message.conn !== undefined &&
      (obj.conn = message.conn ? Connection.toJSON(message.conn) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<Record>): Record {
    const message = { ...baseRecord } as Record;
    message.id = object.id ?? undefined;
    message.tags = [];
    if (object.tags !== undefined && object.tags !== null) {
      for (const e of object.tags) {
        message.tags.push(e);
      }
    }
    if (object.conn !== undefined && object.conn !== null) {
      message.conn = Connection.fromPartial(object.conn);
    } else {
      message.conn = undefined;
    }
    return message;
  },
};

const baseRecords: object = {};

export const Records = {
  encode(
    message: Records,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.records) {
      Record.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Records {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseRecords } as Records;
    message.records = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.records.push(Record.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Records {
    const message = { ...baseRecords } as Records;
    message.records = [];
    if (object.records !== undefined && object.records !== null) {
      for (const e of object.records) {
        message.records.push(Record.fromJSON(e));
      }
    }
    return message;
  },

  toJSON(message: Records): unknown {
    const obj: any = {};
    if (message.records) {
      obj.records = message.records.map((e) =>
        e ? Record.toJSON(e) : undefined
      );
    } else {
      obj.records = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Records>): Records {
    const message = { ...baseRecords } as Records;
    message.records = [];
    if (object.records !== undefined && object.records !== null) {
      for (const e of object.records) {
        message.records.push(Record.fromPartial(e));
      }
    }
    return message;
  },
};

const baseSelector: object = {};

export const Selector = {
  encode(
    message: Selector,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.all !== undefined) {
      writer.uint32(8).bool(message.all);
    }
    if (message.tags !== undefined) {
      Selector_TagFilter.encode(
        message.tags,
        writer.uint32(18).fork()
      ).ldelim();
    }
    if (message.ids !== undefined) {
      Selector_IdFilter.encode(message.ids, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Selector {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseSelector } as Selector;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.all = reader.bool();
          break;
        case 2:
          message.tags = Selector_TagFilter.decode(reader, reader.uint32());
          break;
        case 3:
          message.ids = Selector_IdFilter.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Selector {
    const message = { ...baseSelector } as Selector;
    if (object.all !== undefined && object.all !== null) {
      message.all = Boolean(object.all);
    } else {
      message.all = undefined;
    }
    if (object.tags !== undefined && object.tags !== null) {
      message.tags = Selector_TagFilter.fromJSON(object.tags);
    } else {
      message.tags = undefined;
    }
    if (object.ids !== undefined && object.ids !== null) {
      message.ids = Selector_IdFilter.fromJSON(object.ids);
    } else {
      message.ids = undefined;
    }
    return message;
  },

  toJSON(message: Selector): unknown {
    const obj: any = {};
    message.all !== undefined && (obj.all = message.all);
    message.tags !== undefined &&
      (obj.tags = message.tags
        ? Selector_TagFilter.toJSON(message.tags)
        : undefined);
    message.ids !== undefined &&
      (obj.ids = message.ids
        ? Selector_IdFilter.toJSON(message.ids)
        : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<Selector>): Selector {
    const message = { ...baseSelector } as Selector;
    message.all = object.all ?? undefined;
    if (object.tags !== undefined && object.tags !== null) {
      message.tags = Selector_TagFilter.fromPartial(object.tags);
    } else {
      message.tags = undefined;
    }
    if (object.ids !== undefined && object.ids !== null) {
      message.ids = Selector_IdFilter.fromPartial(object.ids);
    } else {
      message.ids = undefined;
    }
    return message;
  },
};

const baseSelector_IdFilter: object = { ids: '' };

export const Selector_IdFilter = {
  encode(
    message: Selector_IdFilter,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.ids) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Selector_IdFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseSelector_IdFilter } as Selector_IdFilter;
    message.ids = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.ids.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Selector_IdFilter {
    const message = { ...baseSelector_IdFilter } as Selector_IdFilter;
    message.ids = [];
    if (object.ids !== undefined && object.ids !== null) {
      for (const e of object.ids) {
        message.ids.push(String(e));
      }
    }
    return message;
  },

  toJSON(message: Selector_IdFilter): unknown {
    const obj: any = {};
    if (message.ids) {
      obj.ids = message.ids.map((e) => e);
    } else {
      obj.ids = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Selector_IdFilter>): Selector_IdFilter {
    const message = { ...baseSelector_IdFilter } as Selector_IdFilter;
    message.ids = [];
    if (object.ids !== undefined && object.ids !== null) {
      for (const e of object.ids) {
        message.ids.push(e);
      }
    }
    return message;
  },
};

const baseSelector_TagFilter: object = { tags: '' };

export const Selector_TagFilter = {
  encode(
    message: Selector_TagFilter,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.tags) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Selector_TagFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseSelector_TagFilter } as Selector_TagFilter;
    message.tags = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.tags.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Selector_TagFilter {
    const message = { ...baseSelector_TagFilter } as Selector_TagFilter;
    message.tags = [];
    if (object.tags !== undefined && object.tags !== null) {
      for (const e of object.tags) {
        message.tags.push(String(e));
      }
    }
    return message;
  },

  toJSON(message: Selector_TagFilter): unknown {
    const obj: any = {};
    if (message.tags) {
      obj.tags = message.tags.map((e) => e);
    } else {
      obj.tags = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Selector_TagFilter>): Selector_TagFilter {
    const message = { ...baseSelector_TagFilter } as Selector_TagFilter;
    message.tags = [];
    if (object.tags !== undefined && object.tags !== null) {
      for (const e of object.tags) {
        message.tags.push(e);
      }
    }
    return message;
  },
};

const baseDeleteRecordsResponse: object = {};

export const DeleteRecordsResponse = {
  encode(
    _: DeleteRecordsResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): DeleteRecordsResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseDeleteRecordsResponse } as DeleteRecordsResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): DeleteRecordsResponse {
    const message = { ...baseDeleteRecordsResponse } as DeleteRecordsResponse;
    return message;
  },

  toJSON(_: DeleteRecordsResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: DeepPartial<DeleteRecordsResponse>): DeleteRecordsResponse {
    const message = { ...baseDeleteRecordsResponse } as DeleteRecordsResponse;
    return message;
  },
};

const baseExportRequest: object = { removeTags: false, format: 0 };

export const ExportRequest = {
  encode(
    message: ExportRequest,
    writer: _m0.Writer = _m0.Writer.create()
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
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseExportRequest } as ExportRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.selector = Selector.decode(reader, reader.uint32());
          break;
        case 2:
          message.removeTags = reader.bool();
          break;
        case 3:
          message.format = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ExportRequest {
    const message = { ...baseExportRequest } as ExportRequest;
    if (object.selector !== undefined && object.selector !== null) {
      message.selector = Selector.fromJSON(object.selector);
    } else {
      message.selector = undefined;
    }
    if (object.removeTags !== undefined && object.removeTags !== null) {
      message.removeTags = Boolean(object.removeTags);
    } else {
      message.removeTags = false;
    }
    if (object.format !== undefined && object.format !== null) {
      message.format = exportRequest_FormatFromJSON(object.format);
    } else {
      message.format = 0;
    }
    return message;
  },

  toJSON(message: ExportRequest): unknown {
    const obj: any = {};
    message.selector !== undefined &&
      (obj.selector = message.selector
        ? Selector.toJSON(message.selector)
        : undefined);
    message.removeTags !== undefined && (obj.removeTags = message.removeTags);
    message.format !== undefined &&
      (obj.format = exportRequest_FormatToJSON(message.format));
    return obj;
  },

  fromPartial(object: DeepPartial<ExportRequest>): ExportRequest {
    const message = { ...baseExportRequest } as ExportRequest;
    if (object.selector !== undefined && object.selector !== null) {
      message.selector = Selector.fromPartial(object.selector);
    } else {
      message.selector = undefined;
    }
    message.removeTags = object.removeTags ?? false;
    message.format = object.format ?? 0;
    return message;
  },
};

const baseConfigData: object = {};

export const ConfigData = {
  encode(
    message: ConfigData,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.data.length !== 0) {
      writer.uint32(10).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConfigData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseConfigData } as ConfigData;
    message.data = new Uint8Array();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.data = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConfigData {
    const message = { ...baseConfigData } as ConfigData;
    message.data = new Uint8Array();
    if (object.data !== undefined && object.data !== null) {
      message.data = bytesFromBase64(object.data);
    }
    return message;
  },

  toJSON(message: ConfigData): unknown {
    const obj: any = {};
    message.data !== undefined &&
      (obj.data = base64FromBytes(
        message.data !== undefined ? message.data : new Uint8Array()
      ));
    return obj;
  },

  fromPartial(object: DeepPartial<ConfigData>): ConfigData {
    const message = { ...baseConfigData } as ConfigData;
    message.data = object.data ?? new Uint8Array();
    return message;
  },
};

const baseImportRequest: object = {};

export const ImportRequest = {
  encode(
    message: ImportRequest,
    writer: _m0.Writer = _m0.Writer.create()
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
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseImportRequest } as ImportRequest;
    message.data = new Uint8Array();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.overrideTag = reader.string();
          break;
        case 2:
          message.data = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ImportRequest {
    const message = { ...baseImportRequest } as ImportRequest;
    message.data = new Uint8Array();
    if (object.overrideTag !== undefined && object.overrideTag !== null) {
      message.overrideTag = String(object.overrideTag);
    } else {
      message.overrideTag = undefined;
    }
    if (object.data !== undefined && object.data !== null) {
      message.data = bytesFromBase64(object.data);
    }
    return message;
  },

  toJSON(message: ImportRequest): unknown {
    const obj: any = {};
    message.overrideTag !== undefined &&
      (obj.overrideTag = message.overrideTag);
    message.data !== undefined &&
      (obj.data = base64FromBytes(
        message.data !== undefined ? message.data : new Uint8Array()
      ));
    return obj;
  },

  fromPartial(object: DeepPartial<ImportRequest>): ImportRequest {
    const message = { ...baseImportRequest } as ImportRequest;
    message.overrideTag = object.overrideTag ?? undefined;
    message.data = object.data ?? new Uint8Array();
    return message;
  },
};

const baseImportResponse: object = {};

export const ImportResponse = {
  encode(
    _: ImportResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ImportResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseImportResponse } as ImportResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): ImportResponse {
    const message = { ...baseImportResponse } as ImportResponse;
    return message;
  },

  toJSON(_: ImportResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: DeepPartial<ImportResponse>): ImportResponse {
    const message = { ...baseImportResponse } as ImportResponse;
    return message;
  },
};

const baseListenerUpdateRequest: object = {
  connectionIds: '',
  connected: false,
};

export const ListenerUpdateRequest = {
  encode(
    message: ListenerUpdateRequest,
    writer: _m0.Writer = _m0.Writer.create()
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
    length?: number
  ): ListenerUpdateRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseListenerUpdateRequest } as ListenerUpdateRequest;
    message.connectionIds = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.connectionIds.push(reader.string());
          break;
        case 2:
          message.connected = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ListenerUpdateRequest {
    const message = { ...baseListenerUpdateRequest } as ListenerUpdateRequest;
    message.connectionIds = [];
    if (object.connectionIds !== undefined && object.connectionIds !== null) {
      for (const e of object.connectionIds) {
        message.connectionIds.push(String(e));
      }
    }
    if (object.connected !== undefined && object.connected !== null) {
      message.connected = Boolean(object.connected);
    } else {
      message.connected = false;
    }
    return message;
  },

  toJSON(message: ListenerUpdateRequest): unknown {
    const obj: any = {};
    if (message.connectionIds) {
      obj.connectionIds = message.connectionIds.map((e) => e);
    } else {
      obj.connectionIds = [];
    }
    message.connected !== undefined && (obj.connected = message.connected);
    return obj;
  },

  fromPartial(
    object: DeepPartial<ListenerUpdateRequest>
  ): ListenerUpdateRequest {
    const message = { ...baseListenerUpdateRequest } as ListenerUpdateRequest;
    message.connectionIds = [];
    if (object.connectionIds !== undefined && object.connectionIds !== null) {
      for (const e of object.connectionIds) {
        message.connectionIds.push(e);
      }
    }
    message.connected = object.connected ?? false;
    return message;
  },
};

const baseListenerStatus: object = {};

export const ListenerStatus = {
  encode(
    message: ListenerStatus,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    Object.entries(message.active).forEach(([key, value]) => {
      ListenerStatus_ActiveEntry.encode(
        { key: key as any, value },
        writer.uint32(10).fork()
      ).ldelim();
    });
    Object.entries(message.errors).forEach(([key, value]) => {
      ListenerStatus_ErrorsEntry.encode(
        { key: key as any, value },
        writer.uint32(18).fork()
      ).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListenerStatus {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseListenerStatus } as ListenerStatus;
    message.active = {};
    message.errors = {};
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          const entry1 = ListenerStatus_ActiveEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry1.value !== undefined) {
            message.active[entry1.key] = entry1.value;
          }
          break;
        case 2:
          const entry2 = ListenerStatus_ErrorsEntry.decode(
            reader,
            reader.uint32()
          );
          if (entry2.value !== undefined) {
            message.errors[entry2.key] = entry2.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ListenerStatus {
    const message = { ...baseListenerStatus } as ListenerStatus;
    message.active = {};
    message.errors = {};
    if (object.active !== undefined && object.active !== null) {
      Object.entries(object.active).forEach(([key, value]) => {
        message.active[key] = String(value);
      });
    }
    if (object.errors !== undefined && object.errors !== null) {
      Object.entries(object.errors).forEach(([key, value]) => {
        message.errors[key] = String(value);
      });
    }
    return message;
  },

  toJSON(message: ListenerStatus): unknown {
    const obj: any = {};
    obj.active = {};
    if (message.active) {
      Object.entries(message.active).forEach(([k, v]) => {
        obj.active[k] = v;
      });
    }
    obj.errors = {};
    if (message.errors) {
      Object.entries(message.errors).forEach(([k, v]) => {
        obj.errors[k] = v;
      });
    }
    return obj;
  },

  fromPartial(object: DeepPartial<ListenerStatus>): ListenerStatus {
    const message = { ...baseListenerStatus } as ListenerStatus;
    message.active = {};
    if (object.active !== undefined && object.active !== null) {
      Object.entries(object.active).forEach(([key, value]) => {
        if (value !== undefined) {
          message.active[key] = String(value);
        }
      });
    }
    message.errors = {};
    if (object.errors !== undefined && object.errors !== null) {
      Object.entries(object.errors).forEach(([key, value]) => {
        if (value !== undefined) {
          message.errors[key] = String(value);
        }
      });
    }
    return message;
  },
};

const baseListenerStatus_ActiveEntry: object = { key: '', value: '' };

export const ListenerStatus_ActiveEntry = {
  encode(
    message: ListenerStatus_ActiveEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== '') {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ListenerStatus_ActiveEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseListenerStatus_ActiveEntry,
    } as ListenerStatus_ActiveEntry;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ListenerStatus_ActiveEntry {
    const message = {
      ...baseListenerStatus_ActiveEntry,
    } as ListenerStatus_ActiveEntry;
    if (object.key !== undefined && object.key !== null) {
      message.key = String(object.key);
    } else {
      message.key = '';
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = String(object.value);
    } else {
      message.value = '';
    }
    return message;
  },

  toJSON(message: ListenerStatus_ActiveEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  fromPartial(
    object: DeepPartial<ListenerStatus_ActiveEntry>
  ): ListenerStatus_ActiveEntry {
    const message = {
      ...baseListenerStatus_ActiveEntry,
    } as ListenerStatus_ActiveEntry;
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

const baseListenerStatus_ErrorsEntry: object = { key: '', value: '' };

export const ListenerStatus_ErrorsEntry = {
  encode(
    message: ListenerStatus_ErrorsEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== '') {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ListenerStatus_ErrorsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseListenerStatus_ErrorsEntry,
    } as ListenerStatus_ErrorsEntry;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ListenerStatus_ErrorsEntry {
    const message = {
      ...baseListenerStatus_ErrorsEntry,
    } as ListenerStatus_ErrorsEntry;
    if (object.key !== undefined && object.key !== null) {
      message.key = String(object.key);
    } else {
      message.key = '';
    }
    if (object.value !== undefined && object.value !== null) {
      message.value = String(object.value);
    } else {
      message.value = '';
    }
    return message;
  },

  toJSON(message: ListenerStatus_ErrorsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  fromPartial(
    object: DeepPartial<ListenerStatus_ErrorsEntry>
  ): ListenerStatus_ErrorsEntry {
    const message = {
      ...baseListenerStatus_ErrorsEntry,
    } as ListenerStatus_ErrorsEntry;
    message.key = object.key ?? '';
    message.value = object.value ?? '';
    return message;
  },
};

const baseStatusUpdatesRequest: object = { connectionId: '' };

export const StatusUpdatesRequest = {
  encode(
    message: StatusUpdatesRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.connectionId !== '') {
      writer.uint32(10).string(message.connectionId);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): StatusUpdatesRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseStatusUpdatesRequest } as StatusUpdatesRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.connectionId = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StatusUpdatesRequest {
    const message = { ...baseStatusUpdatesRequest } as StatusUpdatesRequest;
    if (object.connectionId !== undefined && object.connectionId !== null) {
      message.connectionId = String(object.connectionId);
    } else {
      message.connectionId = '';
    }
    return message;
  },

  toJSON(message: StatusUpdatesRequest): unknown {
    const obj: any = {};
    message.connectionId !== undefined &&
      (obj.connectionId = message.connectionId);
    return obj;
  },

  fromPartial(object: DeepPartial<StatusUpdatesRequest>): StatusUpdatesRequest {
    const message = { ...baseStatusUpdatesRequest } as StatusUpdatesRequest;
    message.connectionId = object.connectionId ?? '';
    return message;
  },
};

const baseConnectionStatusUpdate: object = { id: '', peerAddr: '', status: 0 };

export const ConnectionStatusUpdate = {
  encode(
    message: ConnectionStatusUpdate,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }
    if (message.peerAddr !== '') {
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
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ConnectionStatusUpdate {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseConnectionStatusUpdate } as ConnectionStatusUpdate;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.peerAddr = reader.string();
          break;
        case 3:
          message.status = reader.int32() as any;
          break;
        case 4:
          message.lastError = reader.string();
          break;
        case 5:
          message.authUrl = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConnectionStatusUpdate {
    const message = { ...baseConnectionStatusUpdate } as ConnectionStatusUpdate;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = '';
    }
    if (object.peerAddr !== undefined && object.peerAddr !== null) {
      message.peerAddr = String(object.peerAddr);
    } else {
      message.peerAddr = '';
    }
    if (object.status !== undefined && object.status !== null) {
      message.status = connectionStatusUpdate_ConnectionStatusFromJSON(
        object.status
      );
    } else {
      message.status = 0;
    }
    if (object.lastError !== undefined && object.lastError !== null) {
      message.lastError = String(object.lastError);
    } else {
      message.lastError = undefined;
    }
    if (object.authUrl !== undefined && object.authUrl !== null) {
      message.authUrl = String(object.authUrl);
    } else {
      message.authUrl = undefined;
    }
    return message;
  },

  toJSON(message: ConnectionStatusUpdate): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.peerAddr !== undefined && (obj.peerAddr = message.peerAddr);
    message.status !== undefined &&
      (obj.status = connectionStatusUpdate_ConnectionStatusToJSON(
        message.status
      ));
    message.lastError !== undefined && (obj.lastError = message.lastError);
    message.authUrl !== undefined && (obj.authUrl = message.authUrl);
    return obj;
  },

  fromPartial(
    object: DeepPartial<ConnectionStatusUpdate>
  ): ConnectionStatusUpdate {
    const message = { ...baseConnectionStatusUpdate } as ConnectionStatusUpdate;
    message.id = object.id ?? '';
    message.peerAddr = object.peerAddr ?? '';
    message.status = object.status ?? 0;
    message.lastError = object.lastError ?? undefined;
    message.authUrl = object.authUrl ?? undefined;
    return message;
  },
};

const baseConnection: object = { remoteAddr: '' };

export const Connection = {
  encode(
    message: Connection,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== undefined) {
      writer.uint32(10).string(message.name);
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
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Connection {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseConnection } as Connection;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.remoteAddr = reader.string();
          break;
        case 3:
          message.listenAddr = reader.string();
          break;
        case 4:
          message.pomeriumUrl = reader.string();
          break;
        case 5:
          message.disableTlsVerification = reader.bool();
          break;
        case 6:
          message.caCert = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Connection {
    const message = { ...baseConnection } as Connection;
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = undefined;
    }
    if (object.remoteAddr !== undefined && object.remoteAddr !== null) {
      message.remoteAddr = String(object.remoteAddr);
    } else {
      message.remoteAddr = '';
    }
    if (object.listenAddr !== undefined && object.listenAddr !== null) {
      message.listenAddr = String(object.listenAddr);
    } else {
      message.listenAddr = undefined;
    }
    if (object.pomeriumUrl !== undefined && object.pomeriumUrl !== null) {
      message.pomeriumUrl = String(object.pomeriumUrl);
    } else {
      message.pomeriumUrl = undefined;
    }
    if (
      object.disableTlsVerification !== undefined &&
      object.disableTlsVerification !== null
    ) {
      message.disableTlsVerification = Boolean(object.disableTlsVerification);
    } else {
      message.disableTlsVerification = undefined;
    }
    if (object.caCert !== undefined && object.caCert !== null) {
      message.caCert = bytesFromBase64(object.caCert);
    }
    return message;
  },

  toJSON(message: Connection): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.remoteAddr !== undefined && (obj.remoteAddr = message.remoteAddr);
    message.listenAddr !== undefined && (obj.listenAddr = message.listenAddr);
    message.pomeriumUrl !== undefined &&
      (obj.pomeriumUrl = message.pomeriumUrl);
    message.disableTlsVerification !== undefined &&
      (obj.disableTlsVerification = message.disableTlsVerification);
    message.caCert !== undefined &&
      (obj.caCert =
        message.caCert !== undefined
          ? base64FromBytes(message.caCert)
          : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<Connection>): Connection {
    const message = { ...baseConnection } as Connection;
    message.name = object.name ?? undefined;
    message.remoteAddr = object.remoteAddr ?? '';
    message.listenAddr = object.listenAddr ?? undefined;
    message.pomeriumUrl = object.pomeriumUrl ?? undefined;
    message.disableTlsVerification = object.disableTlsVerification ?? undefined;
    message.caCert = object.caCert ?? undefined;
    return message;
  },
};

export const ConfigService = {
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
} as const;

export interface ConfigServer extends UntypedServiceImplementation {
  list: handleUnaryCall<Selector, Records>;
  delete: handleUnaryCall<Selector, DeleteRecordsResponse>;
  upsert: handleUnaryCall<Record, Record>;
  export: handleUnaryCall<ExportRequest, ConfigData>;
  import: handleUnaryCall<ImportRequest, ImportResponse>;
}

export interface ConfigClient extends Client {
  list(
    request: Selector,
    callback: (error: ServiceError | null, response: Records) => void
  ): ClientUnaryCall;
  list(
    request: Selector,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Records) => void
  ): ClientUnaryCall;
  list(
    request: Selector,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Records) => void
  ): ClientUnaryCall;
  delete(
    request: Selector,
    callback: (
      error: ServiceError | null,
      response: DeleteRecordsResponse
    ) => void
  ): ClientUnaryCall;
  delete(
    request: Selector,
    metadata: Metadata,
    callback: (
      error: ServiceError | null,
      response: DeleteRecordsResponse
    ) => void
  ): ClientUnaryCall;
  delete(
    request: Selector,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (
      error: ServiceError | null,
      response: DeleteRecordsResponse
    ) => void
  ): ClientUnaryCall;
  upsert(
    request: Record,
    callback: (error: ServiceError | null, response: Record) => void
  ): ClientUnaryCall;
  upsert(
    request: Record,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Record) => void
  ): ClientUnaryCall;
  upsert(
    request: Record,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Record) => void
  ): ClientUnaryCall;
  export(
    request: ExportRequest,
    callback: (error: ServiceError | null, response: ConfigData) => void
  ): ClientUnaryCall;
  export(
    request: ExportRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ConfigData) => void
  ): ClientUnaryCall;
  export(
    request: ExportRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ConfigData) => void
  ): ClientUnaryCall;
  import(
    request: ImportRequest,
    callback: (error: ServiceError | null, response: ImportResponse) => void
  ): ClientUnaryCall;
  import(
    request: ImportRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ImportResponse) => void
  ): ClientUnaryCall;
  import(
    request: ImportRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ImportResponse) => void
  ): ClientUnaryCall;
}

export const ConfigClient = makeGenericClientConstructor(
  ConfigService,
  'pomerium.cli.Config'
) as unknown as {
  new (
    address: string,
    credentials: ChannelCredentials,
    options?: Partial<ChannelOptions>
  ): ConfigClient;
};

/** Listener service controls listeners */
export const ListenerService = {
  /** Listen starts connection listener */
  update: {
    path: '/pomerium.cli.Listener/Update',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ListenerUpdateRequest) =>
      Buffer.from(ListenerUpdateRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ListenerUpdateRequest.decode(value),
    responseSerialize: (value: ListenerStatus) =>
      Buffer.from(ListenerStatus.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ListenerStatus.decode(value),
  },
  /** GetStatus returns current listener status for active tunnels */
  getStatus: {
    path: '/pomerium.cli.Listener/GetStatus',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Selector) =>
      Buffer.from(Selector.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Selector.decode(value),
    responseSerialize: (value: ListenerStatus) =>
      Buffer.from(ListenerStatus.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ListenerStatus.decode(value),
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
  /** Listen starts connection listener */
  update: handleUnaryCall<ListenerUpdateRequest, ListenerStatus>;
  /** GetStatus returns current listener status for active tunnels */
  getStatus: handleUnaryCall<Selector, ListenerStatus>;
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
  /** Listen starts connection listener */
  update(
    request: ListenerUpdateRequest,
    callback: (error: ServiceError | null, response: ListenerStatus) => void
  ): ClientUnaryCall;
  update(
    request: ListenerUpdateRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ListenerStatus) => void
  ): ClientUnaryCall;
  update(
    request: ListenerUpdateRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ListenerStatus) => void
  ): ClientUnaryCall;
  /** GetStatus returns current listener status for active tunnels */
  getStatus(
    request: Selector,
    callback: (error: ServiceError | null, response: ListenerStatus) => void
  ): ClientUnaryCall;
  getStatus(
    request: Selector,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ListenerStatus) => void
  ): ClientUnaryCall;
  getStatus(
    request: Selector,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ListenerStatus) => void
  ): ClientUnaryCall;
  /**
   * StatusUpdates opens a stream to listen to connection status updates
   * a client has to subscribe and continuously
   * listen to the broadcasted updates
   */
  statusUpdates(
    request: StatusUpdatesRequest,
    options?: Partial<CallOptions>
  ): ClientReadableStream<ConnectionStatusUpdate>;
  statusUpdates(
    request: StatusUpdatesRequest,
    metadata?: Metadata,
    options?: Partial<CallOptions>
  ): ClientReadableStream<ConnectionStatusUpdate>;
}

export const ListenerClient = makeGenericClientConstructor(
  ListenerService,
  'pomerium.cli.Listener'
) as unknown as {
  new (
    address: string,
    credentials: ChannelCredentials,
    options?: Partial<ChannelOptions>
  ): ListenerClient;
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  throw 'Unable to locate global object';
})();

const atob: (b64: string) => string =
  globalThis.atob ||
  ((b64) => globalThis.Buffer.from(b64, 'base64').toString('binary'));
function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; ++i) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

const btoa: (bin: string) => string =
  globalThis.btoa ||
  ((bin) => globalThis.Buffer.from(bin, 'binary').toString('base64'));
function base64FromBytes(arr: Uint8Array): string {
  const bin: string[] = [];
  for (const byte of arr) {
    bin.push(String.fromCharCode(byte));
  }
  return btoa(bin.join(''));
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
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
