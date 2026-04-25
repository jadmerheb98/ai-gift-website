const API_URL = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/generate-gift"; // Replace after deploying Cloudflare Worker

const form = document.getElementById("giftForm");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const clearBtn = document.getElementById("clearBtn");
const formMessage = document.getElementById("formMessage");
const customizer = document.getElementById("customizer");
const customizerContent = document.getElementById("customizerContent");
document.getElementById("year").textContent = new Date().getFullYear();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  const payload = getFormPayload();

  if (!payload.recipient.trim() && !payload.prompt.trim()) {
    formMessage.textContent = "Please write who the gift is for or describe the gift request.";
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("AI request failed. Check your Worker URL and API key.");
    const data = await response.json();
    renderResults(data.gifts || []);
  } catch (error) {
    console.error(error);
    formMessage.textContent = "AI is not connected yet. Showing demo gift ideas for now.";
    renderResults(getDemoGifts(payload));
  } finally {
    setLoading(false);
  }
});

clearBtn.addEventListener("click", () => {
  results.innerHTML = "Your AI gift ideas will appear here.";
  results.className = "results-empty";
  customizer.classList.add("hidden");
});

function getFormPayload() {
  return {
    recipient: document.getElementById("recipient").value,
    occasion: document.getElementById("occasion").value,
    budget: document.getElementById("budget").value,
    delivery: document.getElementById("delivery").value,
    prompt: document.getElementById("prompt").value
  };
}

function setLoading(isLoading) {
  loading.classList.toggle("hidden", !isLoading);
  results.classList.toggle("hidden", isLoading);
  document.getElementById("generateBtn").disabled = isLoading;
}

function renderResults(gifts) {
  results.className = "";
  if (!gifts.length) {
    results.className = "results-empty";
    results.textContent = "No gift ideas found. Try adding more details.";
    return;
  }

  results.innerHTML = gifts.map((gift, index) => `
    <article class="gift-card">
      <h4>${escapeHtml(gift.name)}</h4>
      <p>${escapeHtml(gift.description)}</p>
      <div class="tag-row">
        <span class="tag">${escapeHtml(gift.estimatedPrice || "Custom price")}</span>
        <span class="tag">${escapeHtml(gift.style || "Personalized")}</span>
        <span class="tag">${escapeHtml(gift.deliveryFit || "Delivery ready")}</span>
      </div>
      <strong>Included items</strong>
      <ul class="item-list">${(gift.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <strong>Card message</strong>
      <p>${escapeHtml(gift.cardMessage || "")}</p>
      <button class="select-btn" onclick='selectGift(${JSON.stringify(gift).replace(/'/g, "&#39;")})'>Customize this gift</button>
    </article>
  `).join("");
}

window.selectGift = function(gift) {
  customizer.classList.remove("hidden");
  customizerContent.innerHTML = `
    <h3>${escapeHtml(gift.name)}</h3>
    <p>${escapeHtml(gift.description)}</p>
    <div class="customizer-grid">
      <label>Packaging color
        <select id="packagingColor"><option>Warm beige</option><option>Luxury black</option><option>Soft pink</option><option>White & gold</option><option>Custom</option></select>
      </label>
      <label>Delivery choice
        <select id="deliveryChoice"><option>Pickup</option><option>Standard delivery</option><option>Same-day delivery</option></select>
      </label>
    </div>
    <label style="margin-top:18px">Modify items
      <textarea id="modifyItems" rows="4">${escapeHtml((gift.items || []).join("\n"))}</textarea>
    </label>
    <label style="margin-top:18px">Card message
      <textarea id="cardMessage" rows="3">${escapeHtml(gift.cardMessage || "")}</textarea>
    </label>
    <div class="customizer-actions">
      <button class="primary-btn" onclick="createOrderSummary()">Create Order Summary</button>
      <button class="secondary-btn" onclick="window.print()">Print / Save PDF</button>
    </div>
    <div id="orderSummary" class="summary-box hidden"></div>
  `;
  customizer.scrollIntoView({ behavior: "smooth" });
}

window.createOrderSummary = function() {
  const summary = document.getElementById("orderSummary");
  const selectedTitle = customizerContent.querySelector("h3").textContent;
  const packaging = document.getElementById("packagingColor").value;
  const delivery = document.getElementById("deliveryChoice").value;
  const items = document.getElementById("modifyItems").value;
  const message = document.getElementById("cardMessage").value;
  summary.classList.remove("hidden");
  summary.textContent = `ORDER REQUEST\n\nGift: ${selectedTitle}\nPackaging: ${packaging}\nDelivery: ${delivery}\n\nItems:\n${items}\n\nCard Message:\n${message}\n\nCustomer Name:\nPhone Number:\nDelivery Address:\nPreferred Date & Time:`;
}

function getDemoGifts(payload) {
  const who = payload.recipient || "someone special";
  return [
    {
      name: `Signature Gift Box for ${who}`,
      description: "A warm personalized box built around their personality, occasion, and budget.",
      estimatedPrice: payload.budget || "$45 - $75",
      style: "Elegant",
      deliveryFit: payload.delivery || "Delivery optional",
      items: ["Fresh flower mini bouquet", "Customized scented candle", "Premium chocolate box", "Handwritten message card"],
      cardMessage: "A small gift for a very special person. Wishing you love, joy, and beautiful moments."
    },
    {
      name: "Cozy Self-Care Basket",
      description: "A relaxing customized gift for someone who deserves comfort and attention.",
      estimatedPrice: payload.budget || "$35 - $65",
      style: "Soft & personal",
      deliveryFit: "Easy delivery",
      items: ["Tea or coffee selection", "Soft towel", "Skincare item", "Personalized name tag"],
      cardMessage: "You deserve every calm and beautiful moment today."
    }
  ];
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
