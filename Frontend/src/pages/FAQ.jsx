const faqs = [
  {
    q: "Are BinKhalid perfumes original and authentic?",
    a: "Yes, all BinKhalid fragrances are 100% authentic and crafted using premium quality ingredients sourced globally.",
  },
  {
    q: "How long does delivery take?",
    a: "Standard delivery usually takes 3–5 business days depending on your location. Express delivery options may be available at checkout.",
  },
  {
    q: "What is your return policy?",
    a: "We offer a 7-day return window for unopened and unused products. Please refer to our Returns Policy for more details.",
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes, Cash on Delivery is available in selected regions across India.",
  },
  {
    q: "How can I track my order?",
    a: "Once your order is shipped, you will receive a tracking link via SMS and email to monitor your delivery status.",
  },
];

export default function FAQ() {
  return (
    <main className="bg-black min-h-screen mt-14 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-serif mb-10">
          Frequently Asked Questions
        </h1>

        <div className="space-y-6">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="border border-white/10 p-5 hover:border-yellow-400 transition"
            >
              <h3 className="font-medium mb-2">
                {item.q}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
