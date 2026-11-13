/* Quaystone Pay custom web chat on Genesys Cloud Web Messaging. */
(function () {
  "use strict";

  var config = window.PP_CHAT_CONFIG || {};
  var params = new URLSearchParams(window.location.search);
  var environment = params.get("environment") || config.environment || "prod-euw2";
  var deploymentId = params.get("deploymentId") || config.deploymentId;
  var bootstrapUrl = config.bootstrapUrl || "https://apps.euw2.pure.cloud/genesys-bootstrap/genesys.min.js";

  // Demo store data, as returned by the Find_Nearest_Stores mock.
  var STORES = [
    { name: "Northside News & Food", address: "21 Oldham Street, Manchester M1 1JN", distance: "0.2 miles", hours: "6am to 11pm every day",
      services: ["Bill payments", "Energy top-ups", "Bank cash deposits", "Parcel collection"] },
    { name: "Piccadilly Convenience", address: "5 Lever Street, Manchester M1 1FN", distance: "0.4 miles", hours: "7am to 10pm every day",
      services: ["Bill payments", "Mobile top-ups"] },
    { name: "Market Street Local", address: "60 Market Street, Manchester M1 1PW", distance: "0.6 miles", hours: "8am to 8pm Monday to Saturday",
      services: ["Bill payments", "Energy top-ups", "Cash Out vouchers"] },
    { name: "Patel's News", address: "14 Kirkgate, Leeds LS1 6BY", distance: "0.3 miles", hours: "6am to 10pm every day",
      services: ["Bill payments", "Energy top-ups", "Cash Out vouchers", "Parcel collection"] },
    { name: "Allen's Convenience Store", address: "82 Briggate, Leeds LS1 6NP", distance: "0.5 miles", hours: "7am to 9pm Mon to Sat, 9am to 5pm Sun",
      services: ["Bill payments", "Energy top-ups", "Card payments"] },
    { name: "City Express Mini Market", address: "3 Wellington Street, Leeds LS1 4DL", distance: "0.8 miles", hours: "Open 24 hours",
      services: ["Bill payments", "Mobile top-ups", "Parcel collection"] }
  ];

  var state = {
    ready: false,
    started: false,
    agentName: null,
    seen: {},
    pendingEcho: [],
    lastUserText: "",
    typingTimer: null,
    ended: false
  };

  // ---------- DOM ----------
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  var root = el("div");
  root.id = "ppc-root";

  var teaser = el("div", "ppc-hidden", "Need help with a bill payment, a parcel or your Quaystone Pay terminal? Chat to us.");
  teaser.id = "ppc-teaser";

  var launcher = el("button");
  launcher.id = "ppc-launcher";
  launcher.setAttribute("aria-label", "Chat with Quaystone Pay");
  launcher.appendChild(el("span", "ppc-launcher-icon", "QP"));
  launcher.appendChild(el("span", null, "Chat with us"));

  var panel = el("section", "ppc-closed");
  panel.id = "ppc-panel";
  panel.setAttribute("aria-label", "Quaystone Pay chat");

  var header = el("div", "ppc-header");
  var headerAvatar = el("div", "ppc-header-avatar", "QP");
  var headerText = el("div", "ppc-header-text");
  var brand = el("div", "ppc-brand");
  brand.appendChild(el("span", null, "Quaystone Pay"));
  brand.appendChild(document.createTextNode(" Assistant"));
  var status = el("div", "ppc-status", "Online now");
  headerText.appendChild(brand);
  headerText.appendChild(status);
  var minimise = el("button", null, "\u2013");
  minimise.setAttribute("aria-label", "Minimise chat");
  header.appendChild(headerAvatar);
  header.appendChild(headerText);
  header.appendChild(minimise);

  var tabs = el("div", "ppc-tabs");
  var chatTab = el("button", "ppc-tab ppc-active", "Chat");
  var helpTab = el("button", "ppc-tab", "Help topics");
  chatTab.type = helpTab.type = "button";
  tabs.appendChild(chatTab);
  tabs.appendChild(helpTab);

  var chatView = el("div", "ppc-view");
  var helpView = el("div", "ppc-view ppc-help ppc-hidden-view");

  var banner = el("div", "ppc-banner");
  var log = el("div", "ppc-log");
  log.setAttribute("aria-live", "polite");
  var chips = el("div", "ppc-chips");

  var composer = el("form", "ppc-composer");
  var input = el("textarea");
  input.rows = 1;
  input.placeholder = "Type your message\u2026";
  input.setAttribute("aria-label", "Message");
  var send = el("button", null, "\u27A4");
  send.type = "submit";
  send.setAttribute("aria-label", "Send");
  composer.appendChild(input);
  composer.appendChild(send);

  var ended = el("div", "ppc-ended");
  var restart = el("button", null, "Start a new chat");
  ended.appendChild(el("div", "ppc-name", "This chat has ended."));
  ended.appendChild(restart);

  var footer = el("div", "ppc-footer", "Powered by Genesys Cloud");

  chatView.appendChild(banner);
  chatView.appendChild(log);
  chatView.appendChild(chips);
  chatView.appendChild(composer);
  chatView.appendChild(ended);

  panel.appendChild(header);
  panel.appendChild(el("div", "ppc-stripe"));
  panel.appendChild(tabs);
  panel.appendChild(chatView);
  panel.appendChild(helpView);
  panel.appendChild(footer);

  root.appendChild(teaser);
  root.appendChild(launcher);
  root.appendChild(panel);
  document.body.appendChild(root);

  // ---------- Rendering ----------
  function timeLabel(iso) {
    var d = iso ? new Date(iso) : new Date();
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  function scrollDown() {
    log.scrollTop = log.scrollHeight;
  }

  function initials(name) {
    return (name || "QP").split(/\s+/).map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toUpperCase();
  }

  function addRow(who, text, opts) {
    opts = opts || {};
    var row = el("div", "ppc-row " + (who === "me" ? "ppc-me" : "ppc-them"));
    var stack = el("div", "ppc-stack");
    if (who !== "me") {
      var avatar = el("div", "ppc-avatar" + (opts.human ? " ppc-human" : ""), opts.human ? initials(opts.name) : "QP");
      row.appendChild(avatar);
      stack.appendChild(el("div", "ppc-name", opts.human ? (opts.name || "Quaystone Pay team") : "Quaystone Pay Assistant"));
    }
    if (text) stack.appendChild(el("div", "ppc-bubble", text));
    (opts.extras || []).forEach(function (node) { stack.appendChild(node); });
    stack.appendChild(el("div", "ppc-time", timeLabel(opts.time)));
    row.appendChild(stack);
    hideTyping();
    log.appendChild(row);
    scrollDown();
    return row;
  }

  function addSystem(text, success) {
    hideTyping();
    log.appendChild(el("div", "ppc-system" + (success ? " ppc-success" : ""), text));
    scrollDown();
  }

  var typingRow = null;
  function showTyping() {
    if (typingRow) return;
    typingRow = el("div", "ppc-row ppc-them");
    typingRow.appendChild(el("div", "ppc-avatar" + (state.agentName ? " ppc-human" : ""), state.agentName ? initials(state.agentName) : "QP"));
    var dots = el("div", "ppc-typing");
    dots.appendChild(el("i"));
    dots.appendChild(el("i"));
    dots.appendChild(el("i"));
    typingRow.appendChild(dots);
    log.appendChild(typingRow);
    scrollDown();
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(hideTyping, 15000);
  }

  function hideTyping() {
    if (typingRow && typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
    typingRow = null;
  }

  function setChips(list) {
    chips.textContent = "";
    (list || []).forEach(function (item) {
      var label = typeof item === "string" ? item : item.label;
      var chip = el("button", "ppc-chip", label);
      chip.type = "button";
      chip.addEventListener("click", function () {
        if (typeof item === "string") sendText(item);
        else item.action();
      });
      chips.appendChild(chip);
    });
  }

  // ---------- Help topics ----------
  var HELP_CHIP = { label: "Browse help topics", action: function () { showView("help"); } };

  function showView(name) {
    var help = name === "help";
    helpView.className = "ppc-view ppc-help" + (help ? "" : " ppc-hidden-view");
    chatView.className = "ppc-view" + (help ? " ppc-hidden-view" : "");
    helpTab.className = "ppc-tab" + (help ? " ppc-active" : "");
    chatTab.className = "ppc-tab" + (help ? "" : " ppc-active");
    if (help) helpSearch.focus();
    else setTimeout(function () { input.focus(); }, 50);
  }

  function askInChat(text) {
    showView("chat");
    if (state.ended) {
      state.queued = text;
      transport.clear(resetUi);
    } else if (state.botHasSpoken) {
      sendText(text);
    } else {
      state.queued = text;
      startConversation();
    }
  }

  var helpSearch = el("input", "ppc-help-search");
  helpSearch.type = "search";
  helpSearch.placeholder = "Search help topics, e.g. \"lost receipt\"";
  helpSearch.setAttribute("aria-label", "Search help topics");
  var helpList = el("div", "ppc-help-list");
  var helpEmpty = el("div", "ppc-help-empty", "No help topics match that. Try different words, or chat to us.");
  var helpEmptyChat = el("button", "ppc-chip", "Chat to us");
  helpEmptyChat.type = "button";
  helpEmptyChat.addEventListener("click", function () { showView("chat"); startConversation(); });
  helpEmpty.appendChild(el("br"));
  helpEmpty.appendChild(helpEmptyChat);
  helpView.appendChild(el("div", "ppc-help-intro", "Quick answers to common questions. Can't find what you need? Chat to us any time."));
  helpView.appendChild(helpSearch);
  helpView.appendChild(helpList);
  helpView.appendChild(helpEmpty);

  function faqItem(faq) {
    var item = el("div", "ppc-faq");
    var q = el("button", "ppc-faq-q", faq.title);
    q.type = "button";
    q.setAttribute("aria-expanded", "false");
    var a = el("div", "ppc-faq-a");
    if (faq.intro) a.appendChild(el("p", null, faq.intro));
    if (faq.steps) {
      var ol = el("ol");
      faq.steps.forEach(function (s) { ol.appendChild(el("li", null, s)); });
      a.appendChild(ol);
    }
    if (faq.points) {
      var ul = el("ul");
      faq.points.forEach(function (s) { ul.appendChild(el("li", null, s)); });
      a.appendChild(ul);
    }
    var cta = el("button", "ppc-faq-cta", faq.chat ? "Chat to us about this \u2192" : "Still need help? Chat to us \u2192");
    cta.type = "button";
    cta.addEventListener("click", function () {
      if (faq.chat) askInChat(faq.chat);
      else { showView("chat"); startConversation(); }
    });
    a.appendChild(cta);
    q.addEventListener("click", function () {
      var open = item.className.indexOf("ppc-open") === -1;
      item.className = "ppc-faq" + (open ? " ppc-open" : "");
      q.setAttribute("aria-expanded", String(open));
    });
    item.appendChild(q);
    item.appendChild(a);
    item._search = (faq.title + " " + (faq.phrases || []).join(" ") + " " + (faq.intro || "") + " " +
      (faq.steps || []).join(" ") + " " + (faq.points || []).join(" ")).toLowerCase();
    return item;
  }

  var faqNodes = [];
  var groupNodes = {};
  (window.PP_CHAT_FAQS || []).forEach(function (faq) {
    if (!groupNodes[faq.group]) {
      var g = el("div", "ppc-help-group");
      g.appendChild(el("div", "ppc-help-group-title", faq.group));
      groupNodes[faq.group] = g;
      helpList.appendChild(g);
    }
    var node = faqItem(faq);
    faqNodes.push({ node: node, group: faq.group });
    groupNodes[faq.group].appendChild(node);
  });
  if (!faqNodes.length) helpTab.style.display = "none";

  helpSearch.addEventListener("input", function () {
    var words = helpSearch.value.toLowerCase().split(/\s+/).filter(Boolean);
    var visibleByGroup = {};
    faqNodes.forEach(function (f) {
      var show = words.every(function (w) { return f.node._search.indexOf(w) !== -1; });
      f.node.style.display = show ? "" : "none";
      if (show) visibleByGroup[f.group] = true;
    });
    Object.keys(groupNodes).forEach(function (g) {
      groupNodes[g].style.display = visibleByGroup[g] ? "" : "none";
    });
    helpEmpty.style.display = Object.keys(visibleByGroup).length ? "none" : "block";
  });

  chatTab.addEventListener("click", function () { showView("chat"); startConversation(); });
  helpTab.addEventListener("click", function () { showView("help"); });

  function showBanner(text, connected) {
    banner.textContent = "";
    banner.className = "ppc-banner ppc-show" + (connected ? " ppc-connected" : "");
    if (!connected) banner.appendChild(el("span", "ppc-spinner"));
    banner.appendChild(el("span", null, text));
  }

  // ---------- Cards built from the AVA's replies ----------
  function mapsLink(query) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  }

  function storeCard(store, wanted) {
    var card = el("div", "ppc-card");
    var head = el("div", "ppc-card-head");
    head.appendChild(el("span", null, "QUAYSTONE PAY STORE"));
    head.appendChild(el("span", "ppc-pill", store.distance + " away"));
    card.appendChild(head);
    var body = el("div", "ppc-card-body");
    body.appendChild(el("div", "ppc-card-title", store.name));
    body.appendChild(el("div", "ppc-card-line", "\uD83D\uDCCD " + store.address));
    body.appendChild(el("div", "ppc-card-line", "\uD83D\uDD52 " + store.hours));
    var tags = el("div", "ppc-tags");
    store.services.forEach(function (s) {
      var match = wanted && s.toLowerCase().indexOf(wanted) !== -1;
      tags.appendChild(el("span", "ppc-tag" + (match ? " ppc-match" : ""), s));
    });
    body.appendChild(tags);
    card.appendChild(body);
    var actions = el("div", "ppc-card-actions");
    var directions = el("a", null, "Get directions");
    directions.href = mapsLink(store.name + ", " + store.address);
    directions.target = "_blank";
    directions.rel = "noopener";
    actions.appendChild(directions);
    card.appendChild(actions);
    return card;
  }

  function wantedService() {
    var t = state.lastUserText.toLowerCase() + " " + (state.serviceHint || "");
    if (/collect\s*\+|parcel/.test(t)) return "collect+";
    if (/energy|gas|electric|top.?up/.test(t)) return "energy";
    if (/cash out|voucher/.test(t)) return "cash out";
    if (/bill/.test(t)) return "bill";
    return null;
  }

  function buildStoreCards(text) {
    var cards = [];
    if (!/\bmiles?\b|\bnearest\b/i.test(text) || /\bpayment of\b|\bpaid\b/i.test(text)) return cards;
    STORES.forEach(function (store) {
      if (text.indexOf(store.name) !== -1) cards.push(storeCard(store, wantedService()));
    });
    if (cards.length) return cards;
    var postcode = text.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/);
    if (postcode && /store|shop|open/i.test(text)) {
      var card = el("div", "ppc-card");
      var head = el("div", "ppc-card-head");
      head.appendChild(el("span", null, "QUAYSTONE PAY STORE"));
      card.appendChild(head);
      var actions = el("div", "ppc-card-actions");
      var a = el("a", null, "Get directions to " + postcode[0]);
      a.href = mapsLink(postcode[0]);
      a.target = "_blank";
      a.rel = "noopener";
      actions.appendChild(a);
      card.appendChild(actions);
      cards.push(card);
    }
    return cards;
  }

  function buildPaymentCard(text) {
    if (!/payment of/i.test(text)) return null;
    var amount = (text.match(/£\s?[\d,]+(?:\.\d{2})?/) || [""])[0];
    var payee = (text.match(/payment of [^,]*? to ([^,]+?)(?:,| made)/i) || [])[1] || "";
    var paidAt = (text.match(/made at (.+?) on ([A-Z][a-z]+day[^.]*?\d{4}|[^.]+?)\./) || []);
    var sent = text.match(/sent (?:it|this payment|the payment|your payment)? ?to ([^.]+?) on ([^.]+?)\./i);
    var processing = /still being processed|not been sent|hasn't been sent/i.test(text);
    if (!sent && !processing) return null;

    var card = el("div", "ppc-card");
    var head = el("div", "ppc-card-head");
    head.appendChild(el("span", null, "BILL PAYMENT TRACE"));
    head.appendChild(el("span", "ppc-pill", sent ? "Sent" : "Processing"));
    card.appendChild(head);
    var body = el("div", "ppc-card-body");
    body.appendChild(el("div", "ppc-card-title", (amount ? amount + " to " : "") + (payee || "your biller")));
    var steps = el("div", "ppc-steps");

    function step(done, title, detail) {
      var row = el("div", "ppc-step");
      row.appendChild(el("div", "ppc-dot " + (done ? "ppc-done" : "ppc-wait"), done ? "\u2713" : "\u2026"));
      var t = el("div", "ppc-step-text");
      t.appendChild(el("strong", null, title));
      if (detail) t.appendChild(el("span", null, detail));
      row.appendChild(t);
      steps.appendChild(row);
    }

    step(true, "Paid in store", paidAt[1] ? paidAt[1] + (paidAt[2] ? ", " + paidAt[2] : "") : "");
    if (sent) {
      step(true, "Sent by Quaystone Pay to " + sent[1].trim(), sent[2].trim());
    } else {
      step(false, "Being processed by Quaystone Pay", "Not sent to " + (payee || "the biller") + " yet");
    }
    body.appendChild(steps);
    body.appendChild(el("div", "ppc-note", "Keep your receipt as proof of payment, and quote your receipt reference to " + (payee || "the company you paid") + "."));
    card.appendChild(body);
    return card;
  }

  // ---------- Suggested replies ----------
  function suggestionsFor(text) {
    if (/retailer or (?:a )?customer/i.test(text)) return ["I'm a customer", "I'm a retailer"];
    if (/text you|send you a text|like me to text/i.test(text)) return ["Yes please, text me", "No thanks"];
    if (/still like to be connected|like me to (?:transfer|connect)|like to speak to/i.test(text)) return ["Yes please", "No thanks"];
    if (/anything else/i.test(text)) return ["No, that's all thanks", "Find a Quaystone Pay store", "Track a bill payment"];
    if (/is this about a voucher, a bill payment or a parcel/i.test(text)) return ["A bill payment", "A parcel", "A voucher"];
    return [];
  }

  // ---------- Incoming messages ----------
  function isAgentHandoff(text) {
    return /connecting you to (?:the )?(.+?team)/i.exec(text) || /pass you to (one of my colleagues)/i.exec(text);
  }

  function handleOutbound(msg) {
    var text = msg.text || "";
    var human = msg.originatingEntity === "Human";
    var name = (msg.channel && msg.channel.from && msg.channel.from.nickname) || null;
    var time = msg.channel && msg.channel.time;

    (msg.events || []).forEach(function (ev) {
      if (ev.eventType === "Typing") showTyping();
      if (ev.eventType === "Presence" && ev.presence && ev.presence.type === "Disconnect") endChat();
    });

    if (human && !state.agentName) {
      state.agentName = name || "Quaystone Pay team";
      headerAvatar.textContent = initials(state.agentName);
      headerAvatar.className = "ppc-header-avatar ppc-human";
      brand.textContent = "";
      brand.appendChild(document.createTextNode(state.agentName + " "));
      brand.appendChild(el("span", null, "\u00B7 Quaystone Pay"));
      status.textContent = "Quaystone Pay team member";
      showBanner("You're now chatting with " + state.agentName + " from the Quaystone Pay team", true);
      addSystem(state.agentName + " has joined the chat");
    }

    var quick = (msg.content || [])
      .filter(function (c) { return c.contentType === "QuickReply" && c.quickReply; })
      .map(function (c) { return c.quickReply.text; });

    if (!text && !quick.length) return;

    var extras = [];
    if (!human && text) {
      var payment = buildPaymentCard(text);
      if (payment) extras.push(payment);
      else buildStoreCards(text).forEach(function (c) { extras.push(c); });
    }
    if (text || extras.length) addRow("them", text, { human: human, name: name, time: time, extras: extras });

    if (!human && /sent (?:you )?(?:a|that|the) text|text (?:message )?(?:has been|is on its way)|i've texted/i.test(text)) {
      addSystem("\u2713 Text message sent to your mobile", true);
    }

    var handoff = !human && isAgentHandoff(text);
    if (handoff) {
      showBanner("Connecting you to " + (/right quaystone pay team|colleagues/i.test(handoff[1]) ? "the right Quaystone Pay team" : "the " + handoff[1].replace(/^the /i, "")) + "\u2026");
      status.textContent = "Connecting you to a Quaystone Pay team member";
    }

    var suggestions = quick.length ? quick : (human ? [] : suggestionsFor(text));
    if (!human && /(?:can't|cannot|not able to) answer/i.test(text)) suggestions = suggestions.concat([HELP_CHIP]);
    setChips(suggestions);
    if (/thanks for contacting quaystone pay\. have a great day/i.test(text)) endChat();

    if (!human && text && !state.botHasSpoken) {
      state.botHasSpoken = true;
      if (state.queued) {
        var queued = state.queued;
        state.queued = null;
        setTimeout(function () { sendText(queued); }, 600);
      }
    }
  }

  function handleInbound(msg) {
    var text = msg.text || "";
    if (!text) return;
    var i = state.pendingEcho.indexOf(text);
    if (i !== -1) {
      state.pendingEcho.splice(i, 1);
      return;
    }
    addRow("me", text, { time: msg.channel && msg.channel.time });
  }

  function handleMessages(messages, restoring) {
    (messages || [])
      .slice()
      .sort(function (a, b) {
        var ta = a.channel && a.channel.time ? Date.parse(a.channel.time) : 0;
        var tb = b.channel && b.channel.time ? Date.parse(b.channel.time) : 0;
        return ta - tb;
      })
      .forEach(function (msg) {
        if (msg.id && state.seen[msg.id]) return;
        if (msg.id) state.seen[msg.id] = true;
        if (msg.direction === "Inbound") {
          if (restoring) addRow("me", msg.text || "", { time: msg.channel && msg.channel.time });
          else handleInbound(msg);
        } else {
          handleOutbound(msg);
        }
      });
  }

  function endChat() {
    if (state.ended) return;
    state.ended = true;
    hideTyping();
    setChips([]);
    composer.style.display = "none";
    ended.className = "ppc-ended ppc-show";
    status.textContent = "Chat ended";
  }

  // ---------- Sending ----------
  function sendText(text) {
    text = (text || "").trim();
    if (!text || !state.ready || state.ended) return;
    state.lastUserText = text;
    if (/collect\s*\+|parcel|energy|top.?up|voucher|bill/i.test(text)) state.serviceHint = text.toLowerCase();
    state.pendingEcho.push(text);
    addRow("me", text);
    setChips([]);
    showTyping();
    transport.send(text, function () {
      hideTyping();
      addSystem("Sorry, that message didn't send. Please try again.");
    });
  }

  composer.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value;
    input.value = "";
    input.style.height = "";
    sendText(text);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      composer.requestSubmit ? composer.requestSubmit() : composer.dispatchEvent(new Event("submit"));
    } else if (state.ready) {
      transport.typing();
    }
  });

  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });

  // ---------- Open, close, restart ----------
  function startConversation() {
    if (state.started || !state.ready) return;
    state.started = true;
    showTyping();
    transport.start();
    setTimeout(function () {
      if (log.querySelector(".ppc-them")) return;
      hideTyping();
      state.botHasSpoken = true;
      if (state.queued) {
        var queued = state.queued;
        state.queued = null;
        sendText(queued);
        return;
      }
      addRow("them", "Hello, and thanks for contacting Quaystone Pay. Could you let me know whether you're a Quaystone Pay retailer or a customer?");
      setChips(["I'm a customer", "I'm a retailer"]);
    }, 6000);
  }

  function openPanel() {
    panel.className = "";
    launcher.className = "ppc-hidden";
    teaser.className = "ppc-hidden";
    setTimeout(function () { input.focus(); }, 200);
    startConversation();
  }

  function closePanel() {
    panel.className = "ppc-closed";
    launcher.className = "";
  }

  launcher.addEventListener("click", openPanel);
  minimise.addEventListener("click", closePanel);
  window.QuaystoneChat = { open: openPanel, close: closePanel };

  restart.addEventListener("click", function () {
    transport.clear(resetUi);
  });

  function resetUi() {
    log.textContent = "";
    setChips([]);
    banner.className = "ppc-banner";
    composer.style.display = "";
    ended.className = "ppc-ended";
    headerAvatar.textContent = "QP";
    headerAvatar.className = "ppc-header-avatar";
    brand.textContent = "";
    brand.appendChild(el("span", null, "Quaystone Pay"));
    brand.appendChild(document.createTextNode(" Assistant"));
    status.textContent = "Online now";
    state.agentName = null;
    state.ended = false;
    state.started = false;
    state.botHasSpoken = false;
    state.seen = {};
    state.pendingEcho = [];
    startConversation();
  }

  // ---------- Connection to Genesys Cloud ----------
  var transport = { start: function () {}, send: function () {}, typing: function () {}, clear: function (done) { done(); } };

  if (!deploymentId || /REPLACE/.test(deploymentId)) {
    addSystem("Chat isn't configured yet: add the Messenger deployment ID to PP_CHAT_CONFIG.");
    return;
  }

  if (config.transport === "messenger") transport = messengerTransport();
  else transport = guestTransport();

  setTimeout(function () { if (panel.className !== "") teaser.className = ""; }, 4000);
  teaser.addEventListener("click", openPanel);

  // Genesys Web Messaging Guest API over a WebSocket. Works with any Messenger deployment.
  function guestTransport() {
    var DOMAINS = {
      "prod": "mypurecloud.com", "prod-euw1": "mypurecloud.ie", "prod-euw2": "euw2.pure.cloud", "prod-euc1": "mypurecloud.de",
      "prod-euc2": "euc2.pure.cloud", "prod-usw2": "usw2.pure.cloud", "prod-use2": "use2.us-gov-pure.cloud", "prod-cac1": "cac1.pure.cloud",
      "prod-apse2": "mypurecloud.com.au", "prod-apne1": "mypurecloud.jp", "prod-apne2": "apne2.pure.cloud", "prod-aps1": "aps1.pure.cloud",
      "prod-sae1": "sae1.pure.cloud", "prod-mec1": "mec1.pure.cloud"
    };
    var PING = "__ppc_keepalive__";
    var host = config.webMessagingHost || "webmessaging." + (DOMAINS[environment] || "euw2.pure.cloud");
    var ws = null;
    var token = newToken();
    var connected = false;
    var closingOnPurpose = false;
    var backlog = [];
    var pingTimer = null;
    var lastTyping = 0;
    var retries = 0;

    function newToken() {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
    }

    function raw(payload) {
      if (connected && ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
      else backlog.push(payload);
    }

    function onMessage(message) {
      raw({ action: "onMessage", token: token, message: message });
    }

    function connect() {
      closingOnPurpose = false;
      ws = new WebSocket("wss://" + host + "/v1?deploymentId=" + encodeURIComponent(deploymentId));
      ws.onopen = function () {
        ws.send(JSON.stringify({ action: "configureSession", deploymentId: deploymentId, token: token }));
      };
      ws.onmessage = function (e) {
        var m;
        try { m = JSON.parse(e.data); } catch (err) { return; }
        handle(m);
      };
      ws.onclose = function () {
        connected = false;
        clearInterval(pingTimer);
        if (closingOnPurpose || state.ended) return;
        status.textContent = "Reconnecting\u2026";
        retries += 1;
        if (retries <= 5) setTimeout(connect, Math.min(1000 * retries, 5000));
        else addSystem("Sorry, the chat has lost its connection. Please refresh the page.");
      };
    }

    function handle(m) {
      var body = m.body || {};
      if (m.class === "SessionResponse") {
        connected = true;
        retries = 0;
        state.ready = true;
        status.textContent = state.agentName ? "Quaystone Pay team member" : "Online now";
        var pending = backlog;
        backlog = [];
        pending.forEach(function (p) { ws.send(JSON.stringify(p)); });
        clearInterval(pingTimer);
        pingTimer = setInterval(function () {
          raw({ action: "echo", token: token, message: { type: "Text", text: PING } });
        }, 60000);
        if (body.readOnly) endChat();
        else if (panel.className === "") startConversation();
        return;
      }
      if (m.class === "StructuredMessage") {
        if (body.text === PING) return;
        handleMessages([body], false);
        return;
      }
      if (m.class === "SessionExpiredEvent" || m.class === "SessionClearedEvent" || m.class === "ConnectionClosedEvent") {
        endChat();
        return;
      }
      if (m.type === "response" && m.code >= 400) {
        var detail = typeof body === "string" ? body : (body.message || "");
        if (/presence/i.test(detail)) return;
        hideTyping();
        if (!connected) addSystem("Sorry, the chat couldn't connect (" + (detail || "error " + m.code) + ").");
        else addSystem("Sorry, something went wrong with that message. Please try again.");
      }
    }

    connect();

    return {
      start: function () {
        onMessage({ type: "Event", events: [{ eventType: "Presence", presence: { type: "Join" } }] });
      },
      send: function (text) {
        onMessage({ type: "Text", text: text });
      },
      typing: function () {
        if (Date.now() - lastTyping < 5000) return;
        lastTyping = Date.now();
        onMessage({ type: "Event", events: [{ eventType: "Typing", typing: { type: "On" } }] });
      },
      clear: function (done) {
        closingOnPurpose = true;
        connected = false;
        state.ready = false;
        clearInterval(pingTimer);
        backlog = [];
        if (ws) ws.close();
        token = newToken();
        done();
        connect();
      }
    };
  }

  // Genesys Messenger JavaScript SDK in headless mode (used by the offline preview).
  function messengerTransport() {
    loadMessenger();
    var G = window.Genesys;
    G("subscribe", "MessagingService.ready", function () {
      state.ready = true;
      if (panel.className === "") startConversation();
    });
    G("subscribe", "MessagingService.restored", function (e) {
      var msgs = (e && e.data && e.data.messages) || [];
      if (msgs.length) {
        state.started = true;
        handleMessages(msgs, true);
      }
    });
    G("subscribe", "MessagingService.messagesReceived", function (e) {
      handleMessages((e && e.data && e.data.messages) || [], false);
    });
    G("subscribe", "MessagingService.typingReceived", showTyping);
    G("subscribe", "MessagingService.typingTimeout", hideTyping);
    G("subscribe", "MessagingService.conversationDisconnected", endChat);
    G("subscribe", "MessagingService.readOnlyConversation", endChat);
    G("subscribe", "MessagingService.offline", function () { status.textContent = "Reconnecting\u2026"; });
    G("subscribe", "MessagingService.reconnected", function () { status.textContent = state.agentName ? "Quaystone Pay team member" : "Online now"; });
    G("subscribe", "MessagingService.error", function () {
      hideTyping();
      addSystem("Sorry, something went wrong with the chat. Please try again.");
    });
    return {
      start: function () { G("command", "MessagingService.startConversation", {}, function () {}, function () {}); },
      send: function (text, fail) { G("command", "MessagingService.sendMessage", { message: text }, function () {}, fail); },
      typing: function () { G("command", "MessagingService.sendTyping"); },
      clear: function (done) { G("command", "MessagingService.clearConversation", {}, done, done); }
    };
  }

  function loadMessenger() {
  (function (g, e, n, es, ys) {
    g["_genesysJs"] = e;
    g[e] = g[e] || function () { (g[e].q = g[e].q || []).push(arguments); };
    g[e].t = 1 * new Date();
    g[e].c = es;
    ys = document.createElement("script");
    ys.async = 1;
    ys.src = n;
    ys.charset = "utf-8";
    document.head.appendChild(ys);
  })(window, "Genesys", bootstrapUrl, { environment: environment, deploymentId: deploymentId });
  }
})();
