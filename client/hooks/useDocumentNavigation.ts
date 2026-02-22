import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface DocumentNavState {
  ids: string[];
}

/**
 * List sahifada qator bosilganda sessionStorage ga IDlar saqlaydi.
 * Detail sahifada ← → navigatsiyani ta'minlaydi.
 */
export function storeDocumentIds(key: string, ids: string[]) {
  sessionStorage.setItem(`doc-nav-${key}`, JSON.stringify({ ids }));
}

export function useDocumentNavigation(key: string, listUrl: string) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const navState = useMemo<DocumentNavState | null>(() => {
    try {
      const raw = sessionStorage.getItem(`doc-nav-${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [key]);

  const currentIndex = navState && id ? navState.ids.indexOf(id) : -1;
  const totalCount = navState?.ids.length ?? 0;

  const goToPrev = useCallback(() => {
    if (!navState || currentIndex <= 0) return;
    navigate(`${listUrl}/${navState.ids[currentIndex - 1]}`);
  }, [navState, currentIndex, listUrl, navigate]);

  const goToNext = useCallback(() => {
    if (!navState || currentIndex < 0 || currentIndex >= navState.ids.length - 1) return;
    navigate(`${listUrl}/${navState.ids[currentIndex + 1]}`);
  }, [navState, currentIndex, listUrl, navigate]);

  const goToList = useCallback(() => {
    navigate(listUrl);
  }, [listUrl, navigate]);

  return {
    currentIndex: currentIndex >= 0 ? currentIndex + 1 : 0, // 1-based
    totalCount,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex >= 0 && currentIndex < totalCount - 1,
    goToPrev,
    goToNext,
    goToList,
  };
}
