<template>
  <div>
    <div>
      <ul>
        <li v-for="(task, index) in taskList" :key="index">
          {{ task.text }}
          <button @click="deleteTask(task)">Delete</button>
        </li>
      </ul>
    </div>
    <div>
      <input v-model="text" />
      <button @click="addTask">Add</button>
    </div>
    <button @click="reloadTaskList">Reload</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Task, ToDoApiClient } from "../api/ToDoApiClient";

const apiClient = new ToDoApiClient();

@Component
export default class Tasks extends Vue {
  taskList = [] as Task[];
  text = "" as string;

  async mounted() {
    await this.reloadTaskList();
  }

  async reloadTaskList() {
    this.taskList = await apiClient.listTasks();
  }
  async addTask() {
    await apiClient.createTask(this.text);
    await this.reloadTaskList();
    this.text = "";
  }
  async deleteTask(task: Task) {
    await apiClient.deleteTask(task);
    await this.reloadTaskList();
  }
}
</script>
<style scoped>
</style>
