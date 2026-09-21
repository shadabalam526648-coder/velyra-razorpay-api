const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        success: true,
        service: "Velyra Razorpay API",
        status: "online",
      });
    }

    if (request.method === "POST" && url.pathname === "/create-order") {
      try {
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
          return json({ success: false, error: "Razorpay credentials not configured." }, 500);
        }

        const body = await request.json();
        const amount = Number(body.amount);

        if (!Number.isInteger(amount) || amount < 1) {
          return json({ success: false, error: "Invalid amount." }, 400);
        }

        const auth = btoa(
          `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
        );

        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: "INR",
            receipt: body.receipt || `velyra_${Date.now()}`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return json({
            success: false,
            error: "Razorpay order creation failed.",
          }, response.status);
        }

        return json({
          success: true,
          order: data,
          key_id: env.RAZORPAY_KEY_ID,
        });
      } catch (error) {
        return json({
          success: false,
          error: "Server error.",
        }, 500);
      }
    }

    return json({ success: false, error: "Endpoint not found." }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
