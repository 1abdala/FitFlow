export const MATRIC_PATTERN = /^B\d{9}$/;
export const MALAYSIAN_PHONE_PATTERN = /^(?:0\d{8,10}|\+60\d{8,10})$/;

export function isValidMatric(value) {
  return MATRIC_PATTERN.test(String(value || '').trim().toUpperCase());
}

export function isValidMalaysianPhone(value) {
  return MALAYSIAN_PHONE_PATTERN.test(String(value || '').trim());
}

export function isValidStudentDateOfBirth(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const birthdayPending = today.getMonth() < date.getMonth()
    || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  if (birthdayPending) age -= 1;
  return age >= 16 && age <= 100;
}

export function matricInputValue(value) {
  return String(value || '').toUpperCase().replace(/[^B0-9]/g, '').slice(0, 10);
}
