import { useEffect, useMemo } from 'react';
import {
  CreateEdit,
  Dashboard,
  Detail,
  EmptyState,
  ErrorState,
  Insights,
  Settings,
  type CreateEditActionId,
  type DashboardActionId,
  type DetailActionId,
  type EmptyStateActionId,
  type ErrorStateActionId,
  type InsightsActionId,
  type SettingsActionId,
} from './screens';
import { AppProvider, useAppContext } from './contexts/AppContext';
import type { AppBridge, AppView } from './types/domain';
import './App.css';

declare global {
  interface Window {
    app: AppBridge;
  }
}

const viewLabels: Record<AppView, string> = {
  dashboard: 'Dashboard',
  'create-edit': 'Create Edit',
  detail: 'Detail',
  insights: 'Insights',
  settings: 'Settings',
  'error-state': 'Error State',
  'empty-state': 'Empty State',
};

function AtlasTasksShell() {
  const { state, actions, filteredTasks, selectedTask, projects, createSampleTask } = useAppContext();

  useEffect(() => {
    window.app = { state, actions };
  }, [actions, state]);

  const navigateActions = useMemo(
    () => ({
      'dashboard-1': () => actions.navigate('dashboard'),
      'create-edit-2': actions.openCreate,
      'detail-3': () => actions.navigate(selectedTask ? 'detail' : 'empty-state'),
      'insights-4': () => actions.navigate('insights'),
      'settings-5': () => actions.navigate('settings'),
      'error-state-6': () => actions.navigate('error-state'),
      'empty-state-7': () => actions.navigate('empty-state'),
    }),
    [actions, selectedTask],
  );

  const sharedTaskActions = useMemo(
    () => ({
      'start-game-1': createSampleTask,
      'resume-2': () => actions.navigate('dashboard'),
      'open-settings-3': () => actions.navigate('settings'),
      ...navigateActions,
    }),
    [actions, createSampleTask, navigateActions],
  );

  const dashboardActions = useMemo<Partial<Record<DashboardActionId, () => void>>>(
    () => ({
      'pause-1': actions.pause,
      'restart-2': actions.restart,
      ...navigateActions,
    }),
    [actions, navigateActions],
  );

  const settingsActions = useMemo<Partial<Record<SettingsActionId, () => void>>>(
    () => ({
      'save-settings-1': () => actions.saveSettings({ compactMode: !state.settings.compactMode }),
      'reset-defaults-2': actions.resetDefaults,
      ...navigateActions,
    }),
    [actions, navigateActions, state.settings.compactMode],
  );

  const renderedScreen = (() => {
    switch (state.activeView) {
      case 'create-edit':
        return <CreateEdit actions={sharedTaskActions as Partial<Record<CreateEditActionId, () => void>>} />;
      case 'detail':
        return <Detail actions={sharedTaskActions as Partial<Record<DetailActionId, () => void>>} />;
      case 'insights':
        return <Insights actions={sharedTaskActions as Partial<Record<InsightsActionId, () => void>>} />;
      case 'settings':
        return <Settings actions={settingsActions} />;
      case 'error-state':
        return <ErrorState actions={sharedTaskActions as Partial<Record<ErrorStateActionId, () => void>>} />;
      case 'empty-state':
        return <EmptyState actions={sharedTaskActions as Partial<Record<EmptyStateActionId, () => void>>} />;
      case 'dashboard':
      default:
        return <Dashboard actions={dashboardActions} />;
    }
  })();

  return (
    <div data-setfarm-root="atlas-tasks" className="atlas-shell">
      <section className="atlas-control-strip" aria-label="Atlas Tasks controls">
        <div>
          <p className="atlas-eyebrow">Atlas Tasks</p>
          <h1>{viewLabels[state.activeView]}</h1>
        </div>
        <div className="atlas-control-grid">
          <label>
            <span>Project</span>
            <select value={state.projectFilter} onChange={(event) => actions.setProjectFilter(event.target.value)}>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input
              value={state.query}
              onChange={(event) => actions.setQuery(event.target.value)}
              placeholder="Task, owner, project"
            />
          </label>
          <button type="button" onClick={actions.openCreate}>
            New task
          </button>
        </div>
      </section>

      <section className="atlas-board" aria-label="Task board">
        <div className="atlas-metrics" aria-label="Task metrics">
          <span>{filteredTasks.length} visible</span>
          <span>{state.tasks.filter((task) => task.status === 'doing').length} in progress</span>
          <span>{state.tasks.filter((task) => task.status === 'done').length} done</span>
          <span>{state.isPaused ? 'Paused' : 'Live'}</span>
        </div>
        <div className="atlas-columns">
          {(['todo', 'doing', 'done'] as const).map((status) => (
            <article key={status} className="atlas-column">
              <h2>{status === 'todo' ? 'To do' : status === 'doing' ? 'Doing' : 'Done'}</h2>
              {filteredTasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    className="atlas-task"
                    onClick={() => actions.selectTask(task.id)}
                    aria-pressed={task.id === selectedTask?.id}
                  >
                    <strong>{task.title}</strong>
                    <span>{task.project}</span>
                    <small>
                      {task.owner} / {task.priority} / {task.dueDate}
                    </small>
                  </button>
                ))}
            </article>
          ))}
        </div>
      </section>

      {state.isCreateOpen ? (
        <section className="atlas-modal" role="dialog" aria-modal="true" aria-label="Create task">
          <div>
            <h2>Create task</h2>
            <p>Draft a task from the app shell, then open the generated edit flow.</p>
            <div className="atlas-modal-actions">
              <button type="button" onClick={createSampleTask}>
                Create sample task
              </button>
              <button type="button" onClick={actions.closeCreate}>
                Close
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="atlas-screen-frame" aria-label={`${viewLabels[state.activeView]} generated screen`}>
        {renderedScreen}
      </section>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AtlasTasksShell />
    </AppProvider>
  );
}
