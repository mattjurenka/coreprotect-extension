<script>
  import Etherscanlink from "../../etherscanlink.svelte";
  import { format_decimal } from "../../../utils";

  export let contract;
  export let to;
  export let tokens_transferred;
  export let dollars_transferred;
</script>

This transaction includes a mint (token generation) of {format_decimal(tokens_transferred)} coins of <Etherscanlink contract_hex={contract}/>
given to <Etherscanlink contract_hex={to} />. At current Uniswap price, this mint represents a value of ${format_decimal(dollars_transferred)} in USD.
