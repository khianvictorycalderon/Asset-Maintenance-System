import { PRIVATE_FOOTER_LABEL } from "../config";

export default function PrivateFooter() {
  return (
    <footer className="w-full py-6 px-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
      
      <div className="max-w-6xl mx-auto">
        
        <hr className="border-neutral-400 dark:border-neutral-800 mb-10" />

        <span className="block">
          © {new Date().getFullYear()} {PRIVATE_FOOTER_LABEL}
        </span>

      </div>

    </footer>
  );
}