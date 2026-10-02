// Money is stored as an integer in naira (see AGENTS.md).
const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const formatNaira = (amount: number) => naira.format(amount);

/** Short, human-friendly order reference used on pages and in emails. */
export const shortOrderId = (id: string) => id.slice(0, 8).toUpperCase();

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(iso));
