import { CallInfo, EffectType, EthTransfer } from "./stores"

const from_caller_to_first_arg = (caller: string, args: string[]) => ({
  from: caller, to: args[0]
})

const from_first_to_second_arg = (caller: string, args: string[]) => ({
  from: args[0], to: args[1]
})

const from_caller_without_to = (caller: string, args: string[]) => ({
  from: caller, to: undefined
})

const from_first_arg_without_to = (caller: string, args: string[]) => ({
  from: args[0], to: undefined
})

export const effect_fnsig: {
  [schema: string]: {
    [fn_sig: string]: [
      (caller: string, args: string[]) => {
        from: string | undefined,
        to: string | undefined
      }, number]
  }
} = {
  "ERC20": {
    "transfer(address,uint256)": [from_caller_to_first_arg, 1],
    "approve(address,uint256)": [from_caller_to_first_arg, 1],
    "transferFrom(address,address,uint256)": [from_first_to_second_arg, 2],
    "increaseAllowance(address,uint256)": [from_caller_to_first_arg, 1],
    "increaseApproval(address,uint256)": [from_caller_to_first_arg, 1],
    "decreaseAllowance(address,uint256)": [from_caller_to_first_arg, 1],
    "decreaseApproval(address,uint256)": [from_caller_to_first_arg, 1],
    "mint(address,uint256)": [from_caller_to_first_arg, 1],
    "burn(uint256)": [from_caller_without_to, 0],
    "burnFrom(address,uint256)": [from_first_arg_without_to, 1],
  },
//  "ERC721": [
//    "safeTransferFrom(address,address,uint256)",
//    "transferFrom(address,address,uint256)",
//    "approve(address,uint256)",
//    "setApprovalForAll(address,bool)",
//    "safeTransferFrom(address,address,uint256,bytes)",
//    "mintWithTokenURI(address,uint256,string)",
//    "burn(uint256)",
//  ],
//  "ERC1155": [
//    "setApprovalForAll(address,bool)",
//    "safeTransferFrom(address,address,uint256,uint256,bytes)",
//    "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
//    "burn(address,uint256,uint256)",
//    "burnBatch(address,uint256[],uint256[])",
//  ]
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


export const calculate_effects = async (
  calls: [string, string, string][], data_map: any,
  first_address: string | undefined
): Promise<Record<EffectType, (CallInfo | EthTransfer)[]>> => {
  const interesting_sigs = Object.values(effect_fnsig).map(Object.keys).flat(1)
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
    )
  )

  const all_calls = call_nft_data_map.map(([calls, opensea_data]) =>
    calls.map(([caller, contract, input, fn_sig]) => {
      const args = parse_arguments(fn_sig, input)
      const [calc_parties, value_idx] = effect_fnsig[opensea_data.schema_name][fn_sig]
      const { from, to } = calc_parties(caller, args)
      return {
        caller, contract, schema_name: opensea_data.schema_name, fn_sig,
        args, from, to, type: "erc20", value: args[value_idx]
      } as CallInfo
    })
  ).flat(1)

  return all_calls.reduce((acc, cur) => {
    if ([
      "approve(address,uint256)", "increaseAllowance(address,uint256)",
      "increaseApproval(address,uint256)", "decreaseAllowance(address,uint256)",
      "decreaseApproval(address,uint256)",
    ].includes(cur.fn_sig)) {
      acc["approval"].push(cur)
    } else if (cur.to && cur.to === first_address) {
      acc["inbound"].push(cur)
    } else if (cur.from && cur.from === first_address) {
      acc["outbound"].push(cur)
    } else {
      acc["external"].push(cur)
    }
    return acc
  }, {
    inbound: [],
    outbound: [],
    approval: [],
    external: [],
  } as Record<EffectType, (CallInfo | EthTransfer)[]>)
}

