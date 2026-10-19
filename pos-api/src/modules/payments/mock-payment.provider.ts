import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChargeRequest, ChargeResult, PaymentPort } from './payment.port';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class MockPaymentProvider implements PaymentPort {
  constructor(private readonly configService: ConfigService) {}

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const delayMs = this.configService.get<number>('MOCK_PAYMENT_DELAY_MS', 50);
    await sleep(delayMs);

    // Deterministic failure control:
    // 1. metadata.simulateFailure=true → always fail (used in tests)
    // 2. MOCK_PAYMENT_FAIL_RATE env → probabilistic failure (default 0)
    const forceFailure = request.metadata?.simulateFailure === true;
    const failRate = parseFloat(
      this.configService.get<string>('MOCK_PAYMENT_FAIL_RATE', '0'),
    );
    const shouldFail = forceFailure || Math.random() < failRate;

    if (shouldFail) {
      return {
        status: 'FAILED',
        providerReference: `mock_fail_${Date.now()}`,
        rawResponse: { error: 'Payment declined by mock provider', code: 'INSUFFICIENT_FUNDS' },
        failureReason: 'INSUFFICIENT_FUNDS',
      };
    }

    return {
      status: 'SUCCESS',
      providerReference: `mock_txn_${Date.now()}_${request.saleId.slice(0, 8)}`,
      rawResponse: { authorized: true, gateway: 'mock', transactionId: `TXN${Date.now()}` },
    };
  }
}
