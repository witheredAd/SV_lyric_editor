<script setup lang="ts">
import { TLyricToken } from '@/utils/TLyricToken';
import { computed } from 'vue';
defineProps<{
  lyricToken: TLyricToken,
  selected?: boolean,
  onEdit?: boolean,
}>()
const emits = defineEmits<{
  input: [value: string],
  mousedown: [],
  mouseenter: [],
  dblclick: [],
}>()
const model = defineModel<string>('content')
const onBlur = (e: FocusEvent) => {
    const refinedInput = (e.target as HTMLElement)?.innerText.trim() ?? ''
    model.value = refinedInput
    console.log('LET onInput', refinedInput, e)
    emits('input', refinedInput)
}
const onInput = (e: Event) => {
    console.log(e)
    if ((e as InputEvent).inputType === 'insertParagraph') {
        (e.target as HTMLElement).blur()
    }
}

const contentDisplay = computed(() => {
    if (model.value === '') {
        return '〇'
    }
    return model.value
})

</script>

<template>
  <span
    v-html="contentDisplay"
    @blur="onBlur" @input="onInput"
    @mousedown="(e) => { emits('mousedown'); e.stopPropagation() }"
    @mouseenter="emits('mouseenter')"
    @dblclick="emits('dblclick')"
    :class="[
        selected && 'selected',
        onEdit && 'onEdit',
    ]"
  ></span>
</template>

<style lang="scss" scoped>
span {
    display: inline-block;
    cursor: text;
}
.selected {
    background: #3367d1;
    color: white
}
.onEdit {
    background: #0cad6f;
    color: white
}
</style>