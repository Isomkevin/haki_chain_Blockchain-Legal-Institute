# 🧠 ICP Registry Canister

A lightweight **Internet Computer (ICP)** smart contract for storing and verifying document metadata linked to the **HakiChain LegalTech Agents** ecosystem.  
This registry ensures immutable storage of legal document metadata with cryptographic integrity and traceable ownership.

---

## 🧩 Overview

The `icp_registry` canister acts as an **on-chain metadata registry**, bridging the **FastAPI backend** with the **Internet Computer blockchain**.

- **Backend link:** `hakichain_agent/services/integrations/icp.py`
- **Integration SDK:** Uses the official **ICP Python SDK**
- **Purpose:** Allow legal AI agents to securely anchor document metadata, proofs, or hashes to ICP for decentralized verification.

---

## ⚙️ Architecture



hakichain-dorahacks-legaltech-agents/
├── hakichain_agent/
│ ├── main.py
│ └── services/
│ └── integrations/
│ └── icp.py ← Python bridge to ICP canister
└── icp_registry/
├── src/
│ └── icp_registry/
│ └── src/
│ └── lib.rs ← Rust canister logic
├── Cargo.toml
├── icp_registry.did
└── dfx.json


The FastAPI integration (`icp.py`) communicates with this Rust canister via **Candid interface** using the Python SDK — enabling automated storage and lookup of metadata records.

---

## 🧱 Core Functions

### `store_metadata(document_id: u64, metadata: String) -> MetadataRecord`
Stores a metadata record on-chain with the caller’s Principal and a **Keccak-256** hash of the metadata for Ethereum-compatibility.

### `get_record(record_id: u64) -> Option<MetadataRecord>`
Retrieves a specific metadata record by its unique record ID.

### `list_records() -> Vec<MetadataRecord>`
Returns all metadata records in the registry.

### `get_by_document(document_id: u64) -> Option<MetadataRecord>`
Fetches metadata linked to a given document ID.

---

## 🔐 Data Model

```rust
pub struct MetadataRecord {
    pub record_id: u64,
    pub document_id: u64,
    pub metadata: String,
    pub owner: Principal,
    pub timestamp: u64,
    pub metadata_hash: String,
}


Each record captures the full provenance and cryptographic fingerprint of a document, stored immutably within the canister.

🧩 Hashing Standard

Metadata is hashed with Keccak-256, ensuring compatibility with the Ethereum-side verification layer.

fn keccak_hash(input: &str) -> String {
    use tiny_keccak::{Hasher, Keccak};
    ...
}

🔗 Integration with FastAPI

The FastAPI service integrates through icp.py:

# hakichain_agent/services/integrations/icp.py

from icp_client import ICPClient  # hypothetical SDK import

client = ICPClient(canister_id="YOUR_CANISTER_ID")

def anchor_metadata(document_id, metadata):
    return client.call("store_metadata", document_id, metadata)


This enables HakiChain LegalTech Agents to automatically anchor proofs to the ICP canister whenever a new document is processed or verified.

🚀 Deployment (Local DFX)
# Start the local network
dfx start --background

# Deploy the canister
dfx deploy icp_registry

# Call methods
dfx canister call icp_registry store_metadata '(1, "Land Title #001 Proof")'
dfx canister call icp_registry list_records

📜 License

MIT License © 2025 HakiChain Labs

“On-chain truth, off-chain intelligence.”