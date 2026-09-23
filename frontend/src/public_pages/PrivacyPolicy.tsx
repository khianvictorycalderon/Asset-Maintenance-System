import { PRIVACY_LAST_UPDATED_DATE, PRIVACY_POLICY } from "../config";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full flex justify-center bg-orange-50/40 dark:bg-zinc-950 text-zinc-900 dark:text-orange-100 px-4 sm:px-6 py-24 transition-colors duration-300">
      <div className="w-full max-w-3xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-orange-50">
            Privacy Policy
          </h1>

          <p className="text-zinc-600 dark:text-orange-200/70 text-sm md:text-base">
            Last updated: {PRIVACY_LAST_UPDATED_DATE}
          </p>

          {/* Orange accent */}
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-orange-500 dark:bg-orange-500" />
        </div>

        {/* Content */}
        <div className="space-y-5">
          {PRIVACY_POLICY.map((item, index) => (
            <div
              key={index}
              className="
                p-5 sm:p-6
                rounded-xl
                border
                border-zinc-200
                dark:border-zinc-800
                bg-white
                dark:bg-zinc-900
                shadow-sm
                dark:shadow-none
                hover:bg-orange-50
                dark:hover:bg-zinc-800
                transition-colors
                duration-200
              "
            >
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-orange-50">
                {item.title}
              </h2>

              <p
                className="
                  mt-2
                  text-sm sm:text-base
                  text-zinc-600
                  dark:text-orange-200/80
                  leading-relaxed
                "
                dangerouslySetInnerHTML={{ __html: item.desc }}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}