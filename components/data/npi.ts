// NPI check digit: Luhn over "80840" + the first nine digits (CMS NPI standard).
// Format check only: a valid NPI doesn't prove who the prescriber is.
export function isValidNpi(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;
  const digits = ("80840" + npi.slice(0, 9)).split("").map(Number);
  let sum = 0;
  let double = true; // the digit left of the check digit is doubled
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return (10 - (sum % 10)) % 10 === Number(npi[9]);
}
