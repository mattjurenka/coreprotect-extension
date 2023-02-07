<script>
  import { open_link } from "../actions";
  import { contract_data_map, your_address, chain } from "../stores"
  import { clamp_str_to, clamp_hex } from "../utils";

  export let contract_hex = ""
  export let name_override = undefined;
  $: contract_data = $contract_data_map[$chain][contract_hex]
  $: contract_name = name_override || (contract_data?.uniswap_token_info ?
    `$${contract_data?.uniswap_token_info?.symbol}` : contract_data?.contract_name)

  const open_etherscan = () => {
    open_link(`https://etherscan.io/address/${contract_hex}`)
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
