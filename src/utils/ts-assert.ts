export function assert(condition: boolean): asserts condition {
    if (!condition) {
      throw new Error('Error on ts-assert');
    }
}