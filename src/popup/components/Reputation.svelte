<script>
  import { contract_data_map, contracts_touched } from "../stores"
  import BlueCheckDisplay from "./BlueCheckDisplay.svelte";
  import Chevron from "./Chevron.svelte";
  import Etherscanlink from "./etherscanlink.svelte";
  import LinkDisplay from "./LinkDisplay.svelte"
  import TextDisplay from "./TextDisplay.svelte";

  const nft_data_order = [
    ["blueCheckmark", "Blue Checkmark", BlueCheckDisplay],
    ["website", "Website", LinkDisplay],
    ["discord", "Discord", LinkDisplay],
    ["twitter", "Twitter", LinkDisplay],
    ["telegram", "Telegram", LinkDisplay],
    ["github", "GitHub", LinkDisplay],
    ["reddit", "Reddit", LinkDisplay],
    ["linkedin", "LinkedIn", LinkDisplay],
    ["facebook", "Facebook", LinkDisplay],
    ["whitepaper", "Whitepaper", LinkDisplay],
    ["blog", "Blog", LinkDisplay],
    ["bitcointalk", "Bitcoin Talk", LinkDisplay]
  ]

  const get_emoji = (score) => {
    if (score < 0) {
      return String.fromCodePoint(0x1F914) // 🤔
    } else if (score < 40) {
      return String.fromCodePoint(0x1F628) // 😨
    } else if (score < 60) {
      return String.fromCodePoint(0x1F642) // 🙂
    } else {
      return String.fromCodePoint(0x1F600) // 😀
    }
  }

  const expanded_map = {}
  const toggle_expanded = (contract) => {
    expanded_map[contract] = contract in expanded_map ? !expanded_map[contract] : false
  }

  $: info_map = $contracts_touched.map(contract => [contract, $contract_data_map[contract]])
      .map(([contract, data]) => {
        const subheaders = [
          [
            "Blockchain Intelligence Group Flags",
            data?.flags?.map(flag => [flag, TextDisplay, ""]) || []
          ],
          [
            "Etherscan NFT Data",
            nft_data_order
              .filter(([key, _]) => {
                const val = data?.etherscan_nft_data[key]
                return val !== undefined && val !== null && val !== ""
              })
              .map(([key, name, comp]) => [name, comp, data?.etherscan_nft_data[key]])
          ]
        ]
        return [contract, data?.bigcs_score || -1, subheaders.filter(subheader => subheader[1].length > 0)]
      })
</script>

<div class="pr-4 py-4">
  <div class="flex">
    <p class="text-base font-jetbrains font-bold">Contract</p>
    <p class="text-base font-jetbrains font-bold ml-auto">Reputation</p>
  </div>
  {#each info_map as [contract, bigcs_score, subheaders]}
    <div class="flex mt-4 items-center">
      <p class="mr-2">{get_emoji(bigcs_score || -1)} </p>
      <Etherscanlink contract_hex={contract} />
      {#if subheaders.length > 0}
        <button on:click={() => toggle_expanded(contract)}>
          <Chevron expanded={contract in expanded_map ? expanded_map[contract] : true} />
        </button>
      {/if}
      <p class="ml-auto text-base font-jetbrains font-bold">{bigcs_score === -1 ? "Unknown" : bigcs_score}</p>
    </div>
    <div class="{(contract in expanded_map ? expanded_map[contract] : true) ? '' : 'hidden'}">
      {#each subheaders as [title, subheader]}
        <p class="text-base mt-2 font-jetbrains font-bold">{title}</p>
        {#each subheader as [name, comp, to_display]}
          <div class="flex mt-2">
            <p class="mr-auto text-base font-jetbrains">{name}</p>
            <svelte:component this={comp} to_display={to_display}></svelte:component>
          </div>
        {/each}
      {/each}
    </div>
  {/each}
</div>
