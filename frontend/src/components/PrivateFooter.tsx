import { PRIVATE_FOOTER_LABEL } from "../config";

export default function PrivateFooter() {
  return (
    <footer className="w-full py-6 px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
      
      <div className="max-w-6xl mx-auto">
        
        <hr className="border-zinc-400 dark:border-zinc-800 mb-10" />

        <span className="block">
          © {new Date().getFullYear()} {PRIVATE_FOOTER_LABEL}
        </span>

      </div>

    </footer>
  );
}