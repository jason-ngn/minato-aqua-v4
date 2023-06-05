export interface NodeType {
  name: string;
  host: string;
  port: number;
  password: string;
  secure?: boolean;
}

export interface Plan {
  product_id: string;
  name: string;
  status?: 'CREATED' | 'ACTIVE' | 'INACTIVE';
  description?: string;
  billing_cycles?: BillingCycle[];
  quantity_supported?: boolean;
  payment_preferences: PaymentPreferences;
  taxes?: Tax
}

export type OperationCode = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test' | ''

export interface UpdateOperation {
  op: OperationCode;
  path?: string;
  value?: any;
  from?: string;
}

export interface PaymentPreferences {
  auto_bill_outstanding?: boolean;
  setup_fee_failure_action?: 'CANCEL' | 'CONTINUE';
  payment_failure_threshold?: number;
  setup_fee?: Price;
}

export interface Tax {
  inclusive?: boolean;
  percentage: string;
}

export interface BillingCycle {
  tenure_type: 'REGULAR' | 'TRIAL';
  sequence: number;
  total_cycles: number;
  pricing_scheme: PricingScheme;
  frequency: Frequency;
}

export interface PricingScheme {
  pricing_model?: 'VOLUME' | 'TIRED';
  tiers?: Tier[];
  fixed_price: Price;
}

export interface Tier {
  starting_quantity: string;
  ending_quantity: string;
  amount: Price
}

export interface Price {
  currency_code: string;
  value: string;
}

export interface Frequency {
  interval_unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  interval_count: number;
}

export interface Subscription {
  plan_id: string;
  quantity?: string;
  custom_id?: string;
  start_time?: string;
  shipping_amount?: Price;
  subscriber?: Subscriber;
  application_context?: ApplicationContext;
  plan?: {
    billing_cycles?: BillingCycle[];
    payment_preferences?: PaymentPreferences;
    taxes?: Tax
  }
}

export interface ApplicationContext {
  brand_name?: string;
  shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ACCESS'
  user_action?: 'CONTINUE' | 'SUBSCRIBE_NOW';
  return_url: string;
  cancel_url: string;
  locale?: string;
  payment_method?: PaymentMethod;
}

export interface PaymentMethod {
  payer_selected?: 'PAYPAL';
  payee_preferred?: 'UNRESTRICTED' | 'IMMEDIATE_PAYMENT_REQUIRED'
}

export interface Subscriber {
  email_address?: string;
  name?: Name;
  phone?: {
    phone_type?: 'FAX' | 'HOME' | 'MOBILE' | 'OTHER' | 'PAGER';
    phone_number: {
      national_number: string;
    }
  };
  shipping_address?: {
    type?: 'SHIPPING' | 'PICKUP_IN_PERSON';
    name?: Name;
    address?: Address;
  }
  payment_source?: PaymentSource;
}

export interface Name {
  given_name?: string;
  surname?: string;
}

export interface Address {
  address_line_1?: string;
  address_line_2?: string;
  admin_area_2?: string;
  admin_area_1?: string;
  postal_code?: string;
  country_code: string;
}

export interface PaymentSource {
  card?: Card;
}

export interface Card {
  name?: string;
  number: string;
  security_code?: string;
  expiry: string;
  billing_address?: Address;
}

export enum SubscriptionStatus {
  Active = "ACTIVE",
  Cancelled = 'CANCELLED'
}