/**
 * Illustrative milestone rewards catalog. NOT a live commerce/payment
 * integration - real partner deals (bookstores, food delivery, cinemas)
 * are a business-development step, not something honestly buildable in a
 * hackathon timebox. This is the "reward" stage of the cue -> routine ->
 * reward loop the product is built around; shown as example categories so
 * the concept is demoable without pretending it's a live redemption flow.
 */
export const REWARD_MILESTONES = [
  { days: 3, badge: "First Steps", example: "A free e-book on recovery, picked for you" },
  { days: 7, badge: "One Week Strong", example: "10% coupon at a partner food outlet" },
  { days: 14, badge: "Two Weeks In", example: "Movie ticket cashback" },
  { days: 30, badge: "One Month", example: "Larger partner shopping voucher" },
  { days: 90, badge: "Ninety Days", example: "A bigger milestone reward, TBD with partners" },
] as const;

export function nextMilestone(currentStreak: number) {
  return REWARD_MILESTONES.find((m) => m.days > currentStreak) ?? null;
}

export function unlockedMilestones(longestStreak: number) {
  return REWARD_MILESTONES.filter((m) => m.days <= longestStreak);
}
