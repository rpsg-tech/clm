# CLM Implementation: Status Transition Flow Diagrams

This document outlines the **actual status transition logic** as implemented in the current codebase (specifically `ApprovalsService` and `ContractWorkflowService`), which differs slightly from the initial PRD.

## 1. Business User Implementation Flow
The Business User manages the creation and submission of contracts.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Contract
    DRAFT --> IN_REVIEW : Submit for Approval
    
    IN_REVIEW --> SENT_TO_LEGAL : System Logic (LEGAL Pending)
    IN_REVIEW --> FINANCE_REVIEW_IN_PROGRESS : System Logic (FINANCE Pending)
    
    REVISION_REQUESTED --> DRAFT : User Action (implied)
    
    APPROVED --> SENT_TO_COUNTERPARTY : User Action
    SENT_TO_COUNTERPARTY --> ACTIVE : Upload Signed Document
    
    DRAFT --> CANCELLED : User Action
    IN_REVIEW --> CANCELLED : User Action
```

---

## 2. Legal Review Implementation Flow (Manager & Head)
Legal moves from `IN_REVIEW` to `SENT_TO_LEGAL` and can escalate to the Head.

```mermaid
stateDiagram-v2
    [*] --> SENT_TO_LEGAL : Submit Action
    SENT_TO_LEGAL --> APPROVED : Legal Approves (If Finance already approved or disabled)
    SENT_TO_LEGAL --> FINANCE_REVIEW_IN_PROGRESS : Legal Approves (If Finance pending)
    SENT_TO_LEGAL --> REVISION_REQUESTED : Request Revision Action
    SENT_TO_LEGAL --> REJECTED : Reject Action (Special Permission)
    SENT_TO_LEGAL --> PENDING_LEGAL_HEAD : Escalate Action
    
    PENDING_LEGAL_HEAD --> APPROVED : Head Approves
    PENDING_LEGAL_HEAD --> SENT_TO_LEGAL : Return to Manager Action
    PENDING_LEGAL_HEAD --> REVISION_REQUESTED : Request Revision Action
```

---

## 3. Finance Review Implementation Flow
Finance review typically follows or runs parallel to Legal review.

```mermaid
stateDiagram-v2
    [*] --> IN_REVIEW : Submit Action
    IN_REVIEW --> FINANCE_REVIEW_IN_PROGRESS : Legal Already Approved
    
    FINANCE_REVIEW_IN_PROGRESS --> APPROVED : Finance Approves
    FINANCE_REVIEW_IN_PROGRESS --> REVISION_REQUESTED : Request Revision Action
    FINANCE_REVIEW_IN_PROGRESS --> REJECTED : Reject Action
```

---

## 4. The "Gatekeeper" Logic (Backend)
The `ApprovalsService` uses a specific priority to determine the contract status when any approval is processed:

1.  **Priority 1**: If **LEGAL** is still `PENDING` -> Status is **`SENT_TO_LEGAL`**.
2.  **Priority 2**: If **FINANCE** is still `PENDING` -> Status is **`FINANCE_REVIEW_IN_PROGRESS`**.
3.  **Completion**: If all required approvals are `APPROVED` -> Status is **`APPROVED`**.

---

## Code vs PRD Discrepancies

| Feature | PRD Specification | Code Implementation |
|---------|-------------------|---------------------|
| **Submit Entry State** | `SENT_TO_LEGAL` | `IN_REVIEW` |
| **Escalation State** | `ESCALATED_TO_HEAD` | `PENDING_LEGAL_HEAD` |
| **Finance State** | Parallel Track (No blocking) | Serial Logic (`FINANCE_REVIEW_IN_PROGRESS` follows Legal) |
| **Rejection** | "No rejection button" | Hard `REJECTED` state and button exists |
| **Cancellation** | Not explicitly mentioned in flow | `CANCELLED` status exists and is available |

> [!NOTE]
> The codebase implements a more rigid state machine than the PRD implies, especially regarding the priority of Legal over Finance review in the displayed status.
