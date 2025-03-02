import React from 'react';
import { oneOf, string } from 'prop-types';
import classNames from 'classnames';

const IconInfo = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName, className);
  return (
    <svg
      className={classes}
      width="20px"
      height="20px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <g id="Warning / Info">
          {' '}
          <path
            id="Vector"
            d="M12 11V16M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21ZM12.0498 8V8.1L11.9502 8.1002V8H12.0498Z"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>{' '}
        </g>{' '}
      </g>
    </svg>
  );
};

IconInfo.defaultProps = {
  className: null,
  rootClassName: null,
};

IconInfo.propTypes = {
  className: string,
  rootClassName: string,
};

export default IconInfo;