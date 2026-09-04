import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();
const termsSource = process.argv[2];
const privacySource = process.argv[3];

if (!termsSource || !privacySource) {
  throw new Error("Usage: node scripts/update-legal.mjs TERMS_TEXT PRIVACY_TEXT");
}

const legalCss = `.legal-document{padding:clamp(24px,5vw,56px)}
.legal-document h1{margin-bottom:4px}.legal-document .legal-updated{color:#00827f;font-weight:700;margin:0 0 30px}
.legal-document h2{font-size:1.45rem;margin:36px 0 12px;padding-top:22px;border-top:1px solid #e6e8ef}
.legal-document h3{color:#0d0a4d;font-size:1rem;margin:22px 0 7px}.legal-document p{margin:0 0 14px}
.legal-document strong{color:#242634}.legal-document a{color:#007f7c;text-decoration:underline;text-underline-offset:3px}`;

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const linkify = (value) => escapeHtml(value)
  .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
  .replace(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>');

function renderLegal({ source, template, destination, documentTitle, appLabel, headings }) {
  let text = fs.readFileSync(source, "utf8").replace(/[\u200B\uFEFF]/g, "");
  text = text.replace(new RegExp(`^${documentTitle}\\s*\\r?\\nIntroduction`, "i"), `${documentTitle}\n\nIntroduction`);
  const blocks = text.split(/\r?\n\s*\r?\n/).map((block) => block.replace(/\s+/g, " ").trim()).filter(Boolean);
  const parts = ['<section class="panel legal-document">'];

  for (const block of blocks) {
    const clean = block.replace(/^\*\*(.*?)\*\*$/, "$1");
    if (clean.toUpperCase() === documentTitle) {
      parts.push(`<h1>${documentTitle.replace(/\b\w/g, (letter) => letter.toUpperCase()).toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())}</h1><p class="legal-updated">${appLabel}</p>`);
    } else if (headings.has(clean)) {
      parts.push(`<h2>${escapeHtml(clean)}</h2>`);
    } else if (clean.endsWith(":") && clean.length < 90) {
      parts.push(`<h3>${escapeHtml(clean)}</h3>`);
    } else if (/^[A-Z0-9][A-Z0-9\s,.'’()&/-]{20,}$/.test(clean) || block.startsWith("**")) {
      parts.push(`<p><strong>${linkify(clean)}</strong></p>`);
    } else {
      parts.push(`<p>${linkify(clean)}</p>`);
    }
  }
  parts.push("</section>");

  let html = fs.readFileSync(template, "utf8");
  html = html.replace(/<section class="panel(?: legal-document)?">[\s\S]*?<\/section>/, parts.join(""));
  html = html.replace(/<title>.*?<\/title>/i, `<title>ReferredBy ${documentTitle.replace(/\b\w/g, (letter) => letter.toUpperCase()).toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())}</title>`);
  html = html.replaceAll('href="index.html"', 'href="/"').replaceAll('href="referredby_landing_v3.html"', 'href="/"');
  if (!html.includes(".legal-document{")) html = html.replace("</style>", `${legalCss}</style>`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, html, "utf8");
  return blocks.length;
}

const termsHeadings = new Set([
  "Introduction", "Definitions", "Additional Terms", "Registration", "Use of the ReferredBy App", "Fees and Costs",
  "Transacting through the ReferredBy App", "Dormant Profiles", "Warranties by you", "ReferredBy App Security",
  "Software and Hardware", "Right of the App Store", "Disclaimer", "Data Protection", "Intellectual Property",
  "Sanctions", "Closure", "General", "Notices", "Customer Contact Information"
]);
const privacyHeadings = new Set([
  "Introduction", "Acceptance of Privacy Notice", "Other Agreements", "Personal, Employer & Next of Kin Information",
  "When and what Information we collect", "How we use the information we collect", "Accessing and updating your personal information",
  "Information we share", "Your Obligations", "Our Cookie Policy", "Links to Other Websites", "Amendments and Changes"
]);

const termsCount = renderLegal({ source: termsSource, template: path.join(workspace, "terms.html"), destination: path.join(workspace, "terms", "index.html"), documentTitle: "TERMS OF SERVICE", appLabel: "ReferredBy App", headings: termsHeadings });
const privacyCount = renderLegal({ source: privacySource, template: path.join(workspace, "privacy.html"), destination: path.join(workspace, "privacy", "index.html"), documentTitle: "PRIVACY POLICY", appLabel: "ReferredBy Financial Solutions cc", headings: privacyHeadings });

let faq = fs.readFileSync(path.join(workspace, "faq.html"), "utf8");
faq = faq.replaceAll('href="index.html"', 'href="/"').replaceAll('href="referredby_landing_v3.html"', 'href="/"');
fs.mkdirSync(path.join(workspace, "faq"), { recursive: true });
fs.writeFileSync(path.join(workspace, "faq", "index.html"), faq, "utf8");

const landingPath = path.join(workspace, "index.html");
let landing = fs.readFileSync(landingPath, "utf8");
landing = landing.replaceAll('href="faq.html"', 'href="/faq"').replaceAll('href="privacy.html"', 'href="/privacy"').replaceAll('href="terms.html"', 'href="/terms"');
if (!landing.includes('href="/account-removal"')) {
  landing = landing.replace(
    '<a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a>',
    '<a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/account-removal">Request Account Removal</a>'
  );
}
fs.writeFileSync(landingPath, landing, "utf8");

console.log(`Updated Terms (${termsCount} blocks), Privacy (${privacyCount} blocks), and clean routes.`);
