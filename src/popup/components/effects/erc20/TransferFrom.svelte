<script>
  import Etherscanlink from "../../etherscanlink.svelte";
  import { calculate_dollar_value2, format_bignum_from_hex } from "../../../utils";
  import { contract_data_map, eth_price } from "../../../stores"
  import HelpIcon from "../../HelpIcon.svelte";

  export let contract;
  export let args;
  export let caller;

  let help_expanded = false
  const toggle_expanded = () => {
    help_expanded = !help_expanded
  }

  $: contract_data = $contract_data_map[contract]
  $: tokens_transferred = format_bignum_from_hex(args[2], contract_data?.uniswap_token_info?.decimals || 18)
  $: eth_per_token = contract_data?.uniswap_token_info?.derivedETH
  $: dollars_transferred = calculate_dollar_value2(tokens_transferred, "USD", $eth_price, eth_per_token)
</script>

<div>
  <div class="flex mb-2 gap-2">
    <div class="flex flex-col justify-center">
      <p class="text-base font-jetbrains underline decoration-2 font-bold">
        TransferFrom - <Etherscanlink contract_hex={contract}/>
      </p>
    </div>
    <div class="cursor-pointer hover:bg-lightgrey rounded-full flex gap-2 p-1" on:click={toggle_expanded}>
      <p class="text-base font-jetbrains">Help</p>
      <HelpIcon />
    </div>
  </div>
  {#if help_expanded}
    <div class="my-1 p-2 bg-lightgrey">
      <p class="font-jetbrains text-base">
        This transaction includes a transfer of {tokens_transferred} coins of <Etherscanlink contract_hex={contract}/>
        from <Etherscanlink contract_hex={args[0]} /> to <Etherscanlink contract_hex={args[1]} />.
        At current Uniswap price, this transfer represents a value of {dollars_transferred} in USD.
      </p>
    </div>
  {/if}
  <p class="text-base font-jetbrains mb-1">From: <Etherscanlink contract_hex={args[0]} /></p>
  <p class="text-base font-jetbrains mb-1">To: <Etherscanlink contract_hex={args[1]} /></p>
  <p class="text-base font-jetbrains mb-1">Amount: {tokens_transferred}</p>
  <p class="text-base font-jetbrains">USD Value: {dollars_transferred}</p>
</div>
