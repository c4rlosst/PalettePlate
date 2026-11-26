/** A round profile picture, or the person's first initial when they have not set one. */
export function Avatar({
  name,
  src,
  size = 42,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const box = { width: size, height: size };
  if (src)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="avatar avatar-img" src={src} alt="" style={box} />
    );
  return (
    <span
      className="avatar"
      style={{ ...box, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
