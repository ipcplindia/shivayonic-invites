import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/zoho", () => ({
  ZohoError: class ZohoError extends Error { constructor(code: string) { super(code); } },
  zohoBooksFetch: mocks.fetch,
}));

import { configureZohoPlanCatalog, discoverZohoPlanConfiguration } from "@/core/zoho-plan-catalog";

const taxes = { taxes: [{ tax_id: "gst18", tax_name: "GST18", tax_percentage: 18, tax_type: "tax_group" }, { tax_id: "igst18", tax_name: "IGST18", tax_percentage: 18, tax_type: "tax" }] };
const templates = { templates: [{ template_id: "template-1", template_name: "Shivayonic Invites Invoice" }] };
const tags = { reporting_tags: [{ tag_id: "tag-1", tag_name: "Business Unit" }] };
const option = { reporting_tag: { options: [{ tag_option_id: "option-1", tag_option_name: "Shivayonic Invites" }] } };
const plans = [["Silver", 50000], ["Gold", 75000], ["Platinum", 100000], ["Custom", 0]] as const;

describe("Zoho plan catalog", () => {
  beforeEach(() => vi.resetAllMocks());

  it("creates only missing exact-name service items, then re-reads them", async () => {
    mocks.fetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === "/settings/taxes") return taxes;
      if (path === "/invoices/templates") return templates;
      if (path === "/reportingtags") return tags;
      if (path === "/settings/preferences") return { is_inclusive_tax: true };
      if (path === "/reportingtags/tag-1") return option;
      if (path.startsWith("/items?")) return { items: [] };
      if (path === "/items" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        expect(body).toEqual(expect.objectContaining({ product_type: "service", is_taxable: true, hsn_or_sac: "998391", tax_id: "gst18" }));
        return { item: { item_id: `item-${body.name}`, ...body } };
      }
      if (path.startsWith("/items/item-")) {
        const name = decodeURIComponent(path.slice("/items/item-".length));
        const plan = plans.find(([label]) => `Shivayonic ${label} Package` === name)!;
        return { item: { item_id: `item-${name}`, name, rate: plan[1], hsn_or_sac: "998391", is_taxable: true, tax_id: "gst18" } };
      }
      throw new Error(`unexpected ${path}`);
    });
    const result = await configureZohoPlanCatalog();
    expect(result.items.map(item => [item.name, item.rate])).toEqual(plans.map(([label, rate]) => [`Shivayonic ${label} Package`, rate]));
    expect(mocks.fetch.mock.calls.filter(([path, init]) => path === "/items" && init?.method === "POST")).toHaveLength(4);
    expect(result.transactionSeries).toBe("NOT_API_CONFIGURABLE");
  });

  it("treats a top-level inclusive preference as informational metadata", async () => {
    mocks.fetch.mockImplementation(async (path: string) => path === "/settings/preferences" ? { is_inclusive_tax: true } : path === "/settings/taxes" ? taxes : path === "/invoices/templates" ? templates : path === "/reportingtags" ? tags : option);
    const result = await discoverZohoPlanConfiguration();
    expect(result.taxInclusionPreference).toBe(true);
    expect(result.invoiceInclusiveTaxStrategy).toBe("EXPLICIT_INVOICE_FLAG");
  });

  it("accepts nested Zoho tax-inclusion preference", async () => {
    mocks.fetch.mockImplementation(async (path: string) => path === "/settings/preferences" ? { tax_settings: { is_tax_inclusive: true } } : path === "/settings/taxes" ? taxes : path === "/invoices/templates" ? templates : path === "/reportingtags" ? tags : option);
    const result = await discoverZohoPlanConfiguration();
    expect(result.taxes.intraState.name).toBe("GST18");
    expect(result.taxInclusionPreference).toBe(true);
  });

  it("passes when Zoho exposes no recognizable account preference", async () => {
    mocks.fetch.mockImplementation(async (path: string) => path === "/settings/preferences" ? { preferences: {} } : path === "/settings/taxes" ? taxes : path === "/invoices/templates" ? templates : path === "/reportingtags" ? tags : option);
    const result = await discoverZohoPlanConfiguration();
    expect(result.taxInclusionPreference).toBeNull();
    expect(result.invoiceInclusiveTaxStrategy).toBe("EXPLICIT_INVOICE_FLAG");
  });

  it("keeps GST, template, and tag validation strict", async () => {
    mocks.fetch.mockImplementation(async (path: string) => path === "/settings/preferences" ? {} : path === "/settings/taxes" ? { taxes: [] } : path === "/invoices/templates" ? templates : path === "/reportingtags" ? tags : option);
    await expect(discoverZohoPlanConfiguration()).rejects.toThrow();
  });
});
