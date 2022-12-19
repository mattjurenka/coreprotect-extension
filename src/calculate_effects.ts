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
  address: create_fixed_parse_fn(64, 24),
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

export const get_effects = async (calls: [string, string, string][], data_map: any) => {
  const interesting_sigs = Object.values(effect_fnsig).flat(1)
  const effect_calls = calls.filter(([_, to, input]) => {
    if (input === undefined) {
      return false
    }
    const selector = input.slice(2, 10)
    const fn_sig: string | undefined = data_map[to]?.selectors?.[selector]
    return fn_sig && interesting_sigs.includes(fn_sig)
  })
  console.log(effect_calls, calls, data_map, interesting_sigs)

  const calls_by_contract = effect_calls.reduce((acc, [from, to, input]) => {
    const fn_sig: string = data_map[to]?.selectors?.[input.slice(2, 10)]

    if (to in acc) {
      acc[to].push([from, to, input, fn_sig])
    } else {
      acc[to] = [[from, to, input, fn_sig]]
    }
    return acc
  }, {} as {[contract:string]: [string, string, string, string][]})
  console.log(calls_by_contract)

  const call_nft_data = await Promise.all(
    Object.keys(calls_by_contract).map(contract =>
      fetch(`https://api.opensea.io/api/v1/asset_contract/${contract}`)
        .then(async res => {
          return [
            calls_by_contract[contract].map(call => call.concat([
              
            ])), await res.json()
          ] as [[string, string, string, string][], any]
        })
    )
  )

  const parsed_args = call_nft_data.map(([calls, opensea_data]) =>
    calls.map(([_, contract, input, fn_sig]) =>
      [contract, opensea_data.schema_name, fn_sig, parse_arguments(fn_sig, input)]
    )
  )

  console.log(parsed_args)
}
