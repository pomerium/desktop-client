// Types-only shim: the renderer still passes legacy MUI system props directly
// to Grid/Stack/Box (`item`, `xs`, `alignItems`, `mt`, ...). MUI v9 no longer
// declares them. This keeps the existing JSX type-checking without touching it.
import "@mui/material/Grid";
import "@mui/material/Stack";
import "@mui/system";
import type { CSSProperties } from "react";

declare module "@mui/material/Grid" {
  interface GridBaseProps {
    item?: boolean;
    xs?: boolean | "auto" | number;
    alignItems?: CSSProperties["alignItems"];
    justifyContent?: CSSProperties["justifyContent"];
  }
}

declare module "@mui/material/Stack" {
  interface StackOwnProps {
    alignItems?: CSSProperties["alignItems"];
    justifyContent?: CSSProperties["justifyContent"];
  }
}

declare module "@mui/system" {
  interface BoxOwnProps {
    mt?: number | string;
    flexGrow?: number;
    minHeight?: number | string;
  }
}
