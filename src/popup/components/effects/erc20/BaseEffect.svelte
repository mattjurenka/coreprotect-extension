<script>
  import Etherscanlink from "../../etherscanlink.svelte";
  import { calculate_dollar_value, format_decimal } from "../../../utils";
  import { contract_data_map, eth_price, chain } from "../../../stores"
  import HelpIcon from "../../icons/HelpIcon.svelte";
  import {Decimal} from "decimal.js"

  export let contract

  export let from
  export let to
  export let name

  export let value
  export let HelpComponent

  const decimal_value = new Decimal("0x" + value)

  let help_expanded = false
  const toggle_expanded = () => {
    help_expanded = !help_expanded
  }

  $: moralis_data = ($contract_data_map[$chain]?.[contract])?.moralis_price_data
  $: tokens_transferred = (new Decimal(10)).pow(new Decimal(moralis_data?.nativePrice?.decimals || 18).negated()).mul(decimal_value)
  $: dollars_transferred = new Decimal(moralis_data?.usdPrice || 1).mul(tokens_transferred)
</script>

<div>
  <div class="flex items-start mb-1">
    <p class="text-base font-jetbrains font-bold">
      <Etherscanlink name_override={name} contract_hex={contract}/> - Token
    </p>
    <button class="cursor-pointer bg-lightgrey hover:bg-grey rounded-full flex gap-2 p-1 pl-2 border border-grey ml-auto text-darkgrey" on:click={toggle_expanded}>
      <p class="text-base font-jetbrains">Help</p>
      <HelpIcon />
    </button>
  </div>
  {#if help_expanded}
    <div class="mt-1 mb-2 p-2 bg-lightgrey">
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
