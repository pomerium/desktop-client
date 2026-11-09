import { TextField as MuiTextField, TextFieldProps } from "@mui/material";
import { ReactElement } from "react";

function TextField(props: TextFieldProps): ReactElement {
  return <MuiTextField {...props} variant="outlined" size="small" color="primary" />;
}
export default TextField;
