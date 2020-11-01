import axios from "axios";
const API_URL = `${process.env?.VUE_APP_TODO_API_BASE_URL}/tasks`;

export interface Task {
    text: string;
    _links: {
        self: {
            href: string;
        };
    };
}

export class ToDoApiClient {
    public async listTasks(): Promise<Task[]> {
        const response = await axios.get(API_URL);
        return response.data._embedded.tasks;
    }

    public async createTask(text: string): Promise<Task> {
        return axios.post(API_URL, { text });
    }

    public async deleteTask(task: Task): Promise<void> {
        return axios.delete(task._links.self.href);
    }
}
