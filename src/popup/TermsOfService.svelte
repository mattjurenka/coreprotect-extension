<script>
  import { set_accepted_tos } from "./stores";

  let accepted_one = false
  let accepted_two = false
  let accepted_three = false
  const try_accept_tos = () => {
    console.log(accepted_one, accepted_two, accepted_three)
    if (accepted_one && accepted_two && accepted_three) {
      set_accepted_tos(true)
    } else {
    }
  }
</script>

<div class="h-full flex flex-col">
  <h1 class="font-vollkorn text-xl text-blue mb-4">Welcome to Core Protect</h1>
  <p class="text-paragraph font-jetbrains mb-6">To use this product, please acknowledge the following terms and conditions:</p>
  <div class="flex items-center mb-4">
    <div class="min-w-[1.5rem]">
      <input type="checkbox" bind:checked={accepted_one} />
    </div>
    <p class="text-paragraph font-jetbrains">This product is in beta, so displayed information may contain inaccuracies.</p>
  </div>
  <div class="flex items-center mb-4">
    <div class="min-w-[1.5rem]">
      <input type="checkbox" bind:checked={accepted_two} />
    </div>
    <p class="text-paragraph font-jetbrains">
      Information provided by this product does not consitute an endorsement,
      audit, or approval of any service, product, or financial instrument.
    </p>
  </div>
  <div class="flex items-center">
    <div class="min-w-[1.5rem]">
      <input type="checkbox" bind:checked={accepted_three} />
    </div>
    <p class="text-paragraph font-jetbrains">
      You should use this product as a screening and research tool to verify 
      for yourself if the transaction is doing what you think it will. We cannot
      definitively tell you whether or not you are getting scammed, and accept 
      no responsibility for any financial loss resulting from use of this product.
    </p>
  </div>
  <p class="text-paragraph font-jetbrains mb-2 mt-auto">Do you accept these terms and conditions?</p>
  <div class="flex gap-4">
    <button 
      class="bg-blue border-2 border-blue px-4 pt-2 pb-[0.4rem] rounded-md text-white hover:bg-white hover:text-blue"
      on:click={try_accept_tos}
    >
      <p class="font-jetbrains text-base font-bold ">Yes</p>
    </button>
    <button
      class="border-2 border-blue px-4 pt-2 pb-[0.4rem] rounded-md text-blue hover:bg-blue hover:text-white"
      on:click={() => window.close()}
    >
      <p class="font-jetbrains text-base font-bold ">No</p>
    </button>
  </div>
</div>
