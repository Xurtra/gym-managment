import { LeadStage, MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { createGym, fixedClock, testConfig } from "../../testUtils.js";
import { MigrationImportService } from "./migrationImport.service.js";

describe("MigrationImportService", () => {
  it("previews and imports a member CSV into consumer records", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const csv = [
      "Member Name,Email,Phone,Keytag,Status,Notes,Tags",
      "\"Maya Rivera\",maya@example.com,555-0101,AA100,Active,\"Prefers mornings\",\"vip;founder\"",
      "\"Lee Prospect\",lee@example.com,555-0102,AA101,Lead,\"Booked a tour\",\"tour\""
    ].join("\n");
    const upload = {
      fileName: "members.csv",
      contentType: "text/csv",
      base64Data: Buffer.from(csv, "utf8").toString("base64"),
      delimiter: "auto" as const
    };

    const preview = await services.migrationImportService.previewMemberListCsv(gymId, upload);
    expect(preview.mapping.fullName).toBe("Member Name");
    expect(preview.mapping.barcode).toBe("Keytag");
    expect(preview.summary.validRows).toBe(2);

    const result = await services.migrationImportService.importMemberListCsv(gymId, upload);
    expect(result.summary.importedRows).toBe(2);
    expect(result.summary.skippedRows).toBe(0);

    const consumers = await services.memberService.list(gymId);
    expect(consumers).toHaveLength(2);
    const lead = consumers.find((consumer) => consumer.email === "lee@example.com");
    expect(lead?.status).toBe(MemberStatus.Active);
    expect(lead?.leadStage).toBe(LeadStage.Open);
    expect(lead?.isLead).toBe(true);
  });

  it("marks duplicate emails as skipped before importing", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    await services.memberService.create(gymId, {
      firstName: "Existing",
      lastName: "Member",
      email: "maya@example.com",
      status: MemberStatus.Active,
      tagNames: []
    });
    const csv = ["First Name,Last Name,Email", "Maya,Rivera,maya@example.com"].join("\n");

    const preview = await services.migrationImportService.previewMemberListCsv(gymId, {
      fileName: "members.csv",
      contentType: "text/csv",
      base64Data: Buffer.from(csv, "utf8").toString("base64"),
      delimiter: "auto"
    });

    expect(preview.summary.validRows).toBe(0);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(/already exists/i);
  });

  it("falls back to deterministic mapping when AI is not configured", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const csv = ["First Name,Last Name,Email", "Maya,Rivera,maya@example.com"].join("\n");

    const suggestion = await services.migrationImportService.suggestMemberListCsvMapping(gymId, {
      fileName: "members.csv",
      contentType: "text/csv",
      base64Data: Buffer.from(csv, "utf8").toString("base64"),
      delimiter: "auto"
    });

    expect(suggestion.available).toBe(false);
    expect(suggestion.provider).toBe("deterministic");
    expect(suggestion.mapping.firstName).toBe("First Name");
    expect(suggestion.preview.summary.validRows).toBe(1);
  });

  it("uses AI-suggested headers after validating them against the CSV", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const csv = ["Given,Family,Contact Email,Scan Code", "Maya,Rivera,maya@example.com,AA100"].join("\n");
    const aiService = new MigrationImportService(services.repositories, services.memberService, {
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: async () =>
        new Response(JSON.stringify({
          output_text: JSON.stringify({
            category: "memberList",
            confidence: 0.93,
            mapping: {
              firstName: "Given",
              lastName: "Family",
              fullName: "",
              email: "Contact Email",
              phone: "",
              barcode: "Scan Code",
              status: "",
              leadStage: "",
              notes: "",
              tags: "",
              emergencyContactName: "",
              emergencyContactPhone: "",
              emergencyContactRelationship: ""
            },
            warnings: [],
            notes: ["Mapped nonstandard export headers."]
          })
        }), { status: 200, headers: { "Content-Type": "application/json" } })
    });

    const suggestion = await aiService.suggestMemberListCsvMapping(gymId, {
      fileName: "members.csv",
      contentType: "text/csv",
      base64Data: Buffer.from(csv, "utf8").toString("base64"),
      delimiter: "auto"
    });

    expect(suggestion.available).toBe(true);
    expect(suggestion.mapping.firstName).toBe("Given");
    expect(suggestion.mapping.barcode).toBe("Scan Code");
    expect(suggestion.preview.summary.validRows).toBe(1);
  });
});
