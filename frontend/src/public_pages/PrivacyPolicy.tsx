import { PRIVACY_LAST_UPDATED_DATE, PRIVACY_POLICY } from "../config";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full flex justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 px-6 py-24">
      <div className="w-full max-w-3xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base">
            Last updated: {PRIVACY_LAST_UPDATED_DATE}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {PRIVACY_POLICY.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {item.title}
              </h2>

              <p
                className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.desc }}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}