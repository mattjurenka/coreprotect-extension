export const clamp_str_to = (n: number) => (str: string) =>
  str.length > n ?
    str.substring(0, n - 3) + "..." :
    str

export const clamp_hex = (str: string) =>
  str.length > 13 ?
    str.slice(0, 6) + "..." + str.slice(-4) :
    str

export const format_wei = (wei: string) => {
  const is_negative = wei.charAt(0) === "-"
  if (is_negative) {
    wei = wei.replace("-", "0")
  }
  const padded = wei.padStart(18, "0")
	const split_point = padded.length - 18
  const before_zero = padded.slice(0, split_point)
  const after = padded.slice(split_point, padded.length)
	const prefix = before_zero || "0"
  return (is_negative ? "-" : "") + (Number(prefix).toLocaleString() + "." + after).substring(0, 15)
}
