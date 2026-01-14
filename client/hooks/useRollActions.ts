import { useState, useCallback } from 'react';
import { rollsApi, saveApi } from '../services/api';

interface RollActionsState {
  isLiked: boolean;
  isSaved: boolean;
  likes: number;
  saves: number;
}

export const useRollActions = (rollId: string, initialState: RollActionsState) => {
  const [state, setState] = useState(initialState);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    
    // Optimistic update
    const newLiked = !state.isLiked;
    const newLikes = newLiked ? state.likes + 1 : state.likes - 1;
    
    setState(prev => ({
      ...prev,
      isLiked: newLiked,
      likes: newLikes
    }));

    setIsLiking(true);
    
    try {
      const res = state.isLiked 
        ? await rollsApi.unlike(rollId)
        : await rollsApi.like(rollId);
      
      if (res.success && res.data) {
        // Sync with backend response
        setState(prev => ({
          ...prev,
          isLiked: res.data.isLiked,
          likes: res.data.likesCount || res.data.likes || prev.likes
        }));
      }
    } catch (error) {
      // Revert optimistic update on error
      setState(prev => ({
        ...prev,
        isLiked: !newLiked,
        likes: !newLiked ? prev.likes + 1 : prev.likes - 1
      }));
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  }, [rollId, state.isLiked, state.likes, isLiking]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    // Optimistic update
    const newSaved = !state.isSaved;
    const newSaves = newSaved ? state.saves + 1 : state.saves - 1;
    
    setState(prev => ({
      ...prev,
      isSaved: newSaved,
      saves: newSaves
    }));

    setIsSaving(true);
    
    try {
      const res = state.isSaved 
        ? await saveApi.unsaveRoll(rollId)
        : await saveApi.saveRoll(rollId);
      
      if (res.success && res.data) {
        // Sync with backend response
        setState(prev => ({
          ...prev,
          isSaved: res.data.isSaved,
          saves: res.data.savesCount || res.data.saves || prev.saves
        }));
      }
    } catch (error) {
      // Revert optimistic update on error
      setState(prev => ({
        ...prev,
        isSaved: !newSaved,
        saves: !newSaved ? prev.saves + 1 : prev.saves - 1
      }));
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [rollId, state.isSaved, state.saves, isSaving]);

  return {
    ...state,
    isLiking,
    isSaving,
    handleLike,
    handleSave
  };
};