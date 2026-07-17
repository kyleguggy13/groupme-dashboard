import Image from "next/image";

interface AvatarProps {
  name: string;
  initials?: string;
  color?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Avatar({ name, initials, color = "violet", src, size = "md" }: AvatarProps) {
  const fallback = initials ?? name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className={`avatar avatar-${size} avatar-${color}`} aria-label={name}>
      {src ? <Image src={src} alt="" fill sizes="96px" /> : fallback}
    </span>
  );
}
