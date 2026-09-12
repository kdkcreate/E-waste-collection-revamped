import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("on");
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));

  const calculatorForm = document.querySelector("#calculator-form");
  if (!calculatorForm) return;

  const deviceData = {
    smartphone: { value: 15000, carbon: 55 }, laptop: { value: 30000, carbon: 210 },
    tablet: { value: 18000, carbon: 90 }, desktop: { value: 25000, carbon: 260 },
    smartwatch: { value: 10000, carbon: 30 }, console: { value: 20000, carbon: 120 },
    other: { value: 8000, carbon: 70 }
  };
  const damageFactor = { minor: 0.82, moderate: 0.58, severe: 0.32, nonworking: 0.14 };
  let latestEstimate = null;
  const formatINR = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  const rounded = value => Math.max(0, Math.round(value / 50) * 50);
  const status = document.querySelector("#calculator-status");
  const setStatus = (message, isError = false) => { status.textContent = message; status.classList.toggle("error", isError); };
  const submitSecurely = async (collectionName, payload) => {
    const docRef = await addDoc(collection(db, collectionName), payload);
    return { reference: docRef.id };
  };

  calculatorForm.addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(calculatorForm));
    const usageMonths = Number(data.usageMonths);
    const device = deviceData[data.deviceType];
    if (!device || !damageFactor[data.damageLevel] || !Number.isFinite(usageMonths)) {
      setStatus("Please complete every required calculator field.", true);
      return;
    }
    const ageFactor = Math.max(0.16, 1 - usageMonths * 0.015);
    const value = rounded(device.value * damageFactor[data.damageLevel] * ageFactor);
    const repair = rounded(Math.max(value * 0.28, device.value * 0.12));
    const recovery = rounded(Math.max(100, device.value * (0.06 + (1 - damageFactor[data.damageLevel]) * 0.07)));
    const carbon = Math.max(4, Math.round(device.carbon * (0.38 + damageFactor[data.damageLevel] * 0.35)));
    const reuse = Math.round(Math.min(92, 22 + damageFactor[data.damageLevel] * 68 + ageFactor * 12));
    latestEstimate = { deviceType: data.deviceType, usageMonths, damageLevel: data.damageLevel, modelName: data.modelName.trim(), damageDescription: data.damageDescription.trim(), estimate: { value, repair, recovery, carbon, reuse }, createdAt: new Date().toISOString() };

    document.querySelector("#trade-value").textContent = formatINR(value);
    document.querySelector("#repair-value").textContent = formatINR(repair);
    document.querySelector("#recovery-value").textContent = formatINR(recovery);
    document.querySelector("#carbon-impact").textContent = `${carbon} kg`;
    document.querySelector("#reuse-impact").textContent = `${reuse}%`;
    document.querySelector("#result-summary").textContent = `Based on the information provided, this ${data.deviceType.replace("desktop", "desktop computer")} may be suitable for repair, reuse or responsible material recovery.`;
    document.querySelector("#social-impact").textContent = "Formal handling supports safer recovery work and keeps devices out of informal waste streams.";
    document.querySelector("#estimate-result").classList.remove("is-hidden");
    document.querySelector("#order-panel").classList.remove("is-hidden");
    document.querySelector("#estimate-result").scrollIntoView({ behavior: "smooth", block: "start" });

    const storageMessage = document.querySelector("#storage-message");
    if (!document.querySelector("#estimate-consent").checked) {
      setStatus("Estimate ready. Nothing has been stored.");
      storageMessage.textContent = "You did not consent to saving this estimate.";
      return;
    }
    setStatus("Estimate ready. Saving your consented request securely…");
    try {
      await submitSecurely("estimates", latestEstimate);
      setStatus("Estimate ready. Your consented request was saved securely.");
      storageMessage.textContent = "Your estimate was saved to NOVARA's secure database and is not readable from this website.";
    } catch {
      setStatus("Estimate ready. Secure storage is not available right now, so no information was saved.");
      storageMessage.textContent = "The calculator still works in your browser. Please try the quote form again in a moment.";
    }
  });

  document.querySelector("#order-form").addEventListener("submit", async event => {
    event.preventDefault();
    const orderStatus = document.querySelector("#order-status");
    const setOrderStatus = (message, isError = false) => { orderStatus.textContent = message; orderStatus.classList.toggle("error", isError); };
    if (!latestEstimate) { setOrderStatus("Calculate an estimate before requesting a quote.", true); return; }
    const customer = Object.fromEntries(new FormData(event.currentTarget));
    setOrderStatus("Sending your encrypted quote request…");
    try {
      const response = await submitSecurely("orders", { customer, estimate: latestEstimate });
      setOrderStatus(`Request received. Your reference is ${response.reference}. NOVARA will contact you about the final quote.`);
      event.currentTarget.reset();
    } catch {
      setOrderStatus("We could not send your request securely. Please check your connection and try again.", true);
    }
  });
});
