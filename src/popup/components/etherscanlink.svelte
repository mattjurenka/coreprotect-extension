<script>
  import browser from "webextension-polyfill";
  import { contract_data_map, your_address } from "../stores"
  import { clamp_str_to, clamp_hex } from "../utils";

  export let contract_hex = ""
  export let name_override = undefined;
  $: contract_data = $contract_data_map[contract_hex]
  $: contract_name = name_override || (contract_data?.uniswap_token_info ?
    `$${contract_data?.uniswap_token_info?.symbol}` : contract_data?.contract_name)

  const open_etherscan = () => {
    const url = `https://etherscan.io/address/${contract_hex}`
    browser.runtime.sendMessage({msg_type: "open_tab", url})
  }

  $: suffix = $your_address === contract_hex ? " (You)" : ""
</script>

<a 
  class="text-base text-blue font-jetbrains decoration-2 underline-offset-2 underline font-bold"
  href="#"
  title="{contract_hex}"
  on:click={open_etherscan}
>
  {#if contract_name}
    {clamp_str_to(30)(contract_name) + suffix}
  {:else}
    {clamp_hex(contract_hex) + suffix}
  {/if}
</a>
