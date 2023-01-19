<script>
  import Etherscanlink from "../../etherscanlink.svelte";
  import { format_decimal } from "../../../utils";

  export let contract;
  export let from;
  export let to;
  export let tokens_transferred;
  export let dollars_transferred;
</script>

This transaction includes a decrease in approval from <Etherscanlink contract_hex={from} />, of {format_decimal(tokens_transferred)}
coins of <Etherscanlink contract_hex={contract}/>, from what can be spent by <Etherscanlink contract_hex={to}/>.
This means that <Etherscanlink contract_hex={to}/> will now be able to spend {format_decimal(tokens_transferred)} fewer of <Etherscanlink contract_hex={from} />'s
coins at their discretion. At current Uniswap price, this decrease represents a value of ${format_decimal(dollars_transferred)} in USD.
