import { Module } from '@nestjs/common';
import { MockPaymentProvider } from './mock-payment.provider';
import { PAYMENT_PORT } from './payment.port';

@Module({
  providers: [
    MockPaymentProvider,
    {
      provide: PAYMENT_PORT,
      useClass: MockPaymentProvider,
    },
  ],
  exports: [PAYMENT_PORT],
})
export class PaymentsModule {}
