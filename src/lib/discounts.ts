import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  event_type_id: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

export type DiscountCheck =
  | {
      ok: true;
      code: string;
      label: string;
      discountGbp: number;
      finalGbp: number;
    }
  | { ok: false; error: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Single source of truth for discount validation — used both by the
 * "apply code" endpoint and by checkout, so the price a member is shown is
 * always the price they are charged. Codes are never sent to the browser;
 * only the computed result is.
 */
export async function validateDiscount(
  admin: SupabaseClient,
  rawCode: string,
  eventTypeId: string,
  priceGbp: number
): Promise<DiscountCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a discount code." };

  const { data } = await admin
    .from("coach_discount_codes")
    .select("*")
    .ilike("code", code)
    .maybeSingle();

  const discount = data as DiscountCode | null;

  // Same message whether the code is missing, expired or used up, so the
  // form can't be used to probe which codes exist.
  const invalid = { ok: false as const, error: "That discount code isn't valid." };
  if (!discount || !discount.active) return invalid;

  const now = Date.now();
  if (discount.valid_from && new Date(discount.valid_from).getTime() > now) {
    return invalid;
  }
  if (discount.valid_until && new Date(discount.valid_until).getTime() < now) {
    return { ok: false, error: "That discount code has expired." };
  }
  if (
    discount.max_redemptions !== null &&
    discount.times_redeemed >= discount.max_redemptions
  ) {
    return { ok: false, error: "That discount code has been fully redeemed." };
  }
  if (discount.event_type_id && discount.event_type_id !== eventTypeId) {
    return { ok: false, error: "That code doesn't apply to this session." };
  }
  if (priceGbp <= 0) {
    return { ok: false, error: "This session is already free." };
  }

  const value = Number(discount.discount_value);
  const rawDiscount =
    discount.discount_type === "percent" ? (priceGbp * value) / 100 : value;

  // never discount below zero
  const discountGbp = round2(Math.min(rawDiscount, priceGbp));

  return {
    ok: true,
    code: discount.code,
    label:
      discount.discount_type === "percent"
        ? `${value % 1 === 0 ? value.toFixed(0) : value}% off`
        : `£${value.toFixed(2)} off`,
    discountGbp,
    finalGbp: round2(priceGbp - discountGbp),
  };
}
