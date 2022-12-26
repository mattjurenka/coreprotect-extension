export const clamp_str_to = (n: number) => (str: string) =>
  str.length > n ?
    str.substring(0, n - 3) + "..." :
    str

export const clamp_hex = (str: string) =>
  str.length > 13 ?
    str.slice(0, 6) + "..." + str.slice(-4) :
    str

export const format_bignum = (bignum: string, decimals: number) => {
  const is_negative = bignum.charAt(0) === "-"
  if (is_negative) {
    bignum = bignum.replace("-", "0")
  }
  const padded = bignum.padStart(decimals, "0")
	const split_point = padded.length - decimals
  const before_zero = padded.slice(0, split_point)
  const after = padded.slice(split_point, padded.length)
	const prefix = before_zero || "0"
  return (is_negative ? "-" : "") + (Number(prefix).toLocaleString() + "." + after).substring(0, 15).padEnd(15, "0")
}

export const format_wei = (wei: string) => format_bignum(wei, 18)

export const format_bignum_from_hex = (wei: string, decimals: number) => {
  const bigint = BigInt(`0x${wei}`)
  console.log(wei, bigint)
  return format_bignum(bigint.toString(), decimals)
}

export const format_wei_from_hex = (wei: string) => format_bignum_from_hex(wei, 18)

export const calculate_dollar_value = (
  formatted_tokens_transferred: string, currency: string, currency_map: {[currency: string]: string | undefined},
  eth_per_token: string | undefined
): number | undefined => {
  const currency_per_eth = currency_map[currency]
  if (!currency_per_eth || !eth_per_token) {
    return
  }
  const tokens_transferred = Number(formatted_tokens_transferred.replace(/,/g, ""))
  const num_eth_per_token = Number(eth_per_token)
  return tokens_transferred * num_eth_per_token * Number(currency_per_eth)
}
