import crypto from 'node:crypto';

/**
 * Returns the SHA-256 hash of a string.
 * Used for storing hashed refresh tokens securely in the database.
 *
 * @param {string} token
 * @returns {string} Hex encoded hash
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generates a cryptographically strong random hex token.
 *
 * @param {number} [bytes=64]
 * @returns {string} Hex token
 */
export const generateToken = (bytes = 64) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param {string} text Plaintext to encrypt
 * @param {string} keyHex 32-byte (64 char hex) encryption key
 * @returns {string} Combined iv:tag:encrypted string
 */
export const encrypt = (text, keyHex) => {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an AES-256-GCM encrypted string.
 *
 * @param {string} encryptedString Combined iv:tag:encrypted string
 * @param {string} keyHex 32-byte (64 char hex) encryption key
 * @returns {string} Decrypted plaintext
 */
export const decrypt = (encryptedString, keyHex) => {
  const [ivHex, tagHex, encryptedData] = encryptedString.split(':');
  if (!ivHex || !tagHex || !encryptedData) {
    throw new Error('Invalid encrypted string format');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
