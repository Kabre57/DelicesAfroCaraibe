// Lightweight AspectRatio without Radix dependency
import * as React from "react";

type Props = React.PropsWithChildren<{
  ratio?: number; // width / height
  className?: string;
}>;

function AspectRatio({ ratio = 16 / 9, className, children }: Props) {
  const paddingBottom = `${100 / ratio}%`;
  return (
    <div data-slot="aspect-ratio" className={className} style={{ position: "relative", width: "100%" }}>
      <div style={{ paddingBottom }} />
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
}

export { AspectRatio };
