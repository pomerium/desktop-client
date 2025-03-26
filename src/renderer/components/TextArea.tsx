import { styled, TextField } from '@mui/material';

const TextArea = styled(TextField)({
  '& div.MuiFilledInput-root': {
    background: `rgba(110, 67, 232, 0.05)`,
    padding: `0px`,
    marginTop: `10px`,
    display: `flex`,
    flexFlow: `row nowrap`,
    boxShadow: `0 0 0 1px rgb(63 63 68 / 5%), 0 1px 2px 0 rgb(63 63 68 / 15%)`,

    '& div.MuiFilledInput-root': {
      margin: `2px 0px 0px 6px`,
      height: `100%`,
    },
    '& input.MuiInputBase-input': {
      padding: `6px`,
      margin: `6px`,
    },

    '& .MuiFilledInput-inputMultiline': {
      padding: `10px`,
    },
  },
  '& div.MuiFilledInput-underline:before': {
    borderBottom: `0px`,
  },
  '& div.MuiFilledInput-underline:after': {
    border: `0px`,
  },
});
export default TextArea;
