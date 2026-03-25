const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Payment = require('../models/Payment');
const { sendEmail, emailTemplates } = require('../utils/email');
const { MONTHLY_PRICE, YEARLY_PRICE } = require('../utils/drawEngine');

// Subscription price IDs - created in Stripe dashboard
const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
};

// @desc    Activate free starter plan
// @route   POST /api/payments/free-plan
exports.activateFreePlan = async (req, res) => {
  try {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'subscription.status': 'trialing',
        'subscription.plan': 'free',
        'subscription.currentPeriodStart': now,
        'subscription.currentPeriodEnd': periodEnd,
        'subscription.cancelAtPeriodEnd': false,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Free starter plan activated',
      subscription: user.subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout
exports.createCheckout = async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' | 'yearly'
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    let customerId = req.user.subscription?.stripeCustomerId;

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.fullName,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(req.user._id, { 'subscription.stripeCustomerId': customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe`,
      metadata: { userId: req.user._id.toString(), plan },
      subscription_data: {
        metadata: { userId: req.user._id.toString(), plan },
      },
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create customer portal session (manage subscription)
// @route   POST /api/payments/portal
exports.createPortal = async (req, res) => {
  try {
    const customerId = req.user.subscription?.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'No Stripe customer found' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });
    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subscription status
// @route   GET /api/payments/subscription
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel subscription at period end
// @route   POST /api/payments/cancel
exports.cancelSubscription = async (req, res) => {
  try {
    const subscriptionId = req.user.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'No active Stripe subscription found' });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await User.findByIdAndUpdate(req.user._id, {
      'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
      'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    });

    res.json({ success: true, message: 'Subscription will cancel at the end of the billing period' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stripe webhook
// @route   POST /api/payments/webhook
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await User.findByIdAndUpdate(userId, {
          'subscription.status': 'active',
          'subscription.plan': plan,
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
        });

        const amount = plan === 'monthly' ? MONTHLY_PRICE : YEARLY_PRICE;
        await Payment.create({
          user: userId,
          stripeSubscriptionId: subscription.id,
          amount: session.amount_total,
          currency: session.currency,
          plan,
          status: 'succeeded',
          type: 'subscription',
          periodStart: new Date(subscription.current_period_start * 1000),
          periodEnd: new Date(subscription.current_period_end * 1000),
        });

        const user = await User.findById(userId);
        if (user) {
          const endDate = new Date(subscription.current_period_end * 1000).toLocaleDateString();
          await sendEmail({
            to: user.email,
            ...emailTemplates.subscriptionConfirm(user.firstName, plan, amount, endDate),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata.userId;
        if (!userId) break;

        const status = sub.status === 'active' ? 'active' :
                       sub.status === 'past_due' ? 'lapsed' :
                       sub.status === 'canceled' ? 'cancelled' : sub.status;

        await User.findByIdAndUpdate(userId, {
          'subscription.status': status,
          'subscription.currentPeriodStart': new Date(sub.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': sub.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata.userId;
        if (!userId) break;
        await User.findByIdAndUpdate(userId, { 'subscription.status': 'cancelled' });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = sub.metadata.userId;
        if (userId) await User.findByIdAndUpdate(userId, { 'subscription.status': 'lapsed' });
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
