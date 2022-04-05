import { SvgIcon } from '@mui/material';

import React from 'react';

const ClosedFolder = (): JSX.Element => {
  return (
    <SvgIcon viewBox="0 0 20 20" sx={{ width: '20px', height: '20px' }}>
      <path
        d="M8.33317 3.3335H3.33317C2.4165 3.3335 1.67484 4.0835 1.67484 5.00016L1.6665 15.0002C1.6665 15.9168 2.4165 16.6668 3.33317 16.6668H16.6665C17.5832 16.6668 18.3332 15.9168 18.3332 15.0002V6.66683C18.3332 5.75016 17.5832 5.00016 16.6665 5.00016H9.99984L8.33317 3.3335Z"
        fill="#2196F3"
      />
    </SvgIcon>
  );
};
export default ClosedFolder;
