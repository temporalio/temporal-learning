import React from 'react';
import PropTypes from 'prop-types';

const ResizedImage = ({ src, alt, width, height }) => {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: width, height: height}}
    />
  );
};

ResizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
};

ResizedImage.defaultProps = {
  width: '300px',
  height: 'auto',
};

export default ResizedImage;
