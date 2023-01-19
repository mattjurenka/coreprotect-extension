<script>
  import Etherscanlink from "../../etherscanlink.svelte";

  export let contract;
  export let from;
  export let to;
  export let nft_name;
  export let value_decimal;
</script>

This transaction includes a transfer of {value_decimal} nfts with name {nft_name}
from <Etherscanlink contract_hex={from} /> to <Etherscanlink contract_hex={to} />.
These nfts are part of the <Etherscanlink contract_hex={contract}/> collection.
