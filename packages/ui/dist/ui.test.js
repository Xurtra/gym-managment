import { describe, expect, it } from "vitest";
import { button, captureErrorBoundary, emptyState, errorState, input, layout, loadingState, modal, table } from "./index.js";
describe("shared UI models", () => {
    it("builds stable primitive models", () => {
        const save = button({ label: "Save", icon: "save" });
        const field = input({
            name: "email",
            label: "Email",
            value: "owner@example.com",
            type: "email",
            required: true
        });
        const rows = table({
            columns: [{ key: "name", label: "Name" }],
            rows: [{ name: "Main Floor" }],
            empty: emptyState({ title: "No rows" })
        });
        const dialog = modal({ title: "Confirm", open: true, body: "Archive?", actions: [save] });
        const page = layout({
            title: "Dashboard",
            navItems: [{ label: "Home", href: "/", active: true }]
        });
        expect(save.intent).toBe("primary");
        expect(field.kind).toBe("input");
        expect(rows.rows).toHaveLength(1);
        expect(dialog.actions[0]?.label).toBe("Save");
        expect(page.navItems[0]?.active).toBe(true);
        expect(loadingState().label).toBe("Loading");
        expect(errorState({ title: "Error", message: "Nope" }).kind).toBe("error");
    });
    it("captures error boundary state", () => {
        const boundary = captureErrorBoundary(new Error("Broken render"));
        expect(boundary.hasError).toBe(true);
        expect(boundary.error?.message).toBe("Broken render");
        expect(boundary.error?.retry?.label).toBe("Try again");
    });
});
//# sourceMappingURL=ui.test.js.map