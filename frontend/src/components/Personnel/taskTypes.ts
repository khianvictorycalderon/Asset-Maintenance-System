export type TaskStatus = "Pending" | "In Progress" | "Completed";

export const TASK_STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];

// Shape returned by GET api/personnel/maintenance-tasks (snake_case)
export type ApiPersonnelTask = {
  id: string;
  name: string;
  description: string;
  due_at: string;
  status: TaskStatus;
  supervisor_id: string;
  supervisor: string;
  assigned_at: string;
};

export type PersonnelTasksResponse = {
  tasks: ApiPersonnelTask[];
  total_tasks: number;
  current_page: number;
  page_size: number;
  total_pages: number;
};

export type PersonnelTask = {
  id: string;
  name: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  supervisor: string;
  dateAssigned: string;
};

export const toPersonnelTask = (task: ApiPersonnelTask): PersonnelTask => ({
  id: task.id,
  name: task.name,
  description: task.description,
  deadline: task.due_at,
  status: task.status,
  supervisor: task.supervisor,
  dateAssigned: task.assigned_at,
});

export type TaskFilterValues = {
  keyword: string;
  description: string;
  status: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
};

export const EMPTY_TASK_FILTERS: TaskFilterValues = {
  keyword: "",
  description: "",
  status: "",
  startDate: "",
  endDate: "",
};
