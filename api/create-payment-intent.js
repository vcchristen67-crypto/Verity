export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const STRIPE_SK = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SK) return res.status(500).json({ error: 'Configuration manquante' });
  const { amount, currency, description } = req.body || {};
  if (!amount || amount <= 0 || amount > 500) return res.status(400).json({ error: 'Montant invalide' });
  try {
    const r = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STRIPE_SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ amount: String(Math.round(amount * 100)), currency: currency || 'eur', description: description || 'VERITY', 'automatic_payment_methods[enabled]': 'true', 'automatic_payment_methods[allow_redirects]': 'never' })
    });
    const data = await r.json();
    if (!r.ok) return res.status(400).json({ error: data.error?.message || 'Erreur Stripe' });
    return res.status(200).json({ client_secret: data.client_secret, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
