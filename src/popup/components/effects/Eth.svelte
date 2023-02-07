<script>
  import Etherscanlink from "../etherscanlink.svelte";
  import { format_decimal } from "../../utils";
  import { eth_price, chain } from "../../stores"
  import HelpIcon from "../icons/HelpIcon.svelte"
  import {Decimal} from "decimal.js"

  export let from;
  export let to;
  export let amount;
  export let eth_transferred = (new Decimal(10)).pow(new Decimal(18).negated()).mul(new Decimal(amount))

  let help_expanded = false
  const toggle_expanded = () => {
    help_expanded = !help_expanded
  }

  $: dollars_transferred = eth_transferred.mul(new Decimal($eth_price["USD"]))
</script>

<div>
  <div class="flex mb-1 gap-2">
    <div class="flex flex-col justify-center">
      <p class="text-base font-jetbrains font-bold">
        {$chain === "eth" ? "ETH" : "BNB"} Transfer
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
        This transaction includes a transfer of {format_decimal(eth_transferred)} ETH
        from <Etherscanlink contract_hex={from} /> to <Etherscanlink contract_hex={to} />.
        At current market price, this transfer represents a value of ${format_decimal(dollars_transferred)} in USD.
      </p>
    </div>
  {/if}
  <p class="text-base font-jetbrains mb-1">From: <Etherscanlink contract_hex={from} /></p>
  <p class="text-base font-jetbrains mb-2">To: <Etherscanlink contract_hex={to} /></p>
  <p class="text-base font-jetbrains mb-1">Amount: {format_decimal(eth_transferred)}</p>
  {#if dollars_transferred}
    <p class="text-base font-jetbrains">USD Value: ${format_decimal(dollars_transferred)}</p>
  {/if}
</div>
