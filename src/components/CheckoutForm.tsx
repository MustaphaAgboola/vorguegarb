"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { ProductImage } from "./ProductImage";

type Props = {
  defaultName: string;
  email: string;
};

type Fields = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes: string;
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

/** Mirrors the server schema in /api/orders so users get instant feedback. */
function validate(fields: Fields) {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (fields.fullName.trim().length < 2) errors.fullName = "Please enter your full name.";
  if (fields.phone.trim().length < 7) errors.phone = "Enter a valid phone number.";
  if (fields.address.trim().length < 5) errors.address = "Enter your delivery address.";
  if (fields.city.trim().length < 2) errors.city = "Enter your city.";
  if (fields.state.trim().length < 2) errors.state = "Select or enter your state.";
  if (fields.notes.trim().length > 500) errors.notes = "Notes must be 500 characters or fewer.";
  return errors;
}

export function CheckoutForm({ defaultName, email }: Props) {
  const router = useRouter();
  const { items, subtotal, loading } = useCart();

  const [fields, setFields] = useState<Fields>({
    fullName: defaultName,
    phone: "",
    address: "",
    city: "",
    state: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || items.length === 0) return;

    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fields.fullName.trim(),
          phone: fields.phone.trim(),
          address: fields.address.trim(),
          city: fields.city.trim(),
          state: fields.state.trim(),
          notes: fields.notes.trim(),
          items: items.map((i) => ({
            productId: i.product_id,
            size: i.size || null,
            quantity: i.quantity,
          })),
        }),
      });

      // Session expired mid-checkout: send them back through login.
      if (res.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        orderId?: string;
        error?: string;
      };

      if (!res.ok || !data.orderId) {
        setFormError(data.error ?? "Could not place your order. Please try again.");
        setSubmitting(false);
        return;
      }

      // The order API empties the DB cart; the provider syncs via Realtime.
      router.push(`/orders/${data.orderId}/success`);
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-stone-600">Add a piece before checking out.</p>
        <Link href="/shop" className="btn-accent mt-6">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="label">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="name"
              className="field"
              value={fields.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName ? (
              <p id="fullName-error" className="mt-1 text-sm text-red-600">
                {errors.fullName}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0801 234 5678"
              className="field"
              value={fields.phone}
              onChange={(e) => update("phone", e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone ? (
              <p id="phone-error" className="mt-1 text-sm text-red-600">
                {errors.phone}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="field bg-stone-100 text-stone-500"
              value={email}
              readOnly
              aria-describedby="email-hint"
            />
            <p id="email-hint" className="mt-1 text-xs text-stone-500">
              Your confirmation is sent to this Google address.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="label">
              Delivery address
            </label>
            <input
              id="address"
              name="address"
              autoComplete="street-address"
              className="field"
              value={fields.address}
              onChange={(e) => update("address", e.target.value)}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
            {errors.address ? (
              <p id="address-error" className="mt-1 text-sm text-red-600">
                {errors.address}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="city" className="label">
              City
            </label>
            <input
              id="city"
              name="city"
              autoComplete="address-level2"
              className="field"
              value={fields.city}
              onChange={(e) => update("city", e.target.value)}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "city-error" : undefined}
            />
            {errors.city ? (
              <p id="city-error" className="mt-1 text-sm text-red-600">
                {errors.city}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="state" className="label">
              State
            </label>
            <input
              id="state"
              name="state"
              list="ng-states"
              autoComplete="address-level1"
              className="field"
              value={fields.state}
              onChange={(e) => update("state", e.target.value)}
              aria-invalid={Boolean(errors.state)}
              aria-describedby={errors.state ? "state-error" : undefined}
            />
            <datalist id="ng-states">
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {errors.state ? (
              <p id="state-error" className="mt-1 text-sm text-red-600">
                {errors.state}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="label">
              Notes <span className="font-normal text-stone-500">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Measurements or customisation requests"
              className="field resize-y"
              value={fields.notes}
              onChange={(e) => update("notes", e.target.value)}
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? "notes-error" : undefined}
            />
            {errors.notes ? (
              <p id="notes-error" className="mt-1 text-sm text-red-600">
                {errors.notes}
              </p>
            ) : null}
          </div>
        </div>

        {formError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className="btn-accent w-full sm:w-auto">
          {submitting ? "Placing order…" : "Place order"}
        </button>
        <p className="text-xs text-stone-500">
          Pay on delivery. No payment is taken on this site.
        </p>
      </form>

      <aside className="h-fit rounded-xl border border-stone-200 bg-white p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-semibold">Order summary</h2>

        {loading ? (
          <p className="mt-4 text-sm text-stone-500" aria-busy="true">
            Loading your cart…
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li
                  key={`${item.product_id}::${item.size}`}
                  className="flex items-center gap-3"
                >
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-stone-100">
                    <ProductImage
                      src={item.products.image_url}
                      alt={item.products.name}
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{item.products.name}</p>
                    <p className="text-stone-500">
                      {item.size ? `${item.size} · ` : ""}Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatNaira(item.products.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-600">Subtotal</dt>
                <dd className="font-medium">{formatNaira(subtotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold">{formatNaira(subtotal)}</dd>
              </div>
            </dl>
          </>
        )}
      </aside>
    </div>
  );
}
