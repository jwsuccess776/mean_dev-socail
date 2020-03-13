import { Component, OnInit, Input } from '@angular/core'
import { Router } from '@angular/router'
import { PaymentService } from '../../../services/payment.service'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { SubcancelComponent } from '../subcancel/subcancel.component'
import { TokenStorage } from '../../../auth/token.storage'

@Component({
  selector: 'app-pricing-tiers',
  templateUrl: './pricing-tiers.component.html',
  styleUrls: ['./pricing-tiers.component.scss']
})
export class PricingTiersComponent implements OnInit {
  @Input() plan: any
  @Input() previousPlanName: any
  @Input() showButton: any

  constructor(
    private router: Router,
    private tokenStorage: TokenStorage,
    private paymentService: PaymentService,
    private dialog: MatDialog
  ) { }

  public async subscribe(planId) {
    try {
      const user = await this.tokenStorage.getUser().toPromise()
      const { email } = JSON.parse(user.toString())
      const customer: any = await this.paymentService.stripeGetCustomerByEmail(email)
      if (customer.subscriptions.data.length) {
        this.dialog.open(SubcancelComponent, {
          width: '900px',
          data: {
            subscriptions: customer.subscriptions.data,
            planId: this.plan.id
          }
        })
      } else {
        this.router.navigate([`/checkout/${planId}`])
      }
    } catch (e) {
      console.log(e)
    }
  }

  ngOnInit() {
    this.showButton = this.showButton == '1' ? true : false
  }
}
