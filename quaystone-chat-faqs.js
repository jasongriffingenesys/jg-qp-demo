/* Help topics for the Quaystone Pay custom web chat, from genesys-scripts/quaystone pay-knowledge/copilot-articles.md. */
window.PP_CHAT_FAQS = [
  {
    group: "Paying bills",
    title: "The company I paid says they haven't received my payment",
    phrases: ["provider not received", "council tax", "energy bill", "payment not gone through", "missing payment"],
    intro: "The company you paid holds your account, so they're the best people to trace it.",
    points: [
      "Contact the company you paid, for example your council, energy supplier or mobile network.",
      "Quote the date, time, amount and store printed on your Quaystone Pay receipt.",
      "Keep your receipt. It's your legal proof of payment.",
      "If they still can't find it, email a photo of the receipt and a short description to help@quaystonepay.example."
    ],
    chat: "My bill payment hasn't reached the company I paid"
  },
  {
    group: "Paying bills",
    title: "I've lost my receipt and my payment is missing",
    phrases: ["no receipt", "lost receipt", "paid without receipt"],
    intro: "Email help@quaystonepay.example so our customer service team can investigate. Please include:",
    steps: [
      "The name and address of the store where you paid.",
      "The date and time of the payment.",
      "The barcode number from your bill or payment card."
    ],
    points: [
      "Include the amount you paid if you can, as it helps us find the transaction.",
      "Without a receipt we can't guarantee we'll find the payment, so always ask for and keep a receipt."
    ],
    chat: "I've lost my receipt and my bill payment is missing"
  },
  {
    group: "Paying bills",
    title: "Which bills can I pay at Quaystone Pay? Do I need an account?",
    phrases: ["what bills", "council tax", "tv licence", "rent", "water", "account needed"],
    intro: "You can pay a wide range of household bills at Quaystone Pay stores across the UK, and you don't need a Quaystone Pay account.",
    points: [
      "Gas and electricity, rent, council tax, TV Licence, water bills and mobile top-ups.",
      "Bring your bill, payment card or barcode so the store can scan it.",
      "You can pay more than one bill in the same visit. Keep a receipt for each one.",
      "Services and opening hours vary by store."
    ],
    chat: "Where's my nearest Quaystone Pay store?"
  },
  {
    group: "Paying bills",
    title: "I have a question about my Quaystone Pay receipt",
    phrases: ["receipt wrong", "receipt problem"],
    intro: "Send a clear photo of the receipt, with a short description of the problem, to help@quaystonepay.example.",
    points: [
      "Make sure the date, time, amount and store details can be read.",
      "Questions about your bill, account or balance should go to the company you paid.",
      "Keep the original receipt as your proof of purchase."
    ]
  },
  {
    group: "Gas and electricity",
    title: "How do I top up my gas card, electricity key or smart meter?",
    phrases: ["top up meter", "add credit", "prepayment", "gas card", "electricity key"],
    steps: [
      "Take your gas card, electricity key or smart meter barcode to a Quaystone Pay store that offers energy top-ups.",
      "Tell the store assistant how much credit to add.",
      "Pay and keep your receipt.",
      "For a gas card or electricity key, put it into your meter at home to add the credit."
    ],
    points: ["You can top up gas and electricity in the same visit. No PIN, login or app is needed."],
    chat: "Where can I top up my gas card near me?"
  },
  {
    group: "Gas and electricity",
    title: "Can I top up gas or electricity for someone else?",
    phrases: ["top up for my mum", "someone else's meter", "another person"],
    intro: "Yes. Bring that person's gas card, electricity key or smart meter barcode to a Quaystone Pay store.",
    points: [
      "The credit goes onto the card, key or barcode you bring, so check it's the right one.",
      "For a gas card or electricity key, it then needs to go into their meter at home.",
      "The minimum top-up is set by each energy provider and can be as low as one pound."
    ]
  },
  {
    group: "Gas and electricity",
    title: "I topped up the wrong gas card or electricity key",
    phrases: ["wrong card", "wrong key", "credit not on meter"],
    steps: [
      "Keep your Quaystone Pay receipt. It's your legal proof of purchase.",
      "Contact your energy provider. Only they can see your account and which card or key the payment went to.",
      "Give them the date, time, amount and store from your receipt."
    ],
    points: ["Your energy provider's name is on a recent bill or letter, or printed on the card or key."]
  },
  {
    group: "Gas and electricity",
    title: "I need a new gas card or electricity key",
    phrases: ["lost gas card", "new key", "replacement card"],
    intro: "Please contact your energy provider. Quaystone Pay can't issue cards or keys.",
    points: [
      "Your provider can tell you which nearby store has a card or key, and how to activate it.",
      "Once it's active, you can top it up at any Quaystone Pay store that offers energy top-ups."
    ]
  },
  {
    group: "For retailers",
    title: "Card payments aren't working on my terminal",
    phrases: ["card machine", "terminal not working", "outage", "card reader", "payments stopped"],
    intro: "If we've told you about a live incident, our engineers are already working on it.",
    points: [
      "You can still take cash, bill payments, top-ups and parcel collection.",
      "If there's no live incident, restart the terminal and check the network cable or Wi-Fi.",
      "If card payments still fail, chat to us and we'll check your store and arrange an engineer if needed."
    ],
    chat: "I'm a retailer and card payments aren't working on my terminal"
  },
  {
    group: "For retailers",
    title: "Do I have to accept Cash Out or Energy Credit vouchers?",
    phrases: ["accept vouchers", "refuse voucher", "not enough cash"],
    intro: "If your store appears on the Quaystone Pay voucher store locator, you must process customers' vouchers, as long as you have the cash to pay out.",
    points: [
      "Energy Credit vouchers need no cash, so you can process them any time you're open.",
      "If there isn't enough cash for a Cash Out voucher, tell the customer and suggest a better time to come back.",
      "A voucher can only be used once and expires on the date shown."
    ]
  },
  {
    group: "For retailers",
    title: "How do I process a voucher?",
    phrases: ["scan voucher", "cash out voucher", "energy credit voucher"],
    steps: [
      "Scan the voucher barcode with the Quaystone Pay scanner.",
      "At CONFIRM TRANSACTION, check the amount matches the voucher, then select CONFIRM.",
      "Put the terminal receipt in the till.",
      "For Cash Out, give the customer the cash. For Energy Credit, complete a normal top-up for the voucher value."
    ]
  },
  {
    group: "For retailers",
    title: "The voucher barcode won't scan, or it's a text message voucher",
    phrases: ["barcode won't scan", "text message voucher", "enter voucher number"],
    steps: [
      "On the till screen, select the P button.",
      "On the Quaystone Pay terminal, select VOUCHERS, then CASH OUT, then MANUAL ENTRY.",
      "Enter the voucher number, printed below the barcode on a barcoded voucher.",
      "At CONFIRM TRANSACTION, check the amount, then select CONFIRM and put the receipt in the till."
    ]
  },
  {
    group: "For retailers",
    title: "When am I paid for an Energy Credit voucher?",
    phrases: ["voucher settlement", "voucher money", "paid for vouchers"],
    intro: "The voucher amount is credited to your bank account within three working days of processing it on your Quaystone Pay terminal.",
    points: ["Energy Credit vouchers need no till cash. You complete a normal energy top-up for the voucher value."]
  }
];
