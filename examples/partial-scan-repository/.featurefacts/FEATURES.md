# Workshop Demo feature register

Synthetic fixture. No application was scanned or executed.

Scan outcome: **partial**. The register is bounded by the manifest's declared scope.

## Capabilities

### Resume import (`resume-importer`)

Parse an uploaded text resume into a draft profile.

Recognition: confirmed. Lifecycle: released. Evidence: current.

Documentation: linked-evidence (assessed). Tests: unknown (unassessed).

Source: [src/routes.txt, line 2](../src/routes.txt#L2).

Source: [src/routes.txt, line 3](../src/routes.txt#L3).

### Administrative audit export (`admin-export`)

Export administrative audit events for an operator.

Recognition: confirmed. Lifecycle: implemented. Evidence: current.

Documentation: no-linked-evidence (assessed). Tests: unknown (unassessed).

Source: [internal/admin.txt, line 2](../internal/admin.txt#L2).

### Storage helper candidate (`storage-helper`)

A source helper stores uploaded bytes.

Recognition: candidate. Lifecycle: unknown. Evidence: current.

Documentation: unknown (unassessed). Tests: unknown (unassessed).

Source: [src/storage.txt, line 2](../src/storage.txt#L2).

## Follow-up findings

**waived**: No linked documentation evidence was found for Administrative audit export in the inspected scope.

Review admin-export and add an explicit documentation association, or record a justified waiver.
