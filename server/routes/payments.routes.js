const express = require('express')
const router = express.Router()
const Stripe = require('../helpers/stripe.helper')

module.exports = router

router.post('/stripe/pay', Stripe.pay)

router.get('/stripe/invoices', Stripe.getInvoices)
router.get('/stripe/invoices/:id', Stripe.getInvoice)
router.get('/stripe/products', Stripe.getProducts)
router.get('/stripe/products/:id', Stripe.getProduct)
router.get('/stripe/plans', Stripe.getPlans)
router.get('/stripe/plans/:id', Stripe.getPlan)
router.get('/stripe/refunds', Stripe.getRefunds)
router.get('/stripe/refunds/:id', Stripe.getRefund)
router.get('/stripe/subscriptions', Stripe.getSubsriptions)
router.get('/stripe/subscriptions/:id', Stripe.getSubsription)
router.get('/stripe/charges', Stripe.getCharges)
router.get('/stripe/charges/:id', Stripe.getCharge)
router.get('/stripe/customers', Stripe.getCustomers)
router.get('/stripe/customers/:id', Stripe.getCustomerById)
router.get('/stripe/customers/email/:email', Stripe.getCustomerByEmail)
router.get('/stripe/customers/:id/sources', Stripe.getCustomerCards)

router.patch('/stripe/plans/:id', Stripe.updatePlan)
router.patch('/stripe/customers/:id/set-default-card', Stripe.setDefaultSource)

router.post('/stripe/products', Stripe.createProduct)
router.post('/stripe/plans', Stripe.createPlan)
router.post('/stripe/refunds', Stripe.createRefund)
router.post('/stripe/subscriptions', Stripe.createSubscription)
router.post('/stripe/customers/:id/sources', Stripe.createCustomerSource)
router.post('/stripe/invoices/:id/pay', Stripe.payInvoice)

router.delete('/stripe/products/:id', Stripe.deleteProduct)
router.delete('/stripe/plans/:id', Stripe.deletePlan)
router.delete('/stripe/subscriptions/:id', Stripe.deleteSubscription)
router.delete('/stripe/customers/:id/sources/:fk', Stripe.deleteCustomerSource)


