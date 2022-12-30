import Decimal from "decimal.js"

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
  tokens_transferred: Decimal, currency: string,
  currency_map: {[currency: string]: string | undefined}, eth_per_token: Decimal
): Decimal | undefined => {
  const currency_per_eth = currency_map?.[currency]
  if (!currency_per_eth) {
    return undefined
  }
  return tokens_transferred.mul(new Decimal(currency_per_eth)).mul(eth_per_token)
}

export const add_commas = (number_str: string) => number_str.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
export const format_decimal = (n: Decimal) => add_commas(n.toSD(8).toString())
