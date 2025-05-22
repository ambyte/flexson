import { ref } from "vue";
import { defineStore } from "pinia";

export const useMessagesStore = defineStore("messages", () => {
  const queue = ref<string[]>([]);
  function add(message: string) {
    queue.value.push(message);
  }

  return { queue, add };
});

export const useErrorsStore = defineStore("errors", () => {
  const queue = ref<string[]>([]);
  function add(message: string) {
    queue.value.push(message);
  }

  return { queue, add };
});
