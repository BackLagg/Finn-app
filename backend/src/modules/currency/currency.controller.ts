import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { UserGuard } from '../../guards/user.guard';

@Controller('currency')
@UseGuards(UserGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  async getRates(@Query('base') base?: string) {
    return this.currencyService.getRatesTable(base ?? 'USD');
  }

  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const a = parseFloat(amount);
    const result = await this.currencyService.convertAmount(
      a,
      from ?? 'USD',
      to ?? 'USD',
    );
    const rate = a !== 0 ? result / a : 0;
    return {
      amount: a,
      from: (from ?? 'USD').toUpperCase(),
      to: (to ?? 'USD').toUpperCase(),
      result,
      rate,
    };
  }
}

