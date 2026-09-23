import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center text-white px-4 sm:px-6 transition-colors duration-300 relative overflow-hidden">

  {/* Background Image */}
  <div
    className="
      absolute inset-0
      bg-cover bg-center
      opacity-100
      bg-fixed
    "
    style={{
      backgroundImage: "url('/NEM_mechanical.jpg')",
    }}
  />

  {/* Cinematic gradient overlay */}
  <div
    className="
      absolute inset-0
      bg-gradient-to-b
      from-black/10
      via-orange-950/55
      to-orange-950/85
    "
  />

  {/* Warm glow accent */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(251,146,60,0.28), transparent 70%)",
    }}
  />

  {/* Content */}
  <div className="relative z-10 w-full max-w-3xl text-center space-y-8">

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Manage your assets
          <span className="text-orange-300 drop-shadow-md"> {" "} with Confidence.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-white/90 text-base md:text-lg font-semibold leading-relaxed max-w-xl mx-auto drop-shadow-md">
          A web-based system for an automotive manufacturing company to manage assets, monitor maintenance, and support reliable operations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">

          {/* Sign-In */}
          <Link
            to="/login"
            className="
              w-full sm:w-auto
              px-6 py-3
              rounded-xl
              bg-orange-600
              hover:bg-orange-500
              text-white
              font-medium
              transition-colors
              duration-200
              shadow-lg
              shadow-orange-950/40
            "
          >
            Sign-In
          </Link>

          {/* Create Account */}
          <Link
            to="/register"
            className="
              w-full sm:w-auto
              px-6 py-3
              rounded-xl
              border
              border-white/30
              bg-white/10
              backdrop-blur-sm
              hover:bg-white/20
              text-white
              font-medium
              transition-colors
              duration-200
            "
          >
            Create Account
          </Link>

        </div>

      </div>
    </div>
    
  );
}