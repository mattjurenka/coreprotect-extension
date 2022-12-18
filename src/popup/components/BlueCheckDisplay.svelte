<script>
  export let to_display;
  
  $: readable = to_display === "true" ? "Yes" : "No"
</script>

<p class="text-base font-jetbrains">{readable}</p>
