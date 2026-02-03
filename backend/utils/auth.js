import crypto from "crypto";

const HASH_ITERATIONS = 120000;
const HASH_LENGTH = 64;
const HASH_DIGEST = "sha512";
const TOKEN_BYTES = 32;

export const createSessionToken = () => {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
};

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_LENGTH, HASH_DIGEST)
    .toString("hex");
  return { salt, hash };
};

export const verifyPassword = (password, salt, hash) => {
  if (!password || !salt || !hash) {
    return false;
  }

  const hashBuffer = Buffer.from(hash, "hex");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_LENGTH, HASH_DIGEST)
    .toString("hex");
  const verifyBuffer = Buffer.from(verifyHash, "hex");

  if (hashBuffer.length !== verifyBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, verifyBuffer);
};
