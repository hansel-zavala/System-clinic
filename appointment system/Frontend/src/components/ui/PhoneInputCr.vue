<template>
  <input
    class="phone-input-cr"
    type="tel"
    inputmode="numeric"
    autocomplete="tel-national"
    maxlength="9"
    placeholder="0000-0000"
    :value="formatPhoneDisplay(model)"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { formatPhoneDisplay, parsePhoneDigits } from '../../domain/phoneCr'

const model = defineModel<string>({ required: true })

const onInput = (e: Event) => {
  const t = e.target as HTMLInputElement
  model.value = parsePhoneDigits(t.value)
}
</script>
