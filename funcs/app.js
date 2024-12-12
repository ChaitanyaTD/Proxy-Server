const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(express.json());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripeBaseUrl = 'https://api.stripe.com/v1/';

app.use(bodyParser.json());

app.post('/create-session', async (req, res) => {
  try {
    const { invoice, successUrl, cancelUrl } = req.body;
    const response = await stripe.checkout.sessions.create({
        cancel_url: cancelUrl, 
        success_url: successUrl,
        mode: 'payment',
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': invoice.currency,
        'line_items[0][price_data][product_data][name]': 'token',
        'line_items[0][price_data][unit_amount]': Math.floor(invoice.amount * 100),
        'line_items[0][quantity]': 1,
      });
      const responseBody = {
        id: response.id,
        url: response.url,
    };

    const responseBodyJson = JSON.stringify(responseBody);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(Buffer.from(responseBodyJson, 'utf-8'));

  } catch (error) {
    console.error('Error creating Stripe session:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: {
        code: error.response ? error.response.data.error.code : 'unknown_error',
        message: error.response ? error.response.data.error.message : error.message,
      },
    });
  }
});

app.get('/retrieve-session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    
    const response = await stripe.checkout.sessions.retrieve(
        sessionId
      );
      
      const responseBodyJson = JSON.stringify(response);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(Buffer.from(responseBodyJson, 'utf-8'));
  } catch (error) {
    console.error('Error retrieving Stripe session:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: {
        code: error.response ? error.response.data.error.code : 'unknown_error',
        message: error.response ? error.response.data.error.message : error.message,
      },
    });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


app.use("/.netlify/functions/app", router);
module.exports.handler = serverless(app);