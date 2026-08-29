'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  type AnnotationMap,
  type TradeAnnotation,
  isEmptyAnnotation,
  mergeAnnotationMaps,
  parseAnnotationMap,
  upsertAnnotation,
} from '@/lib/trades/annotations';

export const TRADE_ANNOTATIONS_STORAGE_KEY = 'riskguard.trade-annotations.v1';

const EMPTY: AnnotationMap = {};
const listeners = new Set<() => void>();
let memory: AnnotationMap = EMPTY;
let hydrated = false;

function emit() {
  listeners.forEach((listener) => listener());
}

export function readAnnotationStore(): AnnotationMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(TRADE_ANNOTATIONS_STORAGE_KEY);
    if (!raw) return {};
    return parseAnnotationMap(JSON.parse(raw) as unknown);
  } catch {
    sessionStorage.removeItem(TRADE_ANNOTATIONS_STORAGE_KEY);
    return {};
  }
}

function writeAnnotationStore(next: AnnotationMap) {
  memory = next;
  if (typeof window !== 'undefined') {
    if (Object.keys(next).length === 0) {
      sessionStorage.removeItem(TRADE_ANNOTATIONS_STORAGE_KEY);
    } else {
      sessionStorage.setItem(TRADE_ANNOTATIONS_STORAGE_KEY, JSON.stringify(next));
    }
  }
  emit();
}

export function getAnnotationSnapshot(): AnnotationMap {
  return memory;
}

export function subscribeAnnotations(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hydrateAnnotationStoreFromSession() {
  if (hydrated) return;
  hydrated = true;
  memory = readAnnotationStore();
  emit();
}

export function mergeAnnotationStore(incoming: AnnotationMap) {
  if (!hydrated) {
    memory = readAnnotationStore();
    hydrated = true;
  }
  writeAnnotationStore(mergeAnnotationMaps(memory, incoming));
}

export function setTradeAnnotation(key: string, patch: Partial<TradeAnnotation>) {
  if (!hydrated) {
    memory = readAnnotationStore();
    hydrated = true;
  }
  const next = { ...memory };
  const merged = upsertAnnotation(next[key], patch);
  if (isEmptyAnnotation(merged)) delete next[key];
  else next[key] = merged;
  writeAnnotationStore(next);
}

export function useTradeAnnotations() {
  const map = useSyncExternalStore(subscribeAnnotations, getAnnotationSnapshot, () => EMPTY);

  useEffect(() => {
    hydrateAnnotationStoreFromSession();
  }, []);

  const setAnnotation = useCallback((key: string, patch: Partial<TradeAnnotation>) => {
    setTradeAnnotation(key, patch);
  }, []);

  return { map, setAnnotation };
}
