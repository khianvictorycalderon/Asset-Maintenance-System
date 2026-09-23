import { CHANGELOGS } from "../config";

export default function Changelogs() {
  return (
    <div className="min-h-screen w-full flex justify-center bg-orange-50/40 dark:bg-zinc-950 text-zinc-900 dark:text-orange-100 px-4 sm:px-6 py-24 transition-colors duration-300">
      <div className="w-full max-w-3xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-orange-50">
            Changelogs
          </h1>

          <p className="text-zinc-600 dark:text-orange-200/70 text-sm md:text-base">
            Release history and updates
          </p>

          {/* Orange accent */}
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-orange-500 dark:bg-orange-500" />
        </div>

        {/* Timeline */}
        <div className="space-y-5">
          {CHANGELOGS.map((log, index) => (
            <div
              key={index}
              className="
                rounded-xl
                border
                border-zinc-200
                dark:border-zinc-800
                bg-white
                dark:bg-zinc-900
                p-5 sm:p-6
                shadow-sm
                dark:shadow-none
                hover:bg-orange-50
                dark:hover:bg-zinc-800
                transition-colors
                duration-200
              "
            >
              {/* Release header */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-orange-50">
                  Release {log.release}
                </h2>

                <span
                  className="
                    shrink-0
                    rounded-full
                    bg-orange-100
                    dark:bg-orange-500/15
                    border
                    border-orange-200
                    dark:border-orange-500/30
                    px-3
                    py-1
                    text-xs
                    font-medium
                    text-orange-800
                    dark:text-orange-300
                  "
                >
                  Release
                </span>
              </div>

              {/* Changes */}
              <ul className="space-y-2 list-disc list-inside text-sm sm:text-base text-zinc-600 dark:text-orange-200/80">
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