import React from 'react';
import classNames from 'classnames';

import css from './IconSocialMediaInstagram.module.css';

/**
 * Instagram icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconSocialMediaInstagram = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg className={classes} width="16" height="17" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.286 8.57C10.286 7.156 9.13 6 7.714 6c-1.416 0-2.57 1.155-2.57 2.57s1.154 2.573 2.57 2.573c1.417 0 2.572-1.155 2.572-2.572zm1.386 0c0 2.19-1.768 3.96-3.958 3.96-2.19 0-3.957-1.77-3.957-3.96 0-2.188 1.768-3.956 3.957-3.956 2.19 0 3.958 1.768 3.958 3.957zm1.085-4.117c0 .512-.412.924-.924.924-.513 0-.925-.412-.925-.924s.412-.924.925-.924c.512 0 .924.41.924.923zm-5.043-2.21c-1.125 0-3.535-.09-4.55.312-.352.14-.613.31-.884.582-.27.27-.442.533-.582.884-.402 1.016-.312 3.426-.312 4.55 0 1.126-.09 3.537.312 4.552.14.35.31.612.582.884.27.27.533.442.884.582 1.015.402 3.425.312 4.55.312s3.536.09 4.55-.312c.352-.14.613-.31.884-.582.272-.272.442-.533.583-.884.403-1.015.312-3.426.312-4.55 0-1.126.09-3.536-.31-4.55-.142-.352-.312-.614-.584-.885-.27-.27-.532-.442-.883-.582-1.015-.402-3.426-.312-4.55-.312zM15.43 8.57c0 1.066.01 2.12-.052 3.186-.06 1.235-.34 2.33-1.245 3.234-.904.904-2 1.185-3.235 1.245-1.064.06-2.12.05-3.184.05s-2.12.01-3.184-.05c-1.235-.06-2.33-.34-3.234-1.245-.904-.904-1.186-2-1.246-3.234C-.01 10.69 0 9.636 0 8.57c0-1.063-.01-2.118.05-3.183.06-1.235.342-2.33 1.246-3.234C2.2 1.25 3.296.968 4.53.907c1.065-.06 2.12-.05 3.184-.05 1.065 0 2.12-.01 3.184.05 1.236.06 2.33.342 3.235 1.246.904.904 1.185 2 1.245 3.234.06 1.065.05 2.12.05 3.184z"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default IconSocialMediaInstagram;
