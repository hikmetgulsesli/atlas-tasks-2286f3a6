export type TaskStatus = 'todo' | 'doing' | 'done';

export type AppView =
  | 'dashboard'
  | 'create-edit'
  | 'detail'
  | 'insights'
  | 'settings'
  | 'error-state'
  | 'empty-state';

export interface Task {
  id: string;
  title: string;
  project: string;
  owner: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  notes: string;
  updatedAt: string;
}

export interface AppSettings {
  compactMode: boolean;
  showCompleted: boolean;
  accentColor: 'indigo' | 'teal' | 'rose';
}

export interface AppState {
  activeView: AppView;
  selectedTaskId: string | null;
  projectFilter: string;
  query: string;
  isCreateOpen: boolean;
  isPaused: boolean;
  lastSavedAt: string;
  error: string | null;
  settings: AppSettings;
  tasks: Task[];
}

export interface TaskInput {
  title: string;
  project: string;
  owner: string;
  status: TaskStatus;
  priority: Task['priority'];
  dueDate: string;
  notes: string;
}

export type AppActions = {
  navigate: (view: AppView) => void;
  openCreate: () => void;
  closeCreate: () => void;
  createTask: (input?: Partial<TaskInput>) => void;
  updateTask: (taskId: string, input: Partial<TaskInput>) => void;
  selectTask: (taskId: string) => void;
  setProjectFilter: (project: string) => void;
  setQuery: (query: string) => void;
  pause: () => void;
  restart: () => void;
  saveSettings: (settings?: Partial<AppSettings>) => void;
  resetDefaults: () => void;
  clearError: () => void;
};

export interface AppBridge {
  state: AppState;
  actions: AppActions;
}
