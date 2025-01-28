import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ThrottledOrigin } from '../../../../shared/types/origin-throttling';
import { resetOriginThrottlingState } from '../../../store/actions';

import { throttledOriginsSelector } from '../../../selectors';
import useCurrentConfirmation from './useCurrentConfirmation';

const NUMBER_OF_REJECTIONS_THRESHOLD = 3;
const REJECTION_THRESHOLD_IN_MS = 30000;

const willNextRejectionReachThreshold = (
  originState: ThrottledOrigin,
): boolean => {
  if (!originState) {
    return false;
  }
  const currentTime = Date.now();
  const { rejections, lastRejection } = originState;
  return (
    rejections + 1 >= NUMBER_OF_REJECTIONS_THRESHOLD &&
    currentTime - lastRejection <= REJECTION_THRESHOLD_IN_MS
  );
};

export function useOriginThrottling() {
  const dispatch = useDispatch();
  const throttledOrigins = useSelector(throttledOriginsSelector);
  const { currentConfirmation } = useCurrentConfirmation();
  const origin =
    currentConfirmation?.origin || currentConfirmation?.messageParams?.origin;
  const originState = throttledOrigins[origin];
  const shouldThrottleOrigin = willNextRejectionReachThreshold(originState);

  const resetOrigin = useCallback(async () => {
    await dispatch(resetOriginThrottlingState(origin));
  }, [dispatch, origin]);

  return {
    origin,
    resetOrigin,
    shouldThrottleOrigin,
  };
}
