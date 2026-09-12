import { saveConsentedEstimate } from './firebase-client.js';

const form = document.querySelector('#estimate-form');
const message = document.querySelector('#form-message');
const result = document.querySelector('#result');
const value = document.querySelector('#value-result');
const repair = document.querySelector('#repair-result');
const impact = document.querySelector('#impact-result');
const detail = document.querySelector('#impact-detail');
const title = document.querySelector('#result-title');
const summary = document.querySelector('#result-summary');
const values = { smartphone: 2800, laptop: 8500, tablet: 3800, desktop: 6500, smartwatch: 1600, console: 5200, other: 1800 };
const conditionFactor = { minor: .75, moderate: .52, severe: .3, nonworking: .16 };

form.addEventListener('submit', async (event) => {
  event.preventDefault(); message.textContent = '';
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const data = Object.fromEntries(new FormData(form));
  const usageMonths = Number(data.usageMonths);
  const years = usageMonths / 12;
  const base = values[data.deviceType];
  const estimate = Math.max(100, Math.round(base * conditionFactor[data.damageLevel] * Math.max(.2, 1 - years * .09) / 100) * 100);
  const repairPercent = data.damageLevel === 'minor' ? 70 : data.damageLevel === 'moderate' ? 50 : data.damageLevel === 'severe' ? 30 : 15;
  const material = data.deviceType === 'laptop' || data.deviceType === 'desktop' ? 'higher material-recovery potential' : 'meaningful material-recovery potential';
  value.textContent = `₹${estimate.toLocaleString('en-IN')}`;
  repair.textContent = `${repairPercent}% potential`;
  impact.textContent = material;
  detail.textContent = 'Responsible reuse or recycling keeps useful materials in circulation.';
  title.textContent = `A practical next step for your ${data.deviceType.replace('smartphone', 'phone')}`;
  summary.textContent = `Based on the details provided, this is an indicative recovery estimate only. A partner must inspect the device before confirming any value.`;
  result.hidden = false; result.focus();
  const payload = { deviceType: data.deviceType, damageLevel: data.damageLevel, usageMonths, damageDescription: data.damageDescription.trim().slice(0, 500) };
  try { const response = await saveConsentedEstimate(payload); message.textContent = response.saved ? 'Your consented estimate has been saved securely.' : 'Your estimate is shown. Connect Firebase to save consented requests.'; }
  catch { message.textContent = 'Your estimate is shown, but it could not be saved. Please try again later.'; }
});
document.querySelector('#reset-estimate').addEventListener('click', () => { form.reset(); result.hidden = true; form.querySelector('#deviceType').focus(); });
