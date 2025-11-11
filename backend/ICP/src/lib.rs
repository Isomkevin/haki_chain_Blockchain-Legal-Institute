use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::{query, update};
use std::cell::RefCell;
use std::collections::BTreeMap;

// ---------------------------
// Data Structures
// ---------------------------

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct MetadataRecord {
    pub record_id: u64,
    pub document_id: u64,
    pub metadata: String,
    pub owner: Principal,
    pub timestamp: u64,
    pub metadata_hash: String,
}

// ---------------------------
// Storage for Metadata
// ---------------------------
thread_local! {
    static REGISTRY: RefCell<BTreeMap<u64, MetadataRecord>> = RefCell::new(BTreeMap::new());
    static NEXT_ID: RefCell<u64> = RefCell::new(1);
}

// ---------------------------
// Utility: Keccak-256 hash for consistency with Ethereum side
// ---------------------------
fn keccak_hash(input: &str) -> String {
    use tiny_keccak::{Hasher, Keccak};
    let mut hasher = Keccak::v256();
    let mut output = [0u8; 32];
    hasher.update(input.as_bytes());
    hasher.finalize(&mut output);
    format!("0x{}", hex::encode(output))
}

// ---------------------------
// Core Method: store_metadata
// ---------------------------
#[update]
fn store_metadata(document_id: u64, metadata: String) -> MetadataRecord {
    let caller = ic_cdk::caller();
    let metadata_hash = keccak_hash(&metadata);
    let now = time();

    let record_id = NEXT_ID.with(|n| {
        let mut id_ref = n.borrow_mut();
        let id = *id_ref;
        *id_ref += 1;
        id
    });

    let record = MetadataRecord {
        record_id,
        document_id,
        metadata: metadata.clone(),
        owner: caller,
        timestamp: now,
        metadata_hash,
    };

    REGISTRY.with(|r| r.borrow_mut().insert(record_id, record.clone()));

    ic_cdk::println!(
        "[ICP Registry] Stored record_id={} document_id={} by {:?}",
        record_id,
        document_id,
        caller
    );

    record
}

// ---------------------------
// Query Methods for Metadata
// ---------------------------
#[query]
fn get_record(record_id: u64) -> Option<MetadataRecord> {
    REGISTRY.with(|r| r.borrow().get(&record_id).cloned())
}

#[query]
fn list_records() -> Vec<MetadataRecord> {
    REGISTRY.with(|r| r.borrow().values().cloned().collect())
}

#[query]
fn get_by_document(document_id: u64) -> Option<MetadataRecord> {
    REGISTRY.with(|r| {
        r.borrow()
            .values()
            .find(|rec| rec.document_id == document_id)
            .cloned()
    })
}

// ---------------------------
// Data Structures for Story Metadata
// ---------------------------
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct DetectionMatch {
    pub url: String,
    pub similarity: f64,
    pub excerpt: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct StoryMetadataRecord {
    pub record_id: u64,
    pub document_id: u64,
    pub metadata: String,
    pub owner: Principal,
    pub timestamp: u64,
    pub metadata_hash: String,
    pub matches: Vec<DetectionMatch>,
}

// ---------------------------
// Storage for Story Metadata
// ---------------------------
thread_local! {
    static STORY_REGISTRY: RefCell<BTreeMap<u64, StoryMetadataRecord>> = RefCell::new(BTreeMap::new());
    static STORY_NEXT_ID: RefCell<u64> = RefCell::new(1);
}

// ---------------------------
// Core Method: store_story_metadata
// ---------------------------
#[update]
fn store_story_metadata(
    document_id: u64,
    metadata: String,
    matches: Vec<DetectionMatch>
) -> StoryMetadataRecord {
    let caller = ic_cdk::caller();
    let metadata_hash = keccak_hash(&metadata);
    let now = time();

    let record_id = STORY_NEXT_ID.with(|n| {
        let mut id_ref = n.borrow_mut();
        let id = *id_ref;
        *id_ref += 1;
        id
    });

    let record = StoryMetadataRecord {
        record_id,
        document_id,
        metadata: metadata.clone(),
        owner: caller,
        timestamp: now,
        metadata_hash,
        matches,
    };

    STORY_REGISTRY.with(|r| r.borrow_mut().insert(record_id, record.clone()));

    ic_cdk::println!(
        "[ICP Story Registry] Stored record_id={} document_id={} by {:?}",
        record_id,
        document_id,
        caller
    );

    record
}

// ---------------------------
// Query Methods for Story Metadata
// ---------------------------
#[query]
fn get_story_record(record_id: u64) -> Option<StoryMetadataRecord> {
    STORY_REGISTRY.with(|r| r.borrow().get(&record_id).cloned())
}

#[query]
fn list_story_records() -> Vec<StoryMetadataRecord> {
    STORY_REGISTRY.with(|r| r.borrow().values().cloned().collect())
}

#[query]
fn get_story_by_document(document_id: u64) -> Option<StoryMetadataRecord> {
    STORY_REGISTRY.with(|r| {
        r.borrow()
            .values()
            .find(|rec| rec.document_id == document_id)
            .cloned()
    })
}
