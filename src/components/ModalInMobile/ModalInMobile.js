/**
 * ModalInMobile gives possibility separate part of existing DOM so that in mobile views that
 * fragment is shown in a separate modal layer on top of the page.
 *
 * Currently, this does not implement resize listener for window.
 *
 * Example:
 * <Parent>
 *   <ModalInMobile isModalOpenOnMobile={this.state.modalOpen} onClose={handleClose}>
 *     <FormX />
 *   </ModalInMobile>
 * </Parent>
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Modal } from '../../components';
import { withViewport } from '../../util/uiHelpers';

import css from './ModalInMobile.module.css';

class ModalInMobileComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.handleClose = this.handleClose.bind(this);
    this.changeOpenStatus = this.changeOpenStatus.bind(this);
  }

  componentDidMount() {
    const { isModalOpenOnMobile, showAsModalMaxWidth, viewport } = this.props;

    // Force mobile layout for all screen sizes
    const isMobileLayout = true;

    if (isMobileLayout && isModalOpenOnMobile) {
      this.changeOpenStatus(isModalOpenOnMobile);
    }
  }

  componentDidUpdate() {
    const { isModalOpenOnMobile, showAsModalMaxWidth, viewport } = this.props;

    const isChanging = isModalOpenOnMobile !== this.state.isOpen;
    const isMobileLayout = true; // Force mobile layout for all screen sizes
    const shouldBeClosedAsModal = false; // Never close as desktop

    // Handle change if status is changing on mobile layout or it is closing (on desktop layout)
    if (isChanging && (isMobileLayout || shouldBeClosedAsModal)) {
      this.changeOpenStatus(isModalOpenOnMobile);
    }
  }

  changeOpenStatus(isOpen) {
    this.setState({ isOpen });
  }

  handleClose(event) {
    const { onClose } = this.props;
    this.changeOpenStatus(false);
    if (onClose) {
      onClose(event);
    }
  }

  render() {
    const {
      children,
      className,
      containerClassName,
      id,
      showAsModalMaxWidth,
      closeButtonMessage,
      onManageDisableScrolling,
      viewport,
      usePortal,
      hideCloseIcon = false,
      isFilterMobileModal,
    } = this.props;

    const isMobileLayout = true; // Force mobile layout for all screen sizes
    const isOpenInMobile = this.state.isOpen;
    const isClosedInMobile = !isOpenInMobile; // Always in mobile mode
    const isOpen = isOpenInMobile; // Always in mobile mode

    // We have 3 view states:
    // - default desktop layout (just an extra wrapper)
    // - mobile layout: content visible inside modal popup
    // - mobile layout: content hidden
    const closedClassName = isClosedInMobile ? css.modalHidden : null;
    const classes = classNames(css.root, className);

    return (
      <Modal
        className={classes}
        containerClassName={containerClassName || css.modalContainer}
        contentClassName={css.modalContent}
        id={id}
        isOpen={isOpen}
        isClosedClassName={closedClassName}
        onClose={this.handleClose}
        hideCloseIcon={hideCloseIcon}
        closeButtonMessage={closeButtonMessage}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal={usePortal && isOpen}
        isFilterMobileModal={isFilterMobileModal}
      >
        {children}
      </Modal>
    );
  }
}

ModalInMobileComponent.defaultProps = {
  children: null,
  className: '',
  containerClassName: null,
  onClose: null,
  showAsModalMaxWidth: 0,
  closeButtonMessage: null,
};

const { bool, func, node, number, string, shape } = PropTypes;

ModalInMobileComponent.propTypes = {
  children: node,
  className: string,
  containerClassName: string,
  id: string.isRequired,
  isModalOpenOnMobile: bool.isRequired,
  onClose: func,
  showAsModalMaxWidth: number,
  closeButtonMessage: node,
  // eslint-disable-next-line react/no-unused-prop-types
  onManageDisableScrolling: func.isRequired,

  // from withViewport
  viewport: shape({
    width: number.isRequired,
    height: number.isRequired,
  }).isRequired,
};

const ModalInMobile = withViewport(ModalInMobileComponent);

export default ModalInMobile;