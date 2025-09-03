export function formatAustralianNumber(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';

  if (clean.startsWith('61')) {
    return `+${clean}`;
  }
  if (clean.startsWith('0')) {
    return `+61${clean.slice(1)}`;
  }
  if (clean.length === 9) {
    return `+61${clean}`;
  }
  return `+${clean}`;
}

export function isValidAustralianNumber(input: string): boolean {
  const clean = input.replace(/\D/g, '');
  if (clean.startsWith('61')) {
    const national = clean.slice(2);
    return national.length >= 8 && national.length <= 9;
  }
  return false;
}
