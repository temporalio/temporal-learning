import React from 'react';

import Details from '@theme/Details';

export default function Expander({children, text}) {
  return (
    <Details className="expander">
      <Summary>{text}</Summary>
      <div className="content">
      {children}
      </div>
    </Details>
  )
}
