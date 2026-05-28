import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";
import { MigrationAssistantService } from "./migrationAssistant.service.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("MigrationAssistantService", () => {
  it("creates batches, uploads CSV metadata, and deletes files before staging", async () => {
    const { service, gymId, ownerUserId } = await setupMigrationAssistant();
    const batch = await service.createBatch(gymId, ownerUserId);
    const csv = [
      "First Name,Last Name,Email,Membership Status",
      "Maya,Rivera,maya@example.com,Active",
      "Jordan,Lee,jordan@example.com,Frozen"
    ].join("\n");

    const upload = await service.uploadFile(gymId, batch.id, ownerUserId, csvUpload("members.csv", csv));

    expect(upload.file.originalFilename).toBe("members.csv");
    expect(upload.file.rowCount).toBe(2);
    expect(upload.file.columnHeaders).toEqual(["First Name", "Last Name", "Email", "Membership Status"]);
    expect(upload.file.sampleRows[0]).toMatchObject({ Email: "maya@example.com" });
    expect(upload.file.fileType).toBe("unknown");

    const files = await service.listFiles(gymId, batch.id);
    expect(files.files).toHaveLength(1);

    await service.deleteFile(gymId, batch.id, upload.file.id, ownerUserId);
    const remaining = await service.listFiles(gymId, batch.id);
    expect(remaining.files).toHaveLength(0);
  });

  it("saves high-confidence AI file type detection and audit logs", async () => {
    const { service, repositories, gymId, ownerUserId } = await setupMigrationAssistant({
      apiKey: "test-key",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              file_type: "members",
              confidence: 0.94,
              reason: "Contains member names, emails, phone numbers, and membership status."
            })
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
    });
    const batch = await service.createBatch(gymId, ownerUserId);
    const upload = await service.uploadFile(
      gymId,
      batch.id,
      ownerUserId,
      csvUpload("club_members.csv", "Name,Email,Phone\nMaya Rivera,maya@example.com,555-0101")
    );

    const result = await service.detectFileType(gymId, batch.id, upload.file.id, ownerUserId);

    expect(result.file.fileType).toBe("members");
    expect(result.file.detectedFileType).toBe("members");
    expect(result.file.fileTypeConfidence).toBe(0.94);
    expect(result.file.status).toBe("confirmed");
    const logs = await repositories.migrationAuditLogs.listMigrationAuditLogsForBatch(batch.id);
    expect(logs.some((log) => log.action === "migration_file_type_detected")).toBe(true);
  });

  it("requires review for low confidence detection and allows a manual override", async () => {
    const { service, gymId, ownerUserId } = await setupMigrationAssistant({
      apiKey: "test-key",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              file_type: "staff",
              confidence: 0.42,
              reason: "The headers are ambiguous."
            })
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
    });
    const batch = await service.createBatch(gymId, ownerUserId);
    const upload = await service.uploadFile(
      gymId,
      batch.id,
      ownerUserId,
      csvUpload("people.csv", "Name,Email,Role\nAlex Staff,alex@example.com,Trainer")
    );

    const detected = await service.detectFileType(gymId, batch.id, upload.file.id, ownerUserId);
    expect(detected.file.fileType).toBe("unknown");
    expect(detected.file.status).toBe("needs_review");

    const overridden = await service.overrideFileType(gymId, batch.id, upload.file.id, ownerUserId, {
      fileType: "staff"
    });
    expect(overridden.file.fileType).toBe("staff");
    expect(overridden.file.status).toBe("confirmed");
  });

  it("generates, stores, edits, and approves AI column mappings", async () => {
    const { service, repositories, gymId, ownerUserId } = await setupMigrationAssistant({
      apiKey: "test-key",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              column_mappings: [
                { source_column: "Client Name", target_field: "full_name", confidence: 0.95 },
                { source_column: "Email Address", target_field: "email", confidence: 0.98 },
                { source_column: "Internal Notes", target_field: "notes", confidence: 0.82 }
              ],
              requires_human_review: false
            })
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
    });
    const batch = await service.createBatch(gymId, ownerUserId);
    const upload = await service.uploadFile(
      gymId,
      batch.id,
      ownerUserId,
      csvUpload("members.csv", "Client Name,Email Address,Internal Notes\nMaya Rivera,maya@example.com,VIP")
    );
    await service.overrideFileType(gymId, batch.id, upload.file.id, ownerUserId, { fileType: "members" });

    const generated = await service.generateColumnMappings(gymId, batch.id, upload.file.id, ownerUserId);

    expect(generated.targetFields).toContain("full_name");
    expect(generated.mappings.find((mapping) => mapping.sourceColumn === "Client Name")?.targetField).toBe("full_name");
    expect(generated.mappings.find((mapping) => mapping.sourceColumn === "Email Address")?.confidence).toBe(0.98);
    expect(generated.requiresHumanReview).toBe(true);
    expect(await repositories.migrationColumnMappings.listMigrationColumnMappingsForFile(upload.file.id)).toHaveLength(3);

    const approved = await service.updateColumnMappings(gymId, batch.id, upload.file.id, ownerUserId, {
      approve: true,
      mappings: generated.mappings.map((mapping) => ({
        sourceColumn: mapping.sourceColumn,
        targetField: mapping.targetField ?? "ignore"
      }))
    });

    expect(approved.mappings.every((mapping) => mapping.approved)).toBe(true);
    expect(approved.requiresHumanReview).toBe(false);
  });

  it("flags duplicate target fields and blocks approval until fixed", async () => {
    const { service, gymId, ownerUserId } = await setupMigrationAssistant();
    const batch = await service.createBatch(gymId, ownerUserId);
    const upload = await service.uploadFile(
      gymId,
      batch.id,
      ownerUserId,
      csvUpload("members.csv", "First Name,Backup First Name,Email\nMaya,M,mayar@example.com")
    );
    await service.overrideFileType(gymId, batch.id, upload.file.id, ownerUserId, { fileType: "members" });

    const saved = await service.updateColumnMappings(gymId, batch.id, upload.file.id, ownerUserId, {
      mappings: [
        { sourceColumn: "First Name", targetField: "first_name" },
        { sourceColumn: "Backup First Name", targetField: "first_name" },
        { sourceColumn: "Email", targetField: "email" }
      ]
    });

    expect(saved.issues.some((issue) => issue.code === "duplicate_target_field")).toBe(true);
    await expect(
      service.updateColumnMappings(gymId, batch.id, upload.file.id, ownerUserId, {
        approve: true,
        mappings: [
          { sourceColumn: "First Name", targetField: "first_name" },
          { sourceColumn: "Backup First Name", targetField: "first_name" },
          { sourceColumn: "Email", targetField: "email" }
        ]
      })
    ).rejects.toThrow(/critical mapping issues/i);
  });

  it("stages approved member mappings without importing production members", async () => {
    const { service, repositories, gymId, ownerUserId } = await setupMigrationAssistant();
    const batch = await service.createBatch(gymId, ownerUserId);
    const upload = await service.uploadFile(
      gymId,
      batch.id,
      ownerUserId,
      csvUpload(
        "members.csv",
        [
          "Client Name,Email,Phone,Status,Plan,Next Billing,Tags",
          "Maya Rivera,MAYA@EXAMPLE.COM,(555) 010-0001,Active,Monthly Unlimited,06/15/2026,vip|founder"
        ].join("\n")
      )
    );
    await service.overrideFileType(gymId, batch.id, upload.file.id, ownerUserId, { fileType: "members" });
    await service.updateColumnMappings(gymId, batch.id, upload.file.id, ownerUserId, {
      approve: true,
      mappings: [
        { sourceColumn: "Client Name", targetField: "full_name" },
        { sourceColumn: "Email", targetField: "email" },
        { sourceColumn: "Phone", targetField: "phone" },
        { sourceColumn: "Status", targetField: "membership_status" },
        { sourceColumn: "Plan", targetField: "membership_plan_name" },
        { sourceColumn: "Next Billing", targetField: "next_billing_date" },
        { sourceColumn: "Tags", targetField: "tags" }
      ]
    });

    const staged = await service.stageMemberFile(gymId, batch.id, upload.file.id, ownerUserId);

    expect(staged.stagedMembers).toHaveLength(1);
    expect(staged.stagedMembers[0]).toMatchObject({
      firstName: "Maya",
      lastName: "Rivera",
      fullName: "Maya Rivera",
      email: "maya@example.com",
      phone: "5550100001",
      tagsJson: ["vip", "founder"],
      validationStatus: "ready",
      approved: false
    });
    expect(staged.validationErrors).toHaveLength(0);
    expect(await repositories.members.listMembersForGym(gymId)).toHaveLength(0);
    const logs = await repositories.migrationAuditLogs.listMigrationAuditLogsForBatch(batch.id);
    expect(logs.some((log) => log.action === "migration_members_staged")).toBe(true);
  });

  it("creates validation errors for unsafe staged member rows", async () => {
    const { service, gymId, ownerUserId } = await setupMigrationAssistant();
    const batch = await service.createBatch(gymId, ownerUserId);
    const upload = await service.uploadFile(
      gymId,
      batch.id,
      ownerUserId,
      csvUpload(
        "members.csv",
        [
          "Client Name,Email,Phone,Status,Plan,Cancellation Date",
          "Maya Rivera,dup@example.com,555-0101,Active,,",
          "Jordan Lee,dup@example.com,555-0101,Active,Monthly,05/01/2026",
          ",bad-email,555-0202,Active,Monthly,"
        ].join("\n")
      )
    );
    await service.overrideFileType(gymId, batch.id, upload.file.id, ownerUserId, { fileType: "members" });
    await service.updateColumnMappings(gymId, batch.id, upload.file.id, ownerUserId, {
      approve: true,
      mappings: [
        { sourceColumn: "Client Name", targetField: "full_name" },
        { sourceColumn: "Email", targetField: "email" },
        { sourceColumn: "Phone", targetField: "phone" },
        { sourceColumn: "Status", targetField: "membership_status" },
        { sourceColumn: "Plan", targetField: "membership_plan_name" },
        { sourceColumn: "Cancellation Date", targetField: "cancellation_date" }
      ]
    });

    const staged = await service.stageMemberFile(gymId, batch.id, upload.file.id, ownerUserId);
    const errorCodes = staged.validationErrors.map((error) => error.errorCode);

    expect(errorCodes).toContain("duplicate_email");
    expect(errorCodes).toContain("duplicate_phone");
    expect(errorCodes).toContain("active_member_plan_missing");
    expect(errorCodes).toContain("active_member_has_cancellation_date");
    expect(errorCodes).toContain("member_name_missing");
    expect(errorCodes).toContain("member_email_invalid");
    expect(staged.summary.critical).toBeGreaterThan(0);
    expect(staged.validationErrors.filter((error) => error.severity === "warning")).not.toHaveLength(0);
    await expect(
      service.approveStagedMember(gymId, batch.id, staged.stagedMembers[0]?.id ?? "", ownerUserId)
    ).rejects.toThrow(/critical validation errors/i);
  });

  it("rejects files that are not CSV or XLSX", async () => {
    const { service, gymId, ownerUserId } = await setupMigrationAssistant();
    const batch = await service.createBatch(gymId, ownerUserId);

    await expect(
      service.uploadFile(gymId, batch.id, ownerUserId, {
        fileName: "members.txt",
        contentType: "text/plain",
        base64Data: Buffer.from("Name\nMaya", "utf8").toString("base64")
      })
    ).rejects.toThrow(/CSV or XLSX/);
  });
});

async function setupMigrationAssistant(options: ConstructorParameters<typeof MigrationAssistantService>[2] = {}) {
  const services = createServices(testConfig, fixedClock);
  const owner = await services.authService.register({
    email: `owner-${randomUUID()}@example.com`,
    password: "Password123",
    firstName: "Demo",
    lastName: "Owner",
    gymName: "Demo Strength Club",
    timezone: "America/New_York",
    locale: "en-US"
  });
  if (!owner.gym) {
    throw new Error("Expected gym to be created during test setup.");
  }
  const storageRoot = await mkdtemp(path.join(tmpdir(), "migration-assistant-"));
  tempRoots.push(storageRoot);
  return {
    service: new MigrationAssistantService(services.repositories, fixedClock, options, storageRoot),
    repositories: services.repositories,
    gymId: owner.gym.id,
    ownerUserId: owner.user.id
  };
}

function csvUpload(fileName: string, csv: string) {
  return {
    fileName,
    contentType: "text/csv",
    base64Data: Buffer.from(csv, "utf8").toString("base64")
  };
}
