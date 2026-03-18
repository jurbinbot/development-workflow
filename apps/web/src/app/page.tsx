import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Development Workflow
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            From idea to deployment with AI-assisted planning
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/ideas"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">💡 Ideas</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Capture and refine your project ideas with AI assistance
            </p>
          </Link>

          <Link
            href="/plans"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">📋 Plans</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Generate and iterate on development plans
            </p>
          </Link>

          <Link
            href="/tasks"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">✅ Tasks</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track progress with Kanban-style task management
            </p>
          </Link>

          <Link
            href="/clusters"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">☸️ Clusters</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage Kubernetes cluster configurations
            </p>
          </Link>

          <Link
            href="/deployments"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">🚀 Deployments</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Deploy to your Kubernetes clusters
            </p>
          </Link>

          <Link
            href="/settings"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">⚙️ Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure application and user settings
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}