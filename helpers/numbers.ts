export const formatNumberWithCommas = (num: number | string): string => {
  const _num = typeof num === "string" ? parseFloat(num) : num;
  return _num
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
