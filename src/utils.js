/**
 * Simple deterministic string hash (Java-style hashCode).
 * @param {string} value
 * @returns {number}
 */
export function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
}
