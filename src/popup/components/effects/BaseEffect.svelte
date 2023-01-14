<script>
  import Etherscanlink from "../etherscanlink.svelte";
  import { calculate_dollar_value, format_decimal } from "../../utils";
  import { contract_data_map, eth_price } from "../../stores"
  import HelpIcon from "../icons/HelpIcon.svelte";
  import {Decimal} from "decimal.js"

  export let contract

  export let from
  export let to

  export let value
  export let HelpComponent

  const decimal_value = new Decimal("0x" + value)

  let help_expanded = false
  const toggle_expanded = () => {
    help_expanded = !help_expanded
  }

  $: contract_data = $contract_data_map[contract]
  $: tokens_transferred = (new Decimal(10)).pow(new Decimal(contract_data?.uniswap_token_info?.decimals || 18).negated()).mul(decimal_value)
  $: eth_per_token = new Decimal(contract_data?.uniswap_token_info?.derivedETH || 0)
  $: dollars_transferred = calculate_dollar_value(tokens_transferred, "USD", $eth_price, eth_per_token)
</script>

<div>
  <div class="flex mb-1">
    <div class="flex flex-col justify-center">
      <p class="text-base font-jetbrains font-bold">
        <Etherscanlink contract_hex={contract}/> - ERC20
      </p>
    </div>
    <button class="cursor-pointer bg-lightgrey hover:bg-grey rounded-full flex gap-2 p-1 pl-2 border border-grey ml-auto text-darkgrey" on:click={toggle_expanded}>
      <p class="text-base font-jetbrains">Help</p>
      <HelpIcon />
    </button>
  </div>
  {#if help_expanded}
    <div class="my-1 p-2 bg-lightgrey">
      <p class="font-jetbrains text-paragraph">
        <svelte:component 
          this={HelpComponent} from={from} to={to} tokens_transferred={tokens_transferred}
          contract={contract} dollars_transferred={dollars_transferred}
        />
      </p>
    </div>
  {/if}
  {#if from}
    <p class="text-base font-jetbrains mb-1">From: <Etherscanlink contract_hex={from} /></p>
  {/if}
  {#if from}
    <p class="text-base font-jetbrains mb-2">To: <Etherscanlink contract_hex={to} /></p>
  {/if}
  <p class="text-base font-jetbrains mb-1">Amount: {format_decimal(tokens_transferred)}</p>
  {#if dollars_transferred}
    <p class="text-base font-jetbrains">USD Value: ${format_decimal(dollars_transferred)}</p>
  {/if}
</div>
