<script setup lang="ts">
import { defineSVCCCommand } from "./utils/svcc";
import SuspendButton from "./components/SuspendButton.vue";
import { Button, Textarea } from "primevue";
import { computed, ref } from "vue";
import LyricEditor from "./components/LyricEditor.vue";
import { debounce } from "./utils/debounce";

const play = defineSVCCCommand('play')
const pause = defineSVCCCommand('pause')
const stop = defineSVCCCommand('stop')
const resync = defineSVCCCommand('sync')
const setLyric = debounce(1000, defineSVCCCommand('setLyric'))

const fetchCige = defineSVCCCommand('fetchCige', (res) => {
  if (res) {
    cigeContent.value = JSON.parse(res)
  }
})
const fetchLyric = defineSVCCCommand('fetchLyric', (res) => {
  if (res) {
    lyricContent.value = JSON.parse(res)
  }
})

const cigeContent = ref('')
const lyricContent = ref<string[]>([])

// let selectionStart = 0, selectionEnd = 0

// onMounted(() => {
//   const lyricTextArea = document.querySelector(
//     'textarea#lyric'
//   )!! as HTMLTextAreaElement

//   startSelectionChangeWrapper(lyricTextArea, (
//     lSelectionStart, lSelectionEnd
//   ) => {
//     console.log('selectchange', selectionStart, selectionEnd)
    
//     selectionStart = lSelectionStart
//     selectionEnd = lSelectionEnd
//   })
// })

const insertCigeChar = (pos: number, char: string) => {
  const cigeStr = cigeContent.value
  cigeContent.value = cigeStr.slice(0, pos)
                    + char
                    + cigeStr.slice(pos, cigeStr.length)
}

const eraseCigeChar = (pos: number) => {
  const cigeStr = cigeContent.value
  cigeContent.value = cigeStr.slice(0, pos) + cigeStr.slice(pos + 1)
}

const inLyricEditing = ref(false)
const modeSwitchButtonTitle = computed(() => {
  return inLyricEditing.value ? '词' : '格'
})

const isFirstFetch = ref(true)
const firstFetch = async () => {
  await fetchCige()
  await fetchLyric()
  isFirstFetch.value = false
}

const showCige = ref(false)

</script>

<template>
  <SuspendButton icon="pi pi-refresh" severity="secondary" :click="resync" />
  <main class="container">
    <h1>SynthV 歌词编辑器</h1>

    <div class="toolbar">
      <SuspendButton icon="pi pi-play" severity="primary" :click="play" />
      <SuspendButton icon="pi pi-pause" severity="secondary" :click="pause" />
      <SuspendButton icon="pi pi-stop" severity="danger" :click="stop" />
      <Button @click="inLyricEditing = !inLyricEditing" severity="secondary" style="
        padding-inline-start: 0;
        padding-inline-end: 0;
        width: 2.5rem;
      ">{{ modeSwitchButtonTitle }}</Button>
    </div>

    <div class="editor-container">
      <Textarea v-model:model-value="cigeContent" v-show="showCige" />
      <!-- <Textarea value="lyricContent"
        @input="onLyricInput"
        @compositionstart="onLyricComposeStart"
        @compositionend="onLyricComposeEnd"
        id="lyric"
      /> -->
      <LyricEditor :cige="cigeContent" v-model="lyricContent"
        @insert-cige-char="insertCigeChar"
        @erase-cige-char="eraseCigeChar"
        @update-lyric="setLyric(lyricContent)"
        :inLyricEditing="inLyricEditing"
      />
    </div>

    <div class="toolbar">
      <SuspendButton label="获取词格 & 歌词" severity="primary" :click="firstFetch" v-if="isFirstFetch"/>
      <template v-else>
        <Button :label="showCige ? '隐藏词格' : '显示词格'" @click="showCige = !showCige" severity="info" />
        <SuspendButton label="获取词格" severity="primary" :click="fetchCige" />
        <SuspendButton label="获取歌词" severity="secondary" :click="fetchLyric" />
      </template>
    </div>
  </main>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: center;
  gap: 0.5rem;

  margin-bottom: 2rem;
}
.editor-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
</style>
<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}


.row {
  display: flex;
  justify-content: center;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

h1 {
  text-align: center;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}
button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

input,
button {
  outline: none;
}

#greet-input {
  margin-right: 5px;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  a:hover {
    color: #24c8db;
  }

  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
  button:active {
    background-color: #0f0f0f69;
  }
}

</style>