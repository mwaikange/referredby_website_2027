const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
toggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  document.body.classList.toggle("menu-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.textContent = isOpen ? "×" : "☰";
});
nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("open"); document.body.classList.remove("menu-open");
  toggle?.setAttribute("aria-expanded", "false"); if (toggle) toggle.textContent = "☰";
}));
document.querySelectorAll(".faq-question").forEach((button) => button.addEventListener("click", () => {
  const item = button.closest(".faq-item"); const answer = item.querySelector(".faq-answer");
  const isOpen = item.classList.toggle("open"); button.setAttribute("aria-expanded", String(isOpen));
  answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : "0px";
}));
document.querySelectorAll(".faq-item.open .faq-answer").forEach((answer) => { answer.style.maxHeight = `${answer.scrollHeight}px`; });
