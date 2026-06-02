# Kanban task graph: Flap World Cup Polymarket Vault

Board: `flap-worldcup-polymarket-vault`

Available Hermes profiles on this machine were checked. Only `default` is relevant for code/research; `bcv*` profiles are video-production oriented and not suitable for Solidity/product work.

## Fan-out / fan-in graph

T1 Research and product thesis
- Acceptance: Flap docs are summarized; WorldCupViewer/Resolver/AI Oracle/Trigger facts are cited; BSC-vs-Polymarket constraint is explicit.

T2 Contract architecture and Flap UI schema
- Acceptance: contract surface is World Cup-only; every user-facing function appears in `vaultUISchema()` with inputs/outputs/readonly/write flags.

T3 Frontend/UI schema preview plan
- Acceptance: produce a UI renderer plan or prototype mapping each schema method to cards/forms/tables, with special care around arrays and resolved/pending states.

T4 Security/review
- Depends on T1+T2+T3.
- Acceptance: identify BSC/Polymarket integration limitations, permissioned function/Guardian requirements, trigger/oracle risks, and testing checklist.

T5 Final synthesis / implementation plan
- Depends on T4.
- Acceptance: one polished plan to finish the project: contracts, factory, tests, UI preview, deploy/audit checklist.
