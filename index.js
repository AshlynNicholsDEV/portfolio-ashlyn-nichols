/* Portfolio interactions. No email is sent until the visitor submits the form. */
const contactModal = document.getElementById("contact-modal");
const contactForm = document.getElementById("contact__form");
const contactStatus = document.getElementById("contact-status");
const submitButton = document.getElementById("contact__submit");
const loadingOverlay = document.querySelector(".modal__overlay--loading");
const successOverlay = document.querySelector(".modal__overlay--success");
let submitting = false;

function setOverlay(overlay, visible) {
  overlay.classList.toggle("modal__overlay--visible", visible);
  overlay.setAttribute("aria-hidden", String(!visible));
}

function openContactModal() {
  if (contactModal.open) return;
  contactStatus.textContent = "";
  setOverlay(successOverlay, false);
  contactModal.showModal();
  document.body.classList.add("modal--open");
}

function closeContactModal() {
  contactModal.close();
}

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", openContactModal);
});
document.querySelector("[data-close-modal]").addEventListener("click", closeContactModal);
contactModal.addEventListener("close", () => document.body.classList.remove("modal--open"));

const themeButton = document.querySelector("[data-theme-toggle]");
themeButton.addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark-theme");
  themeButton.setAttribute("aria-pressed", String(dark));
});

// EmailJS public account settings. All three must come from the same account.
const emailSettings = {
  publicKey: "oMkSYnPVzHlKJQKXC",
  serviceId: "service_78gf9fh",
  templateId: "template_paf55np",
};

function emailErrorMessage(error) {
  const status = Number(error?.status);
  const detail = String(error?.text || error?.message || "").toLowerCase();
  if (status === 429) {
    return "Too many messages were requested. Please wait a moment and try again.";
  }
  if (detail.includes("public key") || detail.includes("user id") ||
      detail.includes("service") || detail.includes("template") ||
      status === 401 || status === 403) {
    return "The email service is not configured correctly. Please contact me on LinkedIn while I fix it.";
  }
  if (status === 0 || !navigator.onLine) {
    return "The email service could not be reached. Check your internet connection and try again.";
  }
  return "Your message could not be sent. Please try again later or contact me on LinkedIn.";
}

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting) return;
  // Prevent spaces alone from being accepted as a name or message.
  ["user_name", "message"].forEach((name) => {
    const field = contactForm.elements.namedItem(name);
    field.setCustomValidity(field.value.trim() ? "" : "Please fill out this field.");
  });
  if (!contactForm.reportValidity()) return;
  contactStatus.textContent = "";
  if (typeof window.emailjs?.sendForm !== "function") {
    contactStatus.textContent = "The contact service could not load. Please try again later or contact me on LinkedIn.";
    return;
  }
  if (Object.values(emailSettings).some((value) => !value?.trim())) {
    contactStatus.textContent = "The email service is not configured yet. Please contact me on LinkedIn.";
    return;
  }
  setOverlay(successOverlay, false);
  submitting = true;
  submitButton.disabled = true;
  contactForm.setAttribute("aria-busy", "true");
  setOverlay(loadingOverlay, true);
  try {
    await window.emailjs.sendForm(emailSettings.serviceId, emailSettings.templateId, contactForm, {
      publicKey: emailSettings.publicKey,
    });
    contactForm.reset();
    setOverlay(successOverlay, true);
    contactStatus.textContent = "Your message was sent. Thank you!";
  } catch (error) {
    // Keep the visitor's message intact and log the actual SDK error for debugging.
    console.error("EmailJS submission failed:", error?.status, error?.text || error?.message);
    contactStatus.textContent = emailErrorMessage(error);
  } finally {
    submitting = false;
    submitButton.disabled = false;
    contactForm.removeAttribute("aria-busy");
    setOverlay(loadingOverlay, false);
  }
});

// Keep the background movement added during the review.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function moveBackground(event) {
  if (reducedMotion.matches || event.pointerType === "touch") return;
  const x = event.clientX / 20;
  const y = event.clientY / 20;
  document.querySelectorAll(".shape").forEach((shape, index) => {
    const direction = index % 2 ? -1 : 1;
    shape.style.transform = `translate(${x * direction}px, ${y * direction}px) rotate(${x * direction * 10}deg)`;
  });
}
document.getElementById("landing-page").addEventListener("pointermove", moveBackground);

contactForm.addEventListener("input", (event) => {
  if (typeof event.target.setCustomValidity === "function") {
    event.target.setCustomValidity("");
  }
});
