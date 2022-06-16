import React from 'react';

import Details from '@theme/Details';

export default function Expander({children, text}) {
  return (
    <Details className="expander">
      <summary>{text}</summary>
      <div className="content">
      {children}
      </div>
    </Details>
  )
}
