/* eslint-disable no-unused-vars */
/* eslint-disable @metamask/design-tokens/color-no-hex*/
import EventEmitter from 'events';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import Mascot from '../../../components/ui/mascot';

export default function MascotBackgroundAnimation({ height, width }) {
  const animationEventEmitter = useRef(new EventEmitter());

  return (
    <div className="mascot-background-animation__animation">
      <div
        className="mascot-background-animation__background-1"
        data-testid="mascot-background-animation-background-1"
      >
        <img width="193" height="190" src="./images/logo/metamask-fox.svg" />
      </div>
      <div
        className="mascot-background-animation__background-2"
        data-testid="mascot-background-animation-background-2"
      >
        <img width="195" height="205" src="./images/logo/metamask-fox.svg" />
      </div>
      <div
        className="mascot-background-animation__mascot-container"
        data-testid="mascot-background-animation-mascot-container"
      >
        {/* <Mascot
          animationEventEmitter={animationEventEmitter.current}
          width={width ?? '42'}
          height={height ?? '42'}
          followMouse={false}
        /> */}
        <img
          width={width ?? '42'}
          height={height ?? '42'}
          src="./images/logo/metamask-fox.svg"
        />
      </div>
    </div>
  );
}

MascotBackgroundAnimation.propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
};
