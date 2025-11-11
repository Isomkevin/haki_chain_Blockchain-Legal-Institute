import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

/**
 * ---------------------------
 * DetectionMatch
 * ---------------------------
 */
export interface DetectionMatch {
  'url' : string,
  'similarity' : number,
  'excerpt' : [] | [string],
}
/**
 * ---------------------------
 * ICP Registry Candid Interface
 * ---------------------------
 * ---------------------------
 * MetadataRecord
 * ---------------------------
 */
export interface MetadataRecord {
  'document_id' : bigint,
  'owner' : Principal,
  'metadata' : string,
  'metadata_hash' : string,
  'timestamp' : bigint,
  'record_id' : bigint,
}
/**
 * ---------------------------
 * StoryMetadataRecord
 * ---------------------------
 */
export interface StoryMetadataRecord {
  'document_id' : bigint,
  'owner' : Principal,
  'metadata' : string,
  'matches' : Array<DetectionMatch>,
  'metadata_hash' : string,
  'timestamp' : bigint,
  'record_id' : bigint,
}
/**
 * ---------------------------
 * Service Interface
 * ---------------------------
 */
export interface _SERVICE {
  'get_by_document' : ActorMethod<[bigint], [] | [MetadataRecord]>,
  'get_record' : ActorMethod<[bigint], [] | [MetadataRecord]>,
  'get_story_by_document' : ActorMethod<[bigint], [] | [StoryMetadataRecord]>,
  'get_story_record' : ActorMethod<[bigint], [] | [StoryMetadataRecord]>,
  'list_records' : ActorMethod<[], Array<MetadataRecord>>,
  'list_story_records' : ActorMethod<[], Array<StoryMetadataRecord>>,
  /**
   * Metadata endpoints
   */
  'store_metadata' : ActorMethod<[bigint, string], MetadataRecord>,
  /**
   * Story Metadata endpoints
   */
  'store_story_metadata' : ActorMethod<
    [bigint, string, Array<DetectionMatch>],
    StoryMetadataRecord
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
