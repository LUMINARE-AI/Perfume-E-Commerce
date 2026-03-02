import clsx from "clsx";

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium transition rounded-sm focus:outline-none";

  const variants = {
    primary:
      "bg-yellow-400 text-black hover:bg-yellow-300",
    outline:
      "border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black",
    ghost:
      "text-white hover:text-yellow-400",
  };

  return (
    <button
      className={clsx(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
