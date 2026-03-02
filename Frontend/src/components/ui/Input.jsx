export default function Input({
  label,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1 text-sm text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 bg-transparent border border-white/20 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
