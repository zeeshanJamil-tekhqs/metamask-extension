/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable @metamask/design-tokens/color-no-hex*/
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeType } from '../../../../shared/constants/preferences';

const LOGO_WIDTH = 162;
const LOGO_HEIGHT = 30;
const TEXT_COLOR = 'var(--color-text-default)';
const FLASK_PILL_BACKGROUND = 'var(--color-overlay-alternative)';
const FLASK_PILL_TEXT = 'var(--color-overlay-inverse)';
const BETA_PILL_BACKGROUND = 'var(--color-primary-default)';
const BETA_PIL_TEXT = 'var(--color-primary-inverse)';

export default function MetaFoxHorizontalLogo({
  theme: themeProps,
  className,
}) {
  const [setTheme] = useState(() =>
    themeProps === undefined
      ? document.documentElement.getAttribute('data-theme')
      : themeProps,
  );

  useEffect(() => {
    if (themeProps !== undefined) {
      setTheme(themeProps);
    }
  }, [themeProps]);

  switch (process.env.METAMASK_BUILD_TYPE) {
    case 'beta':
      return (
        <img
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          src="./images/logo/metamask-fox.svg"
        />
      );
    case 'flask':
      return (
        <img
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          src="./images/logo/metamask-fox.svg"
        />
      );
    default:
      return (
        <img
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          src="./images/logo/metamask-fox.svg"
        />
      );
  }
}

MetaFoxHorizontalLogo.propTypes = {
  theme: PropTypes.oneOf([ThemeType.light, ThemeType.dark, ThemeType.os]),
  className: PropTypes.string,
};
