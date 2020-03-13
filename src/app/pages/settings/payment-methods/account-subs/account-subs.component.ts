import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../../../services/payment.service'
import { TokenStorage } from '../../../../auth/token.storage'
import { Router } from '@angular/router'
import Swal from 'sweetalert2'

@Component({
  selector: 'app-account-subs',
  templateUrl: './account-subs.component.html',
  styleUrls: ['./account-subs.component.scss']
})
export class AccountSubsComponent implements OnInit {

  constructor(
    private paymentService: PaymentService,
    private tokenStorage: TokenStorage,
    private router: Router
  ) { }

  public email: string
  public customer: any
  public loadingSources: boolean
  public error: string
  public subscriptions: any[] = []

  async ngOnInit() {
    try {
      this.loadingSources = true
      const user = await this.tokenStorage.getUser().toPromise()
      this.email = JSON.parse(user.toString()).email
      this.customer = await this.paymentService.stripeGetCustomerByEmail(this.email)
      this.subscriptions = this.customer.subscriptions.data
      this.loadingSources = false
    } catch (e) {
      this.error = "An error has occured, please check your connection and try again."
    }
  }

  changePlan() {
    this.router.navigate(['/pricing'])
  }

  deleteSub() {
    Swal
      .fire({
        title: 'Confirm subscription cancellation',
        text: 'Are you sure you want to cancel your subscription? This action is not changeable or refundable.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Close'
      })
      .then(async result => {
        try {
          if (result.value) {
            await this.paymentService.stripeDeleteSubscription(this.subscriptions[0].id)
            this.ngOnInit()
          }
        } catch (e) {
          Swal.fire("Error", "An error has occured, please try again later.", 'error')
        }
      })
  }
}
