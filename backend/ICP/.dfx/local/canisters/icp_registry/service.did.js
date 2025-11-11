export const idlFactory = ({ IDL }) => {
  const MetadataRecord = IDL.Record({
    'document_id' : IDL.Nat64,
    'owner' : IDL.Principal,
    'metadata' : IDL.Text,
    'metadata_hash' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'record_id' : IDL.Nat64,
  });
  const DetectionMatch = IDL.Record({
    'url' : IDL.Text,
    'similarity' : IDL.Float64,
    'excerpt' : IDL.Opt(IDL.Text),
  });
  const StoryMetadataRecord = IDL.Record({
    'document_id' : IDL.Nat64,
    'owner' : IDL.Principal,
    'metadata' : IDL.Text,
    'matches' : IDL.Vec(DetectionMatch),
    'metadata_hash' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'record_id' : IDL.Nat64,
  });
  return IDL.Service({
    'get_by_document' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(MetadataRecord)],
        ['query'],
      ),
    'get_record' : IDL.Func([IDL.Nat64], [IDL.Opt(MetadataRecord)], ['query']),
    'get_story_by_document' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(StoryMetadataRecord)],
        ['query'],
      ),
    'get_story_record' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(StoryMetadataRecord)],
        ['query'],
      ),
    'list_records' : IDL.Func([], [IDL.Vec(MetadataRecord)], ['query']),
    'list_story_records' : IDL.Func(
        [],
        [IDL.Vec(StoryMetadataRecord)],
        ['query'],
      ),
    'store_metadata' : IDL.Func([IDL.Nat64, IDL.Text], [MetadataRecord], []),
    'store_story_metadata' : IDL.Func(
        [IDL.Nat64, IDL.Text, IDL.Vec(DetectionMatch)],
        [StoryMetadataRecord],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
