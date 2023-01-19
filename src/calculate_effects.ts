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
      }, number | undefined, number | undefined]
  }
} = {
  "ERC20": {
    "transfer(address,uint256)": [from_caller_to_first_arg, 1, undefined],
    "approve(address,uint256)": [from_caller_to_first_arg, 1, undefined],
    "transferFrom(address,address,uint256)": [from_first_to_second_arg, 2, undefined],
    "safeTransferFrom(address,address,uint256)": [from_first_to_second_arg, 2, undefined],
    "increaseAllowance(address,uint256)": [from_caller_to_first_arg, 1, undefined],
    "increaseApproval(address,uint256)": [from_caller_to_first_arg, 1, undefined],
    "decreaseAllowance(address,uint256)": [from_caller_to_first_arg, 1, undefined],
    "decreaseApproval(address,uint256)": [from_caller_to_first_arg, 1, undefined],
    "mint(address,uint256)": [from_caller_to_first_arg, 1, undefined],
    "burn(uint256)": [from_caller_without_to, 0, undefined],
    "burnFrom(address,uint256)": [from_first_arg_without_to, 1, undefined],
  },
  "ERC721": {
    "safeTransferFrom(address,address,uint256)": [from_first_to_second_arg, undefined, 2],
    "transferFrom(address,address,uint256)": [from_first_to_second_arg, undefined, 2],
    //"approve(address,uint256)": [from_caller_to_first_arg, undefined, 1],
    //"setApprovalForAll(address,bool)": [from_caller_to_first_arg, undefined, undefined],
    "safeTransferFrom(address,address,uint256,bytes)": [from_first_to_second_arg, undefined, 2],
    "transferFrom(address,address,uint256,bytes)": [from_first_to_second_arg, undefined, 2],
    //"mintWithTokenURI(address,uint256,string)": [from_caller_to_first_arg, undefined, 1],
    //"burn(uint256)": [from_caller_without_to, undefined, 0],
  },
  "ERC1155": {
    //"setApprovalForAll(address,bool)": [from_caller_to_first_arg, undefined, undefined],
    "safeTransferFrom(address,address,uint256,uint256,bytes)": [from_first_to_second_arg, 3, 2],
    "safeTransferFrom(address,address,uint256,bytes)": [from_first_to_second_arg, undefined, 2],
    "safeTransferFrom(address,address,uint256)": [from_first_to_second_arg, undefined, 2],
    "transferFrom(address,address,uint256,uint256,bytes)": [from_first_to_second_arg, 3, 2],
    "transferFrom(address,address,uint256,bytes)": [from_first_to_second_arg, undefined, 2],
    "transferFrom(address,address,uint256)": [from_first_to_second_arg, undefined, 2],
    //"safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)": [],
    //"burn(address,uint256,uint256)",
    //"burnBatch(address,uint256[],uint256[])",
  }
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
  calls: [string, string, string, {from: string, to: string} | undefined][], data_map: any,
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

  const calls_by_contract = effect_calls.reduce((acc, [from, to, input, delegate_info]) => {
    const fn_sig: string = data_map[to]?.selectors?.[input.slice(2, 10)]
    const call_info: [string, string, string, string] = [
      delegate_info?.from || from, delegate_info?.to || to, input, fn_sig
    ]

    if (to in acc) {
      acc[to].push(call_info)
    } else {
      acc[to] = [call_info]
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
      const [calc_parties, value_idx, nft_idx] = effect_fnsig[opensea_data.schema_name][fn_sig]
      const { from, to } = calc_parties(caller, args)
      return {
        caller, contract, schema_name: opensea_data.schema_name, fn_sig,
        args, from, to, type: "erc20", name: opensea_data.name,
        value: value_idx !== undefined ? args[value_idx] : "1",
        nft_id: nft_idx !== undefined ? BigInt("0x" + args[nft_idx]).toString() : undefined
      } as CallInfo
    })
  ).flat(1)

  const with_nft_info = await Promise.all(all_calls.map(async call =>
    call.nft_id ?
      fetch(`https://api.opensea.io/api/v1/asset/${call.contract}/${call.nft_id}/`)
        .then(async res => {
          const data = await res.json()
          call.nft_link = data.external_link || data.permalink
          call.nft_name = data.name
          call.nft_picture = data.image_url
          return call
        }) :
      call
  ))

  return with_nft_info.reduce((acc, cur) => {
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

