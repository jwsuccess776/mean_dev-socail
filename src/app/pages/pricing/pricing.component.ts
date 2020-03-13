import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service'

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit {

  public plans: any = []
  constructor(
    private paymentService: PaymentService
  ) { }

  async ngOnInit() {
    const plans: any = await this.paymentService.stripeGetPlans({ active: true })
    this.plans = plans.data.reverse()
  }

}
