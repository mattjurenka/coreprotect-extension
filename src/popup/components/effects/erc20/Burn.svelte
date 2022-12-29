<script>
  import Etherscanlink from "../../etherscanlink.svelte";
  import { calculate_dollar_value, format_decimal } from "../../../utils";
  import { contract_data_map, eth_price } from "../../../stores"
  import HelpIcon from "../../HelpIcon.svelte";
  import {Decimal} from "decimal.js"

  export let contract;
  export let args;
  export let caller;

  const [amount] = args
  const value = new Decimal("0x" + amount)

  let help_expanded = false
  const toggle_expanded = () => {
    help_expanded = !help_expanded
  }

  $: contract_data = $contract_data_map[contract]
  $: tokens_transferred = (new Decimal(10)).pow(new Decimal(contract_data?.uniswap_token_info?.decimals || 18).negated()).mul(value)
  $: eth_per_token = new Decimal(contract_data?.uniswap_token_info?.derivedETH || 0)
  $: dollars_transferred = calculate_dollar_value(tokens_transferred, "USD", $eth_price, eth_per_token)
</script>

<div>
  <div class="flex mb-2">
    <div class="flex flex-col justify-center">
      <p class="text-base font-jetbrains underline decoration-2 underline-offset-2 font-bold">
        Burn From - <Etherscanlink contract_hex={contract}/>
      </p>
    </div>
    <div class="cursor-pointer bg-lightgrey hover:bg-grey rounded-full flex gap-2 p-1 pl-2 border border-grey ml-auto text-darkgrey" on:click={toggle_expanded}>
      <p class="text-base font-jetbrains">Help</p>
      <HelpIcon />
    </div>
  </div>
  {#if help_expanded}
    <div class="my-1 p-2 bg-lightgrey">
      <p class="font-jetbrains text-paragraph">
        This transaction includes a burn (token destruction) of {format_decimal(tokens_transferred)} coins of <Etherscanlink contract_hex={contract}/>
        from <Etherscanlink contract_hex={caller} />. At current Uniswap price, this burn represents a value of {format_decimal(dollars_transferred)} in USD.
      </p>
    </div>
  {/if}
  <p class="text-base font-jetbrains mb-1">Account: <Etherscanlink contract_hex={caller} /></p>
  <p class="text-base font-jetbrains mb-1">Amount: {format_decimal(tokens_transferred)}</p>
  {#if dollars_transferred}
    <p class="text-base font-jetbrains">USD Value: {format_decimal(dollars_transferred)}</p>
  {/if}
</div>
