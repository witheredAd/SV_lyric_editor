export type TLyricToken = {
  type: 'lyric',
  index: number,
  data: string,
  mrow: number,
  col: number,
  pos: number,
} | {
  type: 'br',
  pos: number,
} | {
  type: 'additional',
  data: string,
  pos: number,
}