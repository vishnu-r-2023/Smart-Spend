import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const parseBankPDF = async (filePath) => {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const tokens = [];

  // 1️⃣ Collect ALL text tokens (important)
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    content.items.forEach(item => {
      const t = item.str.trim();
      if (t) tokens.push(t);
    });
  }

  const transactions = [];
  let i = 0;

  // 2️⃣ Walk token-by-token
  while (i < tokens.length) {
    const dateMatch = tokens[i].match(/^\d{2}\/\d{2}\/\d{4}$/);
    if (!dateMatch) {
      i++;
      continue;
    }

    const date = tokens[i];
    i++;

    // 3️⃣ Collect description (until amount appears)
    let description = "";
    while (i < tokens.length && !/^[\d,]+\.\d{2}$/.test(tokens[i])) {
      description += tokens[i] + " ";
      i++;
    }

    if (i + 1 >= tokens.length) break;

    const debit = tokens[i];
    const credit = tokens[i + 1];
    i += 2;

    // 4️⃣ Balance may be same or next token
    let balance = null;
    if (i < tokens.length && /^[\d,]+\.\d{2}$/.test(tokens[i])) {
      balance = tokens[i];
      i++;
    }

    if (!balance) continue;

    const debitAmt = Number(debit.replace(/,/g, ""));
    const creditAmt = Number(credit.replace(/,/g, ""));
    const balanceAmt = Number(balance.replace(/,/g, ""));

    const amount = creditAmt > 0 ? creditAmt : -debitAmt;

    transactions.push({
      date,
      description: description.trim(),
      amount,
      category: "Others",
      balance: balanceAmt
    });
  }

  return transactions;
};
