export default function Tooltip({ children, label, side = "bottom" }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        className={[
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white group-hover:block",
          side === "bottom" ? "left-1/2 -translate-x-1/2 top-full mt-2" : "",
          side === "right" ? "left-full ml-2 top-1/2 -translate-y-1/2" : "",
        ].join(" ")}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
