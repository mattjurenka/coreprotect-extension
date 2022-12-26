import { get_data_map, set_data_map } from "./stores"

export const effect_fnsig = {
  "ERC20": [
    "transfer(address,uint256)",
    "approve(address,uint256)",
    "transferFrom(address,uint256)",
    "increaseAllowance(address,uint256)",
    "decreaseAllowance(address,uint256)",
    "mint(address,uint256)",
    "burn(uint256)",
    "burnFrom(address,uint256)",
  ],
  "ERC721": [
    "safeTransferFrom(address,address,uint256)",
    "transferFrom(address,address,uint256)",
    "approve(address,uint256)",
    "setApprovalForAll(address,bool)",
    "safeTransferFrom(address,address,uint256,bytes)",
    "mintWithTokenURI(address,uint256,string)",
    "burn(uint256)",
  ],
  "ERC1155": [
    "setApprovalForAll(address,bool)",
    "safeTransferFrom(address,address,uint256,uint256,bytes)",
    "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
    "burn(address,uint256,uint256)",
    "burnBatch(address,uint256[],uint256[])",
  ]
}

const create_fixed_parse_fn = (length: number, padding: number) =>
  (calldata: string): [string, string] => [calldata.slice(padding, length), calldata.slice(length)]

const type_to_parse_fn_map: {[type: string]: (calldata: string) => [string, string]} = {
  address: (calldata: string) => {
    const [result, left] = create_fixed_parse_fn(64, 24)(calldata)
    return ["0x" + result, left]
  },
  uint256: create_fixed_parse_fn(64, 0),
  bool: create_fixed_parse_fn(64, 63),
  bytes: (calldata: string) => {
    const [length, left] = type_to_parse_fn_map.uint256(calldata)
    return create_fixed_parse_fn(64 * Number(length), 0)(left)
  },
  "uint256[]": (calldata: string) => {
    const [length, left] = type_to_parse_fn_map.uint256(calldata)
    return create_fixed_parse_fn(64 * Number(length), 0)(left)
  }
}

const parse_arguments = (fn_sig: string, input: string): string[] => {
  const param_types = fn_sig.split("(")[1].replace(/\)/, "").split(",")
  return param_types.reduce(([acc, left_before_parse], type) => {
    const [parsed, left_after_parse] = type_to_parse_fn_map[type](left_before_parse)
    return [acc.concat([parsed]), left_after_parse] as [string[], string]
  }, [[], input.slice(10)] as [string[], string])[0]
}

const update_erc20_token_data = async (contract: string): Promise<any> => {
  const response = await fetch(
    "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
    {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        query: `{ tokens(where: {id: "${contract.toLowerCase()}"}) { id name decimals symbol derivedETH }}`
      })
    }
  )
  const data_map = await get_data_map()
  const token = (await response.json()).data.tokens[0]
  data_map[contract]["uniswap_token_info"] = token
  await set_data_map(data_map)
}

export const calculate_effects = async (calls: [string, string, string][], data_map: any): Promise<[string, string, string, string, string[]][]> => {
  const interesting_sigs = Object.values(effect_fnsig).flat(1)
  const effect_calls = calls.filter(([_, to, input]) => {
    if (input === undefined) {
      return false
    }
    const selector = input.slice(2, 10)
    const fn_sig: string | undefined = data_map[to]?.selectors?.[selector]
    return fn_sig && interesting_sigs.includes(fn_sig)
  })

  const calls_by_contract = effect_calls.reduce((acc, [from, to, input]) => {
    const fn_sig: string = data_map[to]?.selectors?.[input.slice(2, 10)]

    if (to in acc) {
      acc[to].push([from, to, input, fn_sig])
    } else {
      acc[to] = [[from, to, input, fn_sig]]
    }
    return acc
  }, {} as {[contract:string]: [string, string, string, string][]})

  const call_nft_data_map = await Promise.all(
    Object.keys(calls_by_contract).map(contract =>
      fetch(`https://api.opensea.io/api/v1/asset_contract/${contract}`)
        .then(async res => {
          return [
            calls_by_contract[contract], await res.json()
          ] as [[string, string, string, string][], any]
        })
        .then(async ([calls, opensea_data]) => {
          if (opensea_data.schema_name === "ERC20") {
            await update_erc20_token_data(calls[0][1])
          }
          return [calls, opensea_data] as [[string, string, string, string][], any]
        })
    )
  )

  return call_nft_data_map.map(([calls, opensea_data]) =>
    calls.map(([caller, contract, input, fn_sig]) =>
      [caller, contract, opensea_data.schema_name, fn_sig, parse_arguments(fn_sig, input)] as [string, string, string, string, string[]]
    )
  ).flat(1)
}
