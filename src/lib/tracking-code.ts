import "server-only";
import { randomInt } from "crypto";

// Tanpa 0/O/1/I/L supaya tidak gampang ketuker saat dibaca/diketik ulang.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function generateTrackingCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
