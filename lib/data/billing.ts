import { invoices, packages } from "../mock-data";
import type { Invoice, Package } from "../types";

export function listPackages(): Package[] {
  return packages
    .slice()
    .sort((a, b) => (a.expiresOn ?? "").localeCompare(b.expiresOn ?? ""));
}

export function listInvoices(): Invoice[] {
  return invoices
    .slice()
    .sort((a, b) => (b.issuedOn ?? "").localeCompare(a.issuedOn ?? ""));
}
