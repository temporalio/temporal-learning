
export type Customer = {
  FirstName: string;
  LastName: string;
  Email: string;
  Subscription: {
    TrialPeriod: number;
    BillingPeriod: number;
    MaxBillingPeriods: number;
    initialBillingPeriodCharge: number;
  };
  Id: string;
};