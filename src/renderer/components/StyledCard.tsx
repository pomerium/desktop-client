import { Card } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: 2,
  marginTop: 2,
  marginBottom: 2,
  borderRadius: '16px',
  offset: '0px, 1px',
}));

export default StyledCard;
