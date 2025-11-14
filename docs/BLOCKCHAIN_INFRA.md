# ⛓️ HakiChain Blockchain Infrastructure

This document dives deeper into the on-chain and cross-chain components that power HakiChain's legal bounty marketplace.

---

## 1. Smart Contracts

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| `BountyRegistry.sol` | Stores bounty metadata and links submissions to cross-chain provenance. | `upsertBounty`, `linkBountyProofs`, `registerSubmission`, view helpers. |
| `BountyEscrow.sol` | Holds bounty funds in custody until milestones are approved. | `createEscrow`, `anchorDagProof`, `release`, `refund`. |
| `HakiToken.sol` | ERC‑20 utility token that logs Story/ICP/DAG provenance per mint. | `mintWithProvenance`, role management helpers. |

### Highlights
- **Upsert + Link**: NGOs can overwrite metadata while preserving history via emitted events.
- **Cross-chain proofs**: Story Protocol asset IDs, ICP canister IDs, and Constellation DAG hashes are first-class fields.
- **Access control**: Escrow release/refund guarded by `Ownable`; token minting gated behind `MINTER_ROLE`.

---

## 2. Deployment & Tooling

- **Hardhat** powers compilation, testing, and deployment (`npm run chain:*` scripts).
- **OpenZeppelin** libraries enforce security best practices (roles, ERC‑20, reentrancy guards).
- **Networks**: Local Hardhat network by default; extend `hardhat.config.ts` for testnets when ready.

### Typical Workflow
1. `npm run chain:compile`
2. `npm run chain:test`
3. `npm run chain:deploy -- --network <target>`

Store deployed addresses in Supabase or environment variables consumed by the frontend.

---

## 3. Backend Service Layer

`backend/services/` contains lightweight wrappers that bridge the blockchain contracts with external provenance rails:

- **Story Protocol** (`storyService.ts`): registers AI / legal IP assets.
- **Internet Computer** (`icpService.ts`): pins document hashes into canisters.
- **Constellation DAG** (`constellationService.ts`): records AI reasoning trails for audits.

These services emit IDs/hashes that are persisted on-chain via `BountyRegistry` and `HakiToken`.

---

## 4. Frontend Integration

- **Ethers.js** handles wallet connections, bounty escrow interactions, and real-time status renders.
- **Supabase** mirrors smart contract state (bounties, milestones, donations) for performant querying.
- **Process Context** ensures AI workflows keep the correct on-chain references when users switch tabs.

---

## 5. Security Considerations

- **Reentrancy protection**: `BountyEscrow` inherits `ReentrancyGuard`.
- **Limited mutability**: Only creators or platform admins can update bounty metadata.
- **Audit trail**: Every state-changing function emits events for off-chain indexers.
- **Proof anchoring**: DAG hashes must be anchored before release, ensuring transparent payout criteria.

---

## 6. Next Steps

- Integrate automated contract verification (Etherscan/Sourcify).
- Add multisig support for escrow owner actions.
- Extend Constellation DAG anchoring to include milestone-specific reasoning threads.

For questions or contributions, open an issue or reach out at **support@hakichain.co.ke**.

