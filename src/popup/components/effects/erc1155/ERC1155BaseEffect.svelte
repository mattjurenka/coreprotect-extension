<script>
import { open_link } from "../../../actions";

  import Etherscanlink from "../../etherscanlink.svelte";
  import HelpIcon from "../../icons/HelpIcon.svelte";

  export let contract
  export let from
  export let to
  export let value
  export let name
  export let HelpComponent

  const value_decimal = Number("0x" + value)

  export let nft_link
  export let nft_name
  export let nft_picture
  export let nft_id

  let help_expanded = false
  const toggle_expanded = () => {
    help_expanded = !help_expanded
  }
</script>

<div>
  <div class="flex items-start mb-2">
    <p class="text-base font-jetbrains font-bold">
      <Etherscanlink name_override={name} contract_hex={contract}/> - NFT
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
          this={HelpComponent} from={from} to={to}
          contract={contract} nft_name={nft_name} value_decimal={value_decimal}
        />
      </p>
    </div>
  {/if}
  <a href="#" class="{nft_link ? 'cursor-pointer' : 'cursor-default'}" on:click={_ => nft_link ? open_link(nft_link) : undefined}>
    {#if nft_picture}
      <img src={nft_picture} width="250" class="max-w-full rounded-lg" alt={nft_name} />
    {:else}
      <div class="rounded-lg bg-lightgrey flex flex-col justify-center items-center w-[256px] h-[256px]">
        <p class="text-base font-bold font-jetbrains">No Image Found</p>
      </div>
    {/if}
  </a>
  <div class="flex mt-4 mb-2 flex-wrap gap-1">
    <div class="flex gap-2 mr-4">
      <p class="text-base font-jetbrains">Name:</p>
      <p class="font-bold text-base font-jetbrains mr-3 break-all">{nft_name || "Unknown Name"}</p>
    </div>
    <div class="flex gap-2">
      <p class="text-base font-jetbrains">Amount:</p>
      <p class="font-bold text-base font-jetbrains">{value_decimal}</p>
    </div>
  </div>
  <div class="flex mb-4 flex-wrap gap-1">
    <div class="flex gap-2">
      <p class="text-base font-jetbrains">Token ID:</p>
      <p class="font-bold text-base font-jetbrains">{nft_id}</p>
    </div>
  </div>
  {#if from}
    <p class="text-base font-jetbrains mb-1">From: <Etherscanlink contract_hex={from} /></p>
  {/if}
  {#if from}
    <p class="text-base font-jetbrains mb-2">To: <Etherscanlink contract_hex={to} /></p>
  {/if}
</div>
