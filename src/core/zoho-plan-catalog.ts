import "server-only";

import { ZohoError, zohoBooksFetch } from "@/lib/zoho";

const PLANS = [
  { key: "SILVER", name: "Shivayonic Silver Package", rate: 50_000 },
  { key: "GOLD", name: "Shivayonic Gold Package", rate: 75_000 },
  { key: "PLATINUM", name: "Shivayonic Platinum Package", rate: 100_000 },
  { key: "CUSTOM", name: "Shivayonic Custom Package", rate: 0 },
] as const;

type Tax = { tax_id?: string; tax_name?: string; tax_percentage?: number | string; tax_type?: string; tax_specific_type?: string };
type ReportingTag = { tag_id?: string; tag_name?: string };
type Item = { item_id?: string; name?: string; rate?: number; hsn_or_sac?: string; is_taxable?: boolean; tax_id?: string; tax_name?: string; tax_percentage?: number | string; item_tax_preferences?: Array<{ tax_id?: string; tax_specification?: string }> };

export type ZohoPlanCatalog = {
  items: Array<{ key: string; itemId: string; name: string; rate: number; sac: string; taxable: boolean; taxId: string; inclusive: true }>;
  taxes: { intraState: { id: string; name: string; rate: number | string; type?: string }; interState: { id: string; name: string; rate: number | string; type?: string } };
  template: { id: string; name: string };
  businessUnit: { tagId: string; tagOptionId: string; name: string };
  taxInclusionPreference: boolean | null;
  invoiceInclusiveTaxStrategy: "EXPLICIT_INVOICE_FLAG";
  transactionSeries: "NOT_API_CONFIGURABLE";
};

export type ZohoPlanConfiguration = Omit<ZohoPlanCatalog, "items" | "transactionSeries">;

function apiFailure(stage = "catalog_item"): never { console.error("Zoho discovery validation failed", { stage }); throw new ZohoError("ZOHO_UNAVAILABLE"); }
function required<T>(value: T | null | undefined, stage?: string): NonNullable<T> { if (value === null || value === undefined) apiFailure(stage); return value as NonNullable<T>; }
function exactTax(taxes: Tax[], name: string) {
  const tax = required(taxes.find(value => value.tax_name?.trim().toLowerCase() === name.toLowerCase() && Number(value.tax_percentage) === 18 && value.tax_id), name === "GST18" ? "GST18" : "IGST18");
  const id = tax.tax_id; const taxName = tax.tax_name;
  if (!id || !taxName) apiFailure();
  return { id, name: taxName, rate: tax.tax_percentage ?? 18, type: tax.tax_type ?? tax.tax_specific_type };
}
function itemResult(item: Item, plan: typeof PLANS[number], intraTax: { id: string }) {
  const itemId = item.item_id; const name = item.name; const sac = item.hsn_or_sac; const taxable = item.is_taxable; const taxId = item.tax_id;
  if (!itemId || name !== plan.name || Number(item.rate) !== plan.rate || sac !== "998391" || taxable !== true || taxId !== intraTax.id) apiFailure();
  return { key: plan.key, itemId, name, rate: Number(item.rate), sac, taxable, taxId, inclusive: true as const };
}

async function readItem(plan: typeof PLANS[number]) {
  const found = await zohoBooksFetch<{ items?: Item[] }>(`/items?search_text=${encodeURIComponent(plan.name)}`);
  const existing = found.items?.find(item => item.name === plan.name && item.item_id);
  if (!existing?.item_id) return null;
  const full = await zohoBooksFetch<{ item?: Item }>(`/items/${encodeURIComponent(existing.item_id)}`);
  return full.item ?? null;
}

async function readOrCreateItem(plan: typeof PLANS[number], intraTax: { id: string }, interTax: { id: string }) {
  let item = await readItem(plan);
  if (!item) {
    const created = await zohoBooksFetch<{ item?: Item }>("/items", { method: "POST", body: JSON.stringify({ name: plan.name, rate: plan.rate, product_type: "service", is_taxable: true, tax_id: intraTax.id, hsn_or_sac: "998391", item_tax_preferences: [{ tax_id: intraTax.id, tax_specification: "intra" }, { tax_id: interTax.id, tax_specification: "inter" }] }) });
    const itemId = created.item?.item_id;
    if (!itemId) apiFailure();
    item = await zohoBooksFetch<{ item?: Item }>(`/items/${encodeURIComponent(itemId)}`).then(value => value.item ?? null);
  }
  return itemResult(required(item), plan, intraTax);
}

/** Creates only exact-name service catalog entries. It cannot create invoices, payments, or contacts. */
/** Read-only configuration discovery; it never creates accounting records. */
export async function discoverZohoPlanConfiguration(): Promise<ZohoPlanConfiguration> {
  const [taxesResult, templateResult, tagsResult, preferencesResult] = await Promise.all([
    zohoBooksFetch<{ taxes?: Tax[] }>("/settings/taxes"),
    zohoBooksFetch<{ templates?: Array<{ template_id?: string; template_name?: string }> }>("/invoices/templates"),
    zohoBooksFetch<{ reporting_tags?: ReportingTag[]; tags?: ReportingTag[] }>("/reportingtags"),
    zohoBooksFetch<Record<string, unknown>>("/settings/preferences").catch(() => ({})),
  ]);
  const preferenceRecord = preferencesResult as Record<string, unknown>;
  const nested = [preferenceRecord.preferences, preferenceRecord.tax_settings, preferenceRecord.settings]
    .filter((value): value is Record<string, unknown> => !!value && typeof value === "object");
  const preferenceValues = [preferenceRecord, ...nested].flatMap(value =>
    [value.is_inclusive_tax, value.is_tax_inclusive, value.is_tax_inclusive_enabled],
  );
  const taxInclusionPreference = preferenceValues.includes(true) ? true : preferenceValues.includes(false) ? false : null;
  const intraState = exactTax(taxesResult.taxes ?? [], "GST18");
  const interState = exactTax(taxesResult.taxes ?? [], "IGST18");
  const templateValue = required(templateResult.templates?.find(template => template.template_name === "Shivayonic Invites Invoice" && template.template_id), "invoice_template");
  const templateId = templateValue.template_id; const templateName = templateValue.template_name;
  if (!templateId || !templateName) apiFailure();
  const reportingTags = tagsResult.reporting_tags ?? tagsResult.tags;
  if (!tagsResult.reporting_tags && tagsResult.tags) console.info("Zoho reporting tag collection", { field: "tags" });
  const tag = required(reportingTags?.find(value => value.tag_name === "Business Unit" && value.tag_id), "business_unit_tag");
  const tagId = tag.tag_id;
  if (!tagId) apiFailure();
  const tagDetail = await zohoBooksFetch<{ results?: Array<{ option_id?: string; option_name?: string }> }>(`/reportingtags/${encodeURIComponent(tagId)}/options/all?tag_id=${encodeURIComponent(tagId)}`);
  const option = required(tagDetail.results?.find(value => value.option_name === "Shivayonic Invites" && value.option_id), "business_unit_option");
  const tagOptionId = option.option_id; const optionName = option.option_name;
  if (!tagOptionId || !optionName) apiFailure();
  return {
    taxes: { intraState, interState },
    template: { id: templateId, name: templateName },
    businessUnit: { tagId, tagOptionId, name: optionName },
    taxInclusionPreference,
    invoiceInclusiveTaxStrategy: "EXPLICIT_INVOICE_FLAG",
  };
}

/** Creates only exact-name service catalog entries. It cannot create invoices, payments, or contacts. */
export async function configureZohoPlanCatalog(): Promise<ZohoPlanCatalog> {
  const configuration = await discoverZohoPlanConfiguration();
  const items = [];
  for (const plan of PLANS) items.push(await readOrCreateItem(plan, configuration.taxes.intraState, configuration.taxes.interState));
  return { items, ...configuration, transactionSeries: "NOT_API_CONFIGURABLE" };
}
