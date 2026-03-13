// frontend\src\hooks\useFormStatePersistence.ts
import { useRef, useCallback } from "react";

export interface UseFormStatePersistenceReturn<T> {
    takeSnapshot: () => void;

    restoreSnapshot: () => T | null;

    clearSnapshot: () => void;

    hasSnapshot: boolean;
}

export function useFormStatePersistence<T extends object>(
    currentValues: T,
    cloneFn: (values: T) => T = (v) => ({...v})
): UseFormStatePersistenceReturn<T> {
    const snapshotRef= useRef<T | null>(null);

    const hasSnapshot = snapshotRef.current !== null

    const takeSnapshot = useCallback(() => {
        snapshotRef.current = cloneFn(currentValues);
    }, [currentValues, cloneFn]);

    const restoreSnapshot = useCallback((): T | null => {
        return snapshotRef.current;
    }, []);

    const clearSnapshot = useCallback(() => {
        snapshotRef.current = null;
    }, []);

    return {takeSnapshot, restoreSnapshot, clearSnapshot, hasSnapshot};

}