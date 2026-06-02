import React, { useState } from 'react';
import classNames from 'classnames';

import { Menu, MenuContent, MenuItem, MenuLabel } from '../../../components';
import css from './SortByPopup.module.css';

const optionLabel = (options, key) => {
  const option = options.find(o => o.key === key);
  return option ? option.label : key;
};

const SortByIcon = props => {
  const classes = classNames(css.icon, props.className);
  // extra small arrow head (down)
  return (
    <svg className={classes} width="8" height="5" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.764 4.236c.131.13.341.13.472 0l2.666-2.667a.333.333 0 10-.471-.471L4 3.528l-2.43-2.43a.333.333 0 10-.471.471l2.665 2.667z"
        fill="#4A4A4A"
        stroke="#4A4A4A"
        fillRule="evenodd"
      />
    </svg>
  );
};

/**
 * SortByPopup component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.menuLabelRootClassName] - Custom class that extends the default class for the menu label
 * @param {string} props.urlParam - The url param
 * @param {string} props.label - The label
 * @param {Function} props.onSelect - The function to handle the select
 * @param {Array<Object>} props.options - The options [{ key: string, label: string }]
 * @param {string} [props.initialValue] - The initial value
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @returns {JSX.Element}
 */
const SortByPopup = props => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    rootClassName,
    className,
    menuLabelRootClassName,
    urlParam,
    label,
    options,
    initialValue,
    contentPlacementOffset = 0,
    onSelect,
    iconOnly = false,
  } = props;

  const onToggleActive = isOpenParam => {
    setIsOpen(isOpenParam);
  };

  const selectOption = (urlParameter, option) => {
    setIsOpen(false);
    onSelect(urlParameter, option);
  };

  // resolve menu label text and class
  const menuLabel = initialValue ? optionLabel(options, initialValue) : label;

  const classes = classNames(rootClassName || css.root, className);
  const menuLabelClasses = classNames(menuLabelRootClassName);
  const iconArrowClassName = isOpen ? css.iconArrowAnimation : null;

  return (
    <Menu
      className={classes}
      useArrow={false}
      contentPlacementOffset={contentPlacementOffset}
      contentPosition="left"
      onToggleActive={onToggleActive}
      isOpen={isOpen}
      preferScreenWidthOnMobile
    >
      <MenuLabel rootClassName={menuLabelClasses} title="Sort listings">
        {iconOnly ? (
          /* Sliders/tune icon — clearly "sort", not hamburger */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="9" cy="6" r="2.2" fill="currentColor" stroke="none"/>
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="16" cy="12" r="2.2" fill="currentColor" stroke="none"/>
            <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="10" cy="18" r="2.2" fill="currentColor" stroke="none"/>
          </svg>
        ) : (
          <>
            {menuLabel}
            <SortByIcon className={iconArrowClassName} />
          </>
        )}
      </MenuLabel>
      <MenuContent className={css.menuContent}>
        {options.map(option => {
          // check if this option is selected
          const selected = initialValue === option.key;
          // menu item border class
          const menuItemBorderClass = selected ? css.menuItemBorderSelected : css.menuItemBorder;

          return (
            <MenuItem key={option.key}>
              <button
                className={css.menuItem}
                disabled={option.disabled}
                onClick={() => (selected ? null : selectOption(urlParam, option.key))}
              >
                <span className={menuItemBorderClass} />
                {option.longLabel || option.label}
              </button>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
};

export default SortByPopup;
