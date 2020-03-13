import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenStorage } from '../auth/token.storage';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorage
  ) { }

  public async pay(token, amount) {
    const $user = await this.tokenStorage.getUser().toPromise()
    const { email } = JSON.parse($user.toString())

    return this.http.post('/api/payments/stripe/pay', { token, amount, email }).toPromise()
  }

  public stripeGetProducts() {
    return this.http.get(`/api/payments/stripe/products`).toPromise()
  }

  public stripeGetProduct(productId) {
    return this.http.get(`/api/payments/stripe/products/${productId}`).toPromise()
  }

  public stripeGetPlans(query = {}) {
    return this.http.get(`/api/payments/stripe/plans`, { params: query }).toPromise()
  }

  public stripeGetPlan(planId) {
    return this.http.get(`/api/payments/stripe/plans/${planId}`).toPromise()
  }

  public stripeGetCharges() {
    return this.http.get(`/api/payments/stripe/charges`).toPromise()
  }

  public stripeGetCharge(chargeId) {
    return this.http.get(`/api/payments/stripe/charges/${chargeId}`).toPromise()
  }

  public stripeGetRefunds() {
    return this.http.get(`/api/payments/stripe/refunds`).toPromise()
  }

  public stripeGetRefund(refundId) {
    return this.http.get(`/api/payments/stripe/refunds/${refundId}`).toPromise()
  }

  public stripeGetSubscriptions() {
    return this.http.get(`/api/payments/stripe/subscriptions`).toPromise()
  }

  public stripeGetSubscription(subscriptionId) {
    return this.http.get(`/api/payments/stripe/subscriptions/${subscriptionId}`).toPromise()
  }

  public stripeGetCustomers() {
    return this.http.get(`/api/payments/stripe/customers`).toPromise()
  }

  public stripeGetCustomer(customerId) {
    return this.http.get(`/api/payments/stripe/customers/${customerId}`).toPromise()
  }

  public stripeGetCustomerByEmail(email) {
    return this.http.get(`/api/payments/stripe/customers/email/${email}`).toPromise()
  }

  public stripeCreateCustomerSource(customerId, token) {
    return this.http.post(`/api/payments/stripe/customers/${customerId}/sources`, { token }).toPromise()
  }

  public stripePayInvoice(invoiceId, { source }) {
    return this.http.post(`/api/payments/stripe/invoices/${invoiceId}/pay`, { source }).toPromise()
  }

  public stripeCreateProduct({ name, type, attributes, caption, description }) {
    return this.http.post('/api/payments/stripe/products', { name, type, attributes, caption, description }).toPromise()
  }

  public stripeCreatePlan({ amount, product, interval, interval_count, active, trial_period_days }) {
    return this.http.post('/api/payments/stripe/plans', { amount, product, interval, interval_count, active, trial_period_days }).toPromise()
  }

  public stripeUpdatePlan(planId, { active }) {
    return this.http.patch(`/api/payments/stripe/plans/${planId}`, { active }).toPromise()
  }

  public stripeCreateRefund({ charge, amount, reason }) {
    return this.http.post('/api/payments/stripe/refunds', { charge, amount, reason }).toPromise()
  }

  public stripeCreateSubscription({ planId, customerId, autoCharge }) {
    const collection_method = autoCharge ? 'charge_automatically' : 'send_invoice'
    return this.http.post('/api/payments/stripe/subscriptions', { planId, customerId, collection_method }).toPromise()
  }

  public stripeDeleteProduct(productId) {
    return this.http.delete(`/api/payments/stripe/products/${productId}`).toPromise()
  }

  public stripeDeletePlan(planId) {
    return this.http.delete(`/api/payments/stripe/plans/${planId}`).toPromise()
  }

  public stripeDeleteSubscription(subscriptionId) {
    return this.http.delete(`/api/payments/stripe/subscriptions/${subscriptionId}`).toPromise()
  }

  public stripeSetDefaultCard(customerId, default_source) {
    return this.http.patch(`/api/payments/stripe/customers/${customerId}/set-default-card`, { default_source }).toPromise()
  }

  public deleteSource(customerId, sourceId) {
    return this.http.delete(`/api/payments/stripe/customers/${customerId}/sources/${sourceId}`).toPromise()

  }
}