const form = document.querySelector("#removal-form");
const status = document.querySelector("#status");
const fallback = document.querySelector("#email-fallback");

function setStatus(message, type) {
  status.textContent = message;
  status.className = `status show ${type}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const button = form.querySelector("button");
  const emailBody = [
    `Name: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Account UID: ${data.accountUid}`,
    `Registered phone: ${data.phone}`,
    "",
    "Reason:", data.reason || "Not provided"
  ].join("\n");
  fallback.href = `mailto:support@referredby.com.na?subject=${encodeURIComponent("ReferredBy account removal request")}&body=${encodeURIComponent(emailBody)}`;
  button.disabled = true;
  button.textContent = "Sending request…";
  setStatus("Submitting your request securely…", "success");
  try {
    const response = await fetch("/api/account-removal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to send the request.");
    setStatus("Your account removal request was sent to ReferredBy Support. Please check your email for any verification follow-up.", "success");
    form.reset();
  } catch (error) {
    setStatus(`${error.message} You can send the prepared request using the email link below.`, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Submit removal request";
  }
});
