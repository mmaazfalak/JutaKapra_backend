/**
 * Formatting utility for Pakistani Rupees (PKR)
 */
export const formatPKR = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rs. 0';
  }
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
};
