import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { AppActions, AppSettings, AppState, AppView, Task, TaskInput } from '../types/domain';
import { clearAppState, loadAppState, saveAppState } from '../utils/storage';

const nowIso = () => new Date().toISOString();

const seedTasks: Task[] = [
  {
    id: 'task-launch-board',
    title: 'Launch partner review board',
    project: 'Operations',
    owner: 'Mina',
    status: 'doing',
    priority: 'high',
    dueDate: '2026-05-21',
    notes: 'Confirm owners, dependencies, and first-response coverage.',
    updatedAt: nowIso(),
  },
  {
    id: 'task-client-import',
    title: 'Validate client import queue',
    project: 'Platform',
    owner: 'Jon',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-05-24',
    notes: 'Run the sample import and capture rows that need manual cleanup.',
    updatedAt: nowIso(),
  },
  {
    id: 'task-weekly-summary',
    title: 'Publish weekly status summary',
    project: 'Reporting',
    owner: 'Ari',
    status: 'done',
    priority: 'low',
    dueDate: '2026-05-17',
    notes: 'Include completion trend and blocked work.',
    updatedAt: nowIso(),
  },
];

export const defaultAppState: AppState = {
  activeView: 'dashboard',
  selectedTaskId: 'task-launch-board',
  projectFilter: 'All projects',
  query: '',
  isCreateOpen: false,
  isPaused: false,
  lastSavedAt: nowIso(),
  error: null,
  settings: {
    compactMode: false,
    showCompleted: true,
    accentColor: 'indigo',
  },
  tasks: seedTasks,
};

type AppStateAction =
  | { type: 'navigate'; view: AppView }
  | { type: 'open-create' }
  | { type: 'close-create' }
  | { type: 'create-task'; input?: Partial<TaskInput> }
  | { type: 'update-task'; taskId: string; input: Partial<TaskInput> }
  | { type: 'select-task'; taskId: string }
  | { type: 'set-project-filter'; project: string }
  | { type: 'set-query'; query: string }
  | { type: 'pause' }
  | { type: 'restart' }
  | { type: 'save-settings'; settings?: Partial<AppSettings> }
  | { type: 'reset-defaults' }
  | { type: 'clear-error' };

function createInitialState(): AppState {
  const stored = loadAppState();
  return {
    ...defaultAppState,
    ...stored,
    settings: {
      ...defaultAppState.settings,
      ...stored?.settings,
    },
    tasks: stored?.tasks?.length ? stored.tasks : defaultAppState.tasks,
    lastSavedAt: stored?.lastSavedAt ?? nowIso(),
  };
}

function reducer(state: AppState, action: AppStateAction): AppState {
  const stamp = nowIso();

  switch (action.type) {
    case 'navigate':
      return { ...state, activeView: action.view, lastSavedAt: stamp };
    case 'open-create':
      return { ...state, activeView: 'create-edit', isCreateOpen: true, lastSavedAt: stamp };
    case 'close-create':
      return { ...state, isCreateOpen: false, lastSavedAt: stamp };
    case 'create-task': {
      const task: Task = {
        id: `task-${Date.now()}`,
        title: action.input?.title?.trim() || 'New atlas task',
        project: action.input?.project?.trim() || 'Operations',
        owner: action.input?.owner?.trim() || 'Unassigned',
        status: action.input?.status ?? 'todo',
        priority: action.input?.priority ?? 'medium',
        dueDate: action.input?.dueDate || '2026-05-25',
        notes: action.input?.notes?.trim() || 'Draft task created from the Atlas Tasks shell.',
        updatedAt: stamp,
      };

      return {
        ...state,
        activeView: 'detail',
        selectedTaskId: task.id,
        isCreateOpen: false,
        tasks: [task, ...state.tasks],
        lastSavedAt: stamp,
      };
    }
    case 'update-task':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId ? { ...task, ...action.input, updatedAt: stamp } : task,
        ),
        selectedTaskId: action.taskId,
        lastSavedAt: stamp,
      };
    case 'select-task':
      return {
        ...state,
        activeView: 'detail',
        selectedTaskId: action.taskId,
        lastSavedAt: stamp,
      };
    case 'set-project-filter':
      return { ...state, projectFilter: action.project, lastSavedAt: stamp };
    case 'set-query':
      return { ...state, query: action.query, lastSavedAt: stamp };
    case 'pause':
      return { ...state, isPaused: !state.isPaused, lastSavedAt: stamp };
    case 'restart':
      clearAppState();
      return { ...defaultAppState, lastSavedAt: stamp };
    case 'save-settings':
      return {
        ...state,
        activeView: 'settings',
        settings: { ...state.settings, ...action.settings },
        lastSavedAt: stamp,
      };
    case 'reset-defaults':
      clearAppState();
      return { ...defaultAppState, activeView: 'settings', lastSavedAt: stamp };
    case 'clear-error':
      return { ...state, error: null, activeView: 'dashboard', lastSavedAt: stamp };
    default:
      return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const actions = useMemo<AppActions>(
    () => ({
      navigate: (view) => dispatch({ type: 'navigate', view }),
      openCreate: () => dispatch({ type: 'open-create' }),
      closeCreate: () => dispatch({ type: 'close-create' }),
      createTask: (input) => dispatch({ type: 'create-task', input }),
      updateTask: (taskId, input) => dispatch({ type: 'update-task', taskId, input }),
      selectTask: (taskId) => dispatch({ type: 'select-task', taskId }),
      setProjectFilter: (project) => dispatch({ type: 'set-project-filter', project }),
      setQuery: (query) => dispatch({ type: 'set-query', query }),
      pause: () => dispatch({ type: 'pause' }),
      restart: () => dispatch({ type: 'restart' }),
      saveSettings: (settings) => dispatch({ type: 'save-settings', settings }),
      resetDefaults: () => dispatch({ type: 'reset-defaults' }),
      clearError: () => dispatch({ type: 'clear-error' }),
    }),
    [],
  );

  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      const projectMatches = state.projectFilter === 'All projects' || task.project === state.projectFilter;
      const completionMatches = state.settings.showCompleted || task.status !== 'done';
      const query = state.query.trim().toLowerCase();
      const queryMatches =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.project.toLowerCase().includes(query) ||
        task.owner.toLowerCase().includes(query);

      return projectMatches && completionMatches && queryMatches;
    });
  }, [state.projectFilter, state.query, state.settings.showCompleted, state.tasks]);

  const selectedTask = useMemo(
    () => state.tasks.find((task) => task.id === state.selectedTaskId) ?? state.tasks[0] ?? null,
    [state.selectedTaskId, state.tasks],
  );

  const projects = useMemo(
    () => ['All projects', ...Array.from(new Set(state.tasks.map((task) => task.project)))],
    [state.tasks],
  );

  const createSampleTask = useCallback(() => {
    actions.createTask();
  }, [actions]);

  return {
    state,
    actions,
    filteredTasks,
    selectedTask,
    projects,
    createSampleTask,
  };
}
