const Stripe = require('stripe');
const prisma = require('../prisma/client');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Crée une session de paiement Stripe Checkout pour un abonnement.
 * Le frontend redirige l'utilisateur vers l'URL retournée.
 */
async function createCheckoutSession(req, res) {
  const { priceId } = req.body; // ID du tarif créé dans le dashboard Stripe
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  // On crée le customer Stripe s'il n'existe pas encore
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/abonnement/succes`,
    cancel_url: `${process.env.FRONTEND_URL}/abonnement/annule`,
  });

  return res.json({ checkoutUrl: session.url });
}

/**
 * Webhook Stripe : reçoit les événements (paiement réussi, abonnement annulé, etc.)
 * et met à jour notre base de données en conséquence.
 * IMPORTANT : cette route doit recevoir le body brut (pas du JSON parsé),
 * voir la config spéciale dans index.js.
 */
async function handleWebhook(req, res) {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer },
      });

      if (user) {
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            status: mapStripeStatus(subscription.status),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          create: {
            userId: user.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            status: mapStripeStatus(subscription.status),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer },
      });

      if (user) {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { status: 'CANCELED' },
        });
      }
      break;
    }

    default:
      // On ignore les événements qu'on ne gère pas explicitement
      break;
  }

  return res.json({ received: true });
}

function mapStripeStatus(stripeStatus) {
  const map = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'PAST_DUE',
  };
  return map[stripeStatus] || 'CANCELED';
}

module.exports = { createCheckoutSession, handleWebhook };
