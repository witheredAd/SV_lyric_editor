<script setup lang="tsx">
import {
computed,
  nextTick,
  ref,
  useTemplateRef,
  watch
} from 'vue';
import type { TLyricToken } from '@/utils/TLyricToken';
import LyricEditableToken from './LyricEditableToken.vue';
import { isLatin, splitLyric } from '@/utils/LyricSplitter';
import { assert } from '@/utils/ts-assert';
import { isInViewPort } from '@/utils/is-in-viewport';
import { defineSVCCCommand } from '@/utils/svcc';

const props = defineProps<{
  cige: string,
  inLyricEditing: boolean,
}>()


const CigePlacements = [
  '〇', 'x', 'X', 'Ｘ'
]

const lyricContentList = defineModel<string[]>({
  default: []
})
const lyricContentUpdater = 
ref<ReturnType<typeof LyricInputResolver>[]>([])
const lyricMouseDownListeners = 
ref<ReturnType<typeof LyricMouseDownResolver>[]>([])
const lyricMouseEnterListeners = 
ref<ReturnType<typeof LyricMouseEnterResolver>[]>([])
const lyricDblClickListeners = 
ref<ReturnType<typeof LyricDblClickResolver>[]>([])
const lyricComponents = 
ref<(InstanceType<typeof LyricEditableToken> | null)[]>([])

const processCige = (str: string): TLyricToken[] => {
  const result: TLyricToken[] = []
  let lyricIndex = 0
  let meaningfulRow = 0
  let col = 0
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (CigePlacements.includes(char)) {
      if (lyricIndex >= lyricContentList.value.length) {
        lyricContentList.value.push('')
        lyricContentUpdater.value.push(LyricInputResolver(lyricIndex))
        lyricMouseDownListeners.value.push(LyricMouseDownResolver(lyricIndex))
        lyricMouseEnterListeners.value.push(LyricMouseEnterResolver(lyricIndex))
        lyricDblClickListeners.value.push(LyricDblClickResolver(lyricIndex))
        lyricComponents.value.push(null)
      }
      result.push({
        type: 'lyric',
        index: lyricIndex,
        data: lyricContentList.value[lyricIndex],
        mrow: meaningfulRow,
        col: col,
        pos: i,
      })
      lyricIndex++;
      col ++;

    } else if (char === '\n') {
      result.push({
        type: 'br',
        pos: i,
      })
      if (col != 0) {
        col = 0
        meaningfulRow ++
      }
    } else {
      result.push({
        type: 'additional',
        data: char,
        pos: i,
      })
      col ++
    }
  }
  return result
}

const lyricList = ref<TLyricToken[]>([])
watch(() => props.cige, (value) => {
  lyricList.value = processCige(value)
})

const editorCursorOffset = ref(0)
const updateCountMax = ref(0)

const generateEmptyLyric = (count: number) => {
  return new Array(count).fill('')
}

const LyricInputResolver = (index: number) => 
(value: string) => {
  const splitResult = splitLyric(value)
  let updateCount: number
  
  if (splitResult.length + index > lyricContentList.value.length) {
    updateCount = lyricContentList.value.length - index
  } else {
    updateCount = splitResult.length
  }
  if (updateCount > updateCountMax.value) {
    updateCountMax.value = updateCount
  }
  const totalUpdateCount = updateCountMax.value

  
  lyricContentList.value = [
    ...lyricContentList.value.slice(0, index),
    ...splitResult.slice(0, totalUpdateCount),
    ...generateEmptyLyric(totalUpdateCount - splitResult.length),
    ...lyricContentList.value.slice(index + totalUpdateCount),
  ]

  emits('updateLyric')

  if (updateCount > 0 && isLatin(splitResult[updateCount - 1])) {
    updateCount -= 1
  }
  editorCursorOffset.value = updateCount
  console.log(editorCursorOffset.value, splitResult)
}

const selectionStartIndexRef = ref<number>(-1)
const selectionEndIndexRef = ref<number>(-1)

const fillContentWithSelection = () => {
  const [sstart, send] = [selectionStartIndexRef.value, selectionEndIndexRef.value]
  const lyricToFill = lyricContentList.value.slice(sstart, send + 1)
  if (lyricToFill.length === 0) {
    return ''
  }

  const result = [lyricToFill[0]]
  let isLastLatin = isLatin(lyricToFill[0])
  for (let i = 1; i < lyricToFill.length; i++ ) {
    const isCurrentLatin = isLatin(lyricToFill[i])
    if (isLastLatin && isCurrentLatin) {
      result.push(' ')
    }
    result.push(lyricToFill[i])
    isLastLatin = isCurrentLatin
  }

  overlayInputContent.value = result.join('')
  editorCursorOffset.value = 0
  updateCountMax.value = lyricToFill.length
}

const registerSelection = (start: number, end: number) => {
  [
    selectionStartIndexRef.value,
    selectionEndIndexRef.value
  ] = [ start, end ].sort((a, b) => a - b)

  fillContentWithSelection()

  const el = lyricComponents.value[selectionStartIndexRef.value]?.$el
  if (el) {
    const [inViewport, toTop] = isInViewPort(el)
    if (!inViewport) {
      el.scrollIntoView(toTop)
    }
  }
}

const inLyricSelect = ref(false)
const lyricSelectFirst = ref<number>(0)
const lyricSelectLast = ref<number>(0)
const LyricMouseDownResolver = (index: number) =>
() => {
  inLyricSelect.value = true
  lyricSelectFirst.value = index
  lyricSelectLast.value = index

  overlayInputContent.value = ''
  editorCursorOffset.value = 0
}
const LyricMouseEnterResolver = (index: number) =>
() => {
  if (!inLyricSelect.value) { return; }

  lyricSelectLast.value = index
  registerSelection(lyricSelectFirst.value, index)
}
const endLyricSelect = () => {
  inLyricSelect.value = false
  
  registerSelection(lyricSelectFirst.value, lyricSelectLast.value)
  editorCursorOffset.value = 0
  nextTick(() => {
    console.log(userInputRef.value?.style.left, userInputRef.value?.style.top)

    if (props.inLyricEditing) {
      userInputRef.value?.focus()
      userInputRef.value?.select()
    }
  })
}
document.addEventListener('mouseup', () => {
  if (inLyricSelect.value) {
    endLyricSelect()
  }
})

const setSvPlaybackPosition = defineSVCCCommand('position')
const LyricDblClickResolver = (index: number) => 
() => {
  setSvPlaybackPosition(index)
}


const emits = defineEmits<{
  insertCigeChar: [index: number, char: string],
  eraseCigeChar: [index: number],
  updateLyric: [],
}>()

const findIndexInTokens = (lyricIndex: number) => {
  for (const [index, token] of lyricList.value.entries()) {
    if (token.type === 'lyric' && token.index === lyricIndex) {
      return index;
    }
  }
  return -1;
}

const onKeyPress = (e: KeyboardEvent) => {
  console.log(e)
  if (e.isComposing || e.keyCode === 229) {
    // avoid IME
    return;
  }

  if (e.code === 'Enter') {
    if (props.inLyricEditing) {

      let editorCursorTargetIndex = editorCursorIndex.value
      const splittedLyric = splitLyric(overlayInputContent.value)
      if (isLatin (splittedLyric[splitLyric.length - 1])) {
        editorCursorTargetIndex ++
      }
      userInputRef.value?.blur()
      lyricMouseDownListeners.value[
        editorCursorTargetIndex
      ]()
      endLyricSelect()
      return ;
    }

    emits('insertCigeChar', 
      lyricList.value[
        findIndexInTokens(selectionEndIndexRef.value)
      ].pos,
      '\n'
    )
  } else if (e.code === 'Space') {
    if (props.inLyricEditing) {
      return ;
    }

    e.stopPropagation()
    e.preventDefault()

    emits('insertCigeChar', 
      lyricList.value[
        findIndexInTokens(selectionEndIndexRef.value)
      ].pos,
      '　'
    )
  } else if (e.code === 'Backspace') {
    if (props.inLyricEditing) {
      return ;
    }

    const index = findIndexInTokens(selectionEndIndexRef.value)
    if (lyricList.value[index - 1].type !== 'lyric') {
      emits('eraseCigeChar', lyricList.value[index].pos - 1)
    }
  } else if (codeIsMoveCmd(e.code)) {
    if (props.inLyricEditing) {
      return ;
    }

    e.stopPropagation()
    e.preventDefault()
    moveSelectionSingle(e.code)
  }
}

type TMoveCmd = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
const codeIsMoveCmd = (code: string): code is TMoveCmd => {
  return [
    'ArrowUp', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
  ].includes (code)
}

const moveSelectionSingle = (cmd: TMoveCmd) => {
  const sstart = selectionStartIndexRef.value
  const index = findIndexInTokens(sstart)
  const currentToken = lyricList.value[index]
  assert (currentToken.type === 'lyric')

  if (cmd === 'ArrowLeft') {
    if (sstart - 1 >= 0) {
      registerSelection(
        sstart - 1,
        sstart - 1
      )
    }
  } else if (cmd === 'ArrowRight') {
    if (sstart + 1 < lyricContentList.value.length) {
      registerSelection(
        sstart + 1,
        sstart + 1
      )
    }
  } else if (cmd === 'ArrowUp') {
    let i: number;
    let token: TLyricToken | null = null;
    let candidateToken: TLyricToken | null = null;
    for (i = index - 1; i >= 0; i --) {
      token = lyricList.value[i]
      if (token.type === 'lyric') {
        if (token.mrow == currentToken.mrow - 1) {
          if (!candidateToken) {
            candidateToken = token
          } else {
            if (
              Math.abs(candidateToken.col - currentToken.col)
              >
              Math.abs(token.col - currentToken.col)
            ) {
              candidateToken = token
            }
          }
          if (token.col <= currentToken.col) {
            break;
          }
        } else if (token.mrow <= currentToken.mrow - 2) {
          break;
        }
      }
    }

    if (!candidateToken) {
      registerSelection(0, 0)
    } else {
      registerSelection(
        candidateToken.index,
        candidateToken.index
      )
    }
  } else if (cmd === 'ArrowDown') {
    let i: number;
    let token: TLyricToken | null = null;
    let candidateToken: TLyricToken | null = null;
    const lyricLength = lyricList.value.length
    for (i = index + 1; i < lyricLength; i ++) {
      token = lyricList.value[i]
      if (token.type === 'lyric') {
        if (token.mrow == currentToken.mrow + 1) {
          if (!candidateToken) {
            candidateToken = token
          } else {
            if (
              Math.abs(candidateToken.col - currentToken.col)
              >
              Math.abs(token.col - currentToken.col)
            ) {
              candidateToken = token
            }
          }
          if (token.col >= currentToken.col) {
            break;
          }
        } else if (token.mrow >= currentToken.mrow + 2) {
          break;
        }
      }
    }

    if (!candidateToken) {
      registerSelection(
        lyricContentList.value.length - 1,
        lyricContentList.value.length - 1
      )
    } else {
      registerSelection(
        candidateToken.index,
        candidateToken.index
      )
    }
  }
}

const userInputRef = useTemplateRef('user-input')
const editorCursorIndex = computed(() => {
  return selectionStartIndexRef.value + editorCursorOffset.value
})
const inputOverlayPosition = ref({
  left: `0px`,
  top: `0px`,
})

const updateInputOverlayPosition = () => {
  inputOverlayPosition.value = _calculateInputOverlayPosition()
}
const _calculateInputOverlayPosition = () => {
  if (editorCursorIndex.value === undefined) {
    return {
      left: `0px`,
      top: `0px`,
    }
  }
  const rect = lyricComponents.value[editorCursorIndex.value]?.$el.getBoundingClientRect()
  console.log({
    left: rect?.left,
    top: rect?.top,
  }, lyricComponents.value[editorCursorIndex.value]?.$el)
  return {
    left: `${rect?.left}px`,
    top: `${rect?.top}px`,
  }
}
watch ([
  lyricComponents, 
  editorCursorIndex,
], () => {
  updateInputOverlayPosition()
})

document.addEventListener('scroll', () => {
  updateInputOverlayPosition()
})

const overlayInputContent = ref('')

const onOverlayInput = (e: Event) => {
  if (! props.inLyricEditing) {
    return ;
  }

  console.log('input', e)

  if ((e as InputEvent).isComposing) {
    return ;
  }
  lyricContentUpdater.value[selectionStartIndexRef.value](overlayInputContent.value)
}
const onOverlayComposed = (e: CompositionEvent) => {
  if (! props.inLyricEditing) {
    return ;
  }

  console.log('composeend', e)
  // composeend is after input in Chrome
  // inLyricEditing.value = false
}
const onOverlayBlur = () => {
  if (! props.inLyricEditing) {
    return ;
  }
  
  console.log('blur')
  overlayInputContent.value = ''
  updateCountMax.value = 0
}

watch(() => props.inLyricEditing, (value, oldValue) => {
  if (oldValue == false && value) {
    registerSelection(
      selectionStartIndexRef.value,
      selectionEndIndexRef.value
    )
    nextTick(() => {
      userInputRef.value?.focus()
      userInputRef.value?.select()
    })
  }
})

</script>

<template>
  <div class="lyric-editor" tabindex="-1" @keydown="onKeyPress">
    <template v-for="lyric, index in lyricList" :key="index">
      <template v-if="lyric.type === 'lyric'
        && index > 0 && lyricList[index - 1].type === 'lyric'">
        <span v-if="isLatin(lyricContentList[lyric.index].trim())
         || isLatin((lyricContentList[lyric.index - 1].trim()))
        ">&nbsp;</span>
      </template>
      <LyricEditableToken v-if="lyric.type === 'lyric'"
        :lyric-token="lyric"
        v-model:content="lyricContentList[lyric.index]"
        @input="lyricContentUpdater[lyric.index]"
        @mousedown="lyricMouseDownListeners[lyric.index]"
        @mouseenter="lyricMouseEnterListeners[lyric.index]"
        @dblclick="lyricDblClickListeners[lyric.index]"
        :selected="
          selectionStartIndexRef <= lyric.index &&
          selectionEndIndexRef >= lyric.index
        "
        :onEdit="editorCursorIndex == lyric.index && inLyricEditing"
        :ref="(el) => { lyricComponents[lyric.index] = el as (InstanceType<typeof LyricEditableToken> | null) }"
      />
      <br v-else-if="lyric.type === 'br'" />
      <span v-else-if="lyric.type === 'additional'">
        {{ lyric.data }}
      </span>

    </template>
    
    <div id="overlay">
      <input id="user-input"
        :style="inputOverlayPosition"
        v-model="overlayInputContent"
        @input="onOverlayInput"
        @compositionend="onOverlayComposed"
        @blur="onOverlayBlur"
        ref="user-input"
      ></input>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lyric-editor {
  text-align: left;
  outline: none;
  user-select: none;
}
#user-input {
  position: fixed; 
  opacity: 0;
  pointer-events: none;
  transform: translateX(-100%);
  text-align: end;
  width: 300px;
  padding: 0;
}
</style>