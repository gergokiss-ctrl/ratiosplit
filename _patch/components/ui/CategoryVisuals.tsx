import type { CSSProperties, ReactNode } from "react";

type CategoryDotProps = {
  color?: string | null;
};

type CategoryLabelProps = CategoryDotProps & {
  children: ReactNode;
  pill?: boolean;
};

export function CategoryDot({ color }: CategoryDotProps) {
  return (
    <span
      aria-hidden="true"
      className="category-dot"
      style={{ background: color ?? "#64748B" } as CSSProperties}
    />
  );
}

export function CategoryLabel({ color, children, pill = false }: CategoryLabelProps) {
  return (
    <span className={pill ? "category-pill" : "category-label"}>
      <CategoryDot color={color} />
      {children}
    </span>
  );
}
