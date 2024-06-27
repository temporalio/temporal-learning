import React, { useEffect, useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const H5PEmbed = ({ h5pJsonPath }) => {
  return (
    <BrowserOnly fallback={<div>Loading H5P Content...</div>}>
      {() => {
        // The following code will only execute in the browser environment
        const H5P = require('h5p-standalone').H5P;
        const H5PComponent = () => {
          const h5pRef = useRef(null);

          useEffect(() => {
            const options = {
              h5pJsonPath: h5pJsonPath,
              frameJs: '/h5p/frame.bundle.js',
              frameCss: '/h5p/h5p.css',
            };

            if (h5pRef.current) {
              new H5P(h5pRef.current, options);
            }
          }, [h5pJsonPath]);

          return <div className="h5p-container" ref={h5pRef}></div>;
        };

        return <H5PComponent />;
      }}
    </BrowserOnly>
  );
};

export default H5PEmbed;
