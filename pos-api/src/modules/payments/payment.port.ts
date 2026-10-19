export interface ChargeRequest {
  saleId: string;
  amountMinorUnits: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ChargeResult {
  status: 'SUCCESS' | 'FAILED';
  providerReference: string;
  rawResponse: Record<string, unknown>;
  failureReason?: string;
}

export const PAYMENT_PORT = Symbol('PAYMENT_PORT');

export interface PaymentPort {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
