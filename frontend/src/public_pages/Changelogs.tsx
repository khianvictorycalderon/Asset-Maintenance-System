import { CHANGELOGS } from "../config";

export default function Changelogs() {

  return (
    <div className="min-h-screen w-full flex justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 px-6 py-24">
      <div className="w-full max-w-3xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Changelogs
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base">
            Release history and updates
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {CHANGELOGS.map((log, index) => (
            <div
              key={index}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              {/* Release header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Release {log.release}
                </h2>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Release
                </span>
              </div>

              {/* Changes */}
              <ul className="space-y-2 list-disc list-inside text-zinc-600 dark:text-zinc-400">
                {log.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}