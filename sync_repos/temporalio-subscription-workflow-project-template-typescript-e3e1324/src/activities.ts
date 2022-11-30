// @@@SNIPSTART subscription-ts-activities
import { Customer } from "./types";

export async function sendWelcomeEmail(customer: Customer) {
  console.log(`Sending welcome email to ${customer.Email}`);
}
export async function sendCancellationEmailDuringTrialPeriod(customer: Customer) {
  console.log(`Sending trial cancellation email to ${customer.Email}`);
}
export async function chargeCustomerForBillingPeriod(customer: Customer, chargeAmount: number) {
  console.log(`Charging ${customer.Email} amount ${chargeAmount} for their billing period`);
}
export async function sendCancellationEmailDuringActiveSubscription(customer: Customer) {
  console.log(`Sending active subscriber cancellation email to ${customer.Email}`);
}
export async function sendSubscriptionOverEmail(customer: Customer) {
  console.log(`Sending subscription over email to ${customer.Email}`);
}
// @@@SNIPEND