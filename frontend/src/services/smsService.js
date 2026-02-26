import { Capacitor, registerPlugin } from "@capacitor/core";

export const SMS_PERMISSION_REQUIRED_MESSAGE = "SMS access required to auto-detect transactions";

const SMS_PLUGIN_NAMES = ["SmsReader"];
const CHECK_PERMISSION_METHOD_NAMES = [
  "checkPermissions",
  "checkPermission",
  "hasPermissions",
  "hasPermission"
];
const REQUEST_PERMISSION_METHOD_NAMES = [
  "requestPermissions",
  "requestPermission",
  "askPermissions",
  "askPermission"
];
const GET_MESSAGES_METHOD_NAMES = [
  "getAllSms",
  "getMessages",
  "readSMS",
  "readSms",
  "getSMS",
  "getSmsMessages",
  "listMessages"
];

const SENDER_KEYWORDS = ["BANK", "BNK", "SBI", "ICICI", "HDFC", "AXIS", "IND", "CAN", "CB", "UPI", "PAYTM"];
const DEBIT_KEYWORDS = ["DEBITED", "SPENT", "WITHDRAWN", "PURCHASE", "PAID", "TXN OF"];
const CREDIT_KEYWORDS = ["CREDITED", "DEPOSITED", "SALARY", "RECEIVED", "REFUND", "CASHBACK"];
const TRANSACTION_HINTS = [...DEBIT_KEYWORDS, ...CREDIT_KEYWORDS, "TXN", "UPI", "POS", "IMPS", "NEFT", "RTGS"];
const AMOUNT_REGEX = /\u20B9?\s?(\d{1,3}(,\d{3})*(\.\d{2})?)/g;
const AMOUNT_FALLBACK_REGEX = /(?:\u20B9|rs\.?|inr)?\s?(\d+(?:,\d{3})*(?:\.\d{1,2})?)/gi;
const DATE_REGEX = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/;

const isMissingMethodError = (error) => {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("not implemented") ||
    (message.includes("plugin") && message.includes("not")) ||
    message.includes("does not have") ||
    message.includes("unable to find") ||
    message.includes("unimplemented")
  );
};

const callSmsPlugin = async (methodNames, payloads = [undefined]) => {
  let lastError = null;

  for (const pluginName of SMS_PLUGIN_NAMES) {
    const plugin = registerPlugin(pluginName);

    for (const methodName of methodNames) {
      if (typeof plugin[methodName] !== "function") continue;

      for (const payload of payloads) {
        try {
          if (typeof payload === "undefined") {
            return await plugin[methodName]();
          }
          return await plugin[methodName](payload);
        } catch (error) {
          lastError = error;
          if (isMissingMethodError(error)) {
            continue;
          }
          throw error;
        }
      }
    }
  }

  throw lastError || new Error("SMS plugin is not available");
};

const containsAny = (text = "", keywords = []) => {
  const source = String(text || "").toUpperCase();
  return keywords.some((keyword) => source.includes(keyword));
};

const toTimestamp = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : 0;
  }

  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 0 ? numeric : 0;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeSMS = (sms = {}) => {
  const sender = sms.address || sms.sender || sms.originatingAddress || sms.phone || "";
  const body = sms.body || sms.message || sms.text || sms.content || "";
  const timestamp = toTimestamp(
    sms.date ??
      sms.timestamp ??
      sms.dateSent ??
      sms.receivedAt ??
      sms.sentAt ??
      sms.time ??
      0
  );

  return {
    sender: String(sender || "").trim(),
    body: String(body || "").trim(),
    timestamp
  };
};

const extractMessagesArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.sms)) return payload.sms;
  if (Array.isArray(payload?.list)) return payload.list;
  return [];
};

const normalizeYear = (year) => {
  if (year.length === 2) {
    return Number(`20${year}`);
  }
  return Number(year);
};

const formatDate = (day, month, year) => {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
};

const dateFromTimestamp = (timestamp) => {
  const date = new Date(timestamp || Date.now());
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return formatDate(now.getDate(), now.getMonth() + 1, now.getFullYear());
  }
  return formatDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
};

const extractDateFromBody = (body = "", timestamp = 0) => {
  const match = DATE_REGEX.exec(body);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = normalizeYear(match[3]);
    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year) &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12
    ) {
      return formatDate(day, month, year);
    }
  }
  return dateFromTimestamp(timestamp);
};

const extractAmount = (body = "") => {
  AMOUNT_REGEX.lastIndex = 0;
  AMOUNT_FALLBACK_REGEX.lastIndex = 0;
  const regexMatches = [];
  let match = AMOUNT_REGEX.exec(body);
  while (match) {
    regexMatches.push(match[1]);
    match = AMOUNT_REGEX.exec(body);
  }

  const candidates = regexMatches.length > 0 ? regexMatches : [];
  if (candidates.length === 0) {
    let fallbackMatch = AMOUNT_FALLBACK_REGEX.exec(body);
    while (fallbackMatch) {
      candidates.push(fallbackMatch[1]);
      fallbackMatch = AMOUNT_FALLBACK_REGEX.exec(body);
    }
    AMOUNT_FALLBACK_REGEX.lastIndex = 0;
  }

  for (const candidate of candidates) {
    const value = Number(String(candidate).replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
};

const detectType = (body = "") => {
  const text = body.toUpperCase();
  const debitIndex = DEBIT_KEYWORDS.reduce((min, keyword) => {
    const index = text.indexOf(keyword);
    if (index === -1) return min;
    return min === -1 ? index : Math.min(min, index);
  }, -1);
  const creditIndex = CREDIT_KEYWORDS.reduce((min, keyword) => {
    const index = text.indexOf(keyword);
    if (index === -1) return min;
    return min === -1 ? index : Math.min(min, index);
  }, -1);

  if (debitIndex === -1 && creditIndex === -1) return null;
  if (debitIndex === -1) return "credit";
  if (creditIndex === -1) return "debit";
  return debitIndex <= creditIndex ? "debit" : "credit";
};

const cleanDescriptionFragment = (value = "") => {
  return String(value)
    .replace(/\b(a\/c|acct|account|xx\d+)\b/gi, " ")
    .replace(/[^a-zA-Z0-9&.\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractDescription = ({ body = "", sender = "", type = "" }) => {
  const patterns = [
    /\bfor\s+([a-zA-Z0-9&.\- ]{2,48})/i,
    /\bat\s+([a-zA-Z0-9&.\- ]{2,48})/i,
    /\bto\s+([a-zA-Z0-9&.\- ]{2,48})/i,
    /\bvia\s+([a-zA-Z0-9&.\- ]{2,48})/i
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(body);
    const fragment = cleanDescriptionFragment(match?.[1] || "");
    if (fragment) {
      return `SMS - ${fragment}`;
    }
  }

  const senderLabel = cleanDescriptionFragment(sender) || "Bank";
  const typeLabel = type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : "Txn";
  return `SMS - ${senderLabel} ${typeLabel}`.trim();
};

const duplicateKey = (tx = {}) => {
  const date = String(tx.date || "").trim();
  const amount = Number(tx.amount || 0).toFixed(2);
  const description = String(tx.description || "").trim().toLowerCase();
  return `${date}|${amount}|${description}`;
};

const buildPayload = (tx = {}) => ({
  date: tx.date,
  description: tx.description,
  amount: tx.amount,
  category: tx.amount > 0 ? "Income" : "Others",
  paymentMethod: "Bank Transfer",
  notes: "Imported from SMS"
});

const maxTimestamp = (messages = []) =>
  messages.reduce(
    (max, message) =>
      Math.max(max, Number(message?.timestamp ?? message?.smsTimestamp) || 0),
    0
  );

const isPermissionGranted = (result) => {
  if (typeof result === "boolean") return result;
  if (typeof result === "string") return result.toLowerCase() === "granted";
  if (!result || typeof result !== "object") return false;

  if (typeof result.hasPermission === "boolean") return result.hasPermission;

  return Object.values(result).some((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "granted";
    return false;
  });
};

export const isSMSImportSupported = () => Capacitor.getPlatform() === "android";

export const ensureSMSPermission = async () => {
  if (!isSMSImportSupported()) {
    throw new Error("SMS import is available only on Android");
  }

  const permissionPayloads = [undefined, { permissions: ["sms"] }];
  const checkResult = await callSmsPlugin(CHECK_PERMISSION_METHOD_NAMES, permissionPayloads).catch((error) => {
    if (isMissingMethodError(error)) return null;
    throw error;
  });

  if (isPermissionGranted(checkResult)) {
    return { granted: true };
  }

  const requestResult = await callSmsPlugin(REQUEST_PERMISSION_METHOD_NAMES, permissionPayloads).catch((error) => {
    const message = String(error?.message || "").toLowerCase();
    if (
      message.includes("denied") ||
      message.includes("permission") ||
      message === SMS_PERMISSION_REQUIRED_MESSAGE.toLowerCase()
    ) {
      return null;
    }
    throw error;
  });

  if (!isPermissionGranted(requestResult)) {
    throw new Error(SMS_PERMISSION_REQUIRED_MESSAGE);
  }

  return { granted: true };
};

export const readBankSMS = async ({ fromTimestamp = 0, limit = 1000 } = {}) => {
  if (!isSMSImportSupported()) {
    throw new Error("SMS import is available only on Android");
  }

  const minDate = Math.max(0, Number(fromTimestamp) || 0);
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 1000));

  const response = await callSmsPlugin(GET_MESSAGES_METHOD_NAMES, [
    { minDate, maxCount: safeLimit, limit: safeLimit },
    { minDate, limit: safeLimit },
    { limit: safeLimit },
    undefined
  ]);

  return extractMessagesArray(response)
    .map(normalizeSMS)
    .filter((item) => item.body.length > 0)
    .filter((item) => (item.timestamp === 0 ? minDate === 0 : item.timestamp >= minDate))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, safeLimit);
};

export const filterBankMessages = (messages = []) => {
  return messages.filter((message) => {
    const sender = String(message?.sender || "");
    const body = String(message?.body || "");
    const bankSender = containsAny(sender, SENDER_KEYWORDS);
    const bankContent = containsAny(body, SENDER_KEYWORDS) || /\b(a\/c|acct|account|bank)\b/i.test(body);
    const transactionLike = containsAny(body, TRANSACTION_HINTS);
    return transactionLike && (bankSender || bankContent);
  });
};

export const extractTransaction = (message = {}) => {
  const body = String(message?.body || "");
  const sender = String(message?.sender || "");
  const type = detectType(body);
  if (!type) return null;

  const amount = extractAmount(body);
  if (!amount) return null;

  const signedAmount = type === "debit" ? -Math.abs(amount) : Math.abs(amount);
  const date = extractDateFromBody(body, Number(message?.timestamp) || 0);
  const description = extractDescription({ body, sender, type });

  return {
    date,
    description,
    amount: signedAmount,
    type,
    smsTimestamp: Number(message?.timestamp) || 0
  };
};

export const parseSMSMessages = (messages = []) => {
  const bankMessages = filterBankMessages(messages);
  const seen = new Set();
  const transactions = [];

  for (const message of bankMessages) {
    const tx = extractTransaction(message);
    if (!tx) continue;
    const key = duplicateKey(tx);
    if (seen.has(key)) continue;
    seen.add(key);
    transactions.push(tx);
  }

  return transactions;
};

export const sendToBackend = async ({
  transactions = [],
  apiBase,
  authToken,
  existingTransactions = [],
  batchSize = 25
}) => {
  if (!apiBase || !authToken) {
    throw new Error("Missing API configuration for SMS import");
  }

  const uniqueExisting = new Set(existingTransactions.map(duplicateKey));
  const toUpload = [];
  let skippedDuplicates = 0;

  for (const tx of transactions) {
    const key = duplicateKey(tx);
    if (uniqueExisting.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    uniqueExisting.add(key);
    toUpload.push(tx);
  }

  if (toUpload.length === 0) {
    return {
      attemptedCount: transactions.length,
      insertedCount: 0,
      skippedDuplicates,
      latestTimestamp: maxTimestamp(transactions)
    };
  }

  const chunkSize = Math.max(1, Number(batchSize) || 25);
  let insertedCount = 0;

  for (let index = 0; index < toUpload.length; index += chunkSize) {
    const chunk = toUpload.slice(index, index + chunkSize);
    const responses = await Promise.all(
      chunk.map((tx) =>
        fetch(`${apiBase}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify(buildPayload(tx))
        })
      )
    );

    for (const response of responses) {
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Backend error while importing SMS transactions");
      }
    }

    insertedCount += chunk.length;
  }

  return {
    attemptedCount: transactions.length,
    insertedCount,
    skippedDuplicates,
    latestTimestamp: maxTimestamp(transactions)
  };
};
