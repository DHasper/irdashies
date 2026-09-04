import { useMemo } from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import {
  useDriverCarIdx,
  useGeneralSettings,
  useSessionStore,
} from '@irdashies/context';
import { DEFAULT_ANONYMOUS_NAMES, type Driver } from '@irdashies/types';
import { driversIdentityEqual } from './useDriverTagMap';

type AnonDriver = Pick<Driver, 'CarIdx' | 'UserID' | 'CarIsPaceCar'>;

/**
 * Maps carIdx -> alias. The slot is derived from UserID so a driver keeps the
 * same alias across sessions; collisions probe to the next free slot. When
 * the pool is exhausted, names repeat with a numeric suffix ("Alex Carter 2").
 */
export const assignAnonymousNames = (
  drivers: AnonDriver[],
  names: string[],
  ownName?: string,
  playerCarIdx?: number
): Map<number, string> => {
  const map = new Map<number, string>();
  const len = names.length;
  if (!len) return map;
  const used = new Set<number>();
  // Lower UserID wins a collision so the result doesn't depend on grid order.
  const sorted = drivers
    .filter((d) => !d.CarIsPaceCar)
    .sort((a, b) => a.UserID - b.UserID);
  for (const d of sorted) {
    if (d.CarIdx === playerCarIdx && ownName) {
      map.set(d.CarIdx, ownName);
      continue;
    }
    const id = Number.isFinite(d.UserID) ? d.UserID : d.CarIdx;
    const base = ((id % len) + len) % len;
    let slot = base;
    for (let k = 1; used.has(slot); k++) {
      slot = ((base + k) % len) + len * Math.floor(k / len);
    }
    used.add(slot);
    map.set(
      d.CarIdx,
      slot < len
        ? names[slot]
        : `${names[slot % len]} ${Math.floor(slot / len) + 1}`
    );
  }
  return map;
};

export const useAnonymousNameMap = (enabled?: boolean): Map<number, string> => {
  const settings = useGeneralSettings()?.anonymizeNames;
  const playerCarIdx = useDriverCarIdx();
  const drivers = useStoreWithEqualityFn(
    useSessionStore,
    (state) => state.session?.DriverInfo?.Drivers,
    driversIdentityEqual
  );

  return useMemo(() => {
    if (!enabled || !drivers) return new Map<number, string>();
    // An empty list must never leak real names, so fall back to the defaults.
    const names = settings?.names?.length
      ? settings.names
      : DEFAULT_ANONYMOUS_NAMES;
    return assignAnonymousNames(
      drivers,
      names,
      settings?.ownName?.trim() || undefined,
      playerCarIdx
    );
  }, [enabled, drivers, settings, playerCarIdx]);
};
