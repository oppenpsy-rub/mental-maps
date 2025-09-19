import { useCallback, useEffect } from 'react';
import { useDrawing } from './useDrawing';
import { useSessionContext } from '../components/Session/SessionProvider';
import { DrawingElement } from '../types/drawing';

export interface UseDrawingWithSessionReturn extends ReturnType<typeof useDrawing> {
    // Session-aware methods
    saveDrawingState: (questionId: string) => Promise<void>;
    loadDrawingState: (questionId: string) => void;
    autoSaveEnabled: boolean;
    lastSaveTime: number | null;
}

export const useDrawingWithSession = (questionId?: string): UseDrawingWithSessionReturn => {
    const drawing = useDrawing();
    const session = useSessionContext();

    // Auto-save drawing state when it changes
    useEffect(() => {
        if (!questionId || !session.session) return;

        const saveTimeout = setTimeout(async () => {
            try {
                await session.updateDrawingState(questionId, drawing.drawingState);
            } catch (error) {
                console.error('Failed to auto-save drawing state:', error);
            }
        }, 1000); // Debounce saves by 1 second

        return () => clearTimeout(saveTimeout);
    }, [drawing.drawingState, questionId, session]);

    // Load drawing state when question changes
    useEffect(() => {
        if (!questionId || !session.session) return;

        const savedState = session.session.drawingStates[questionId];
        if (savedState) {
            loadDrawingState(questionId);
        }
    }, [questionId, session.session]);

    const saveDrawingState = useCallback(async (qId: string) => {
        if (!session.session) {
            throw new Error('No active session');
        }

        try {
            await session.updateDrawingState(qId, drawing.drawingState);
        } catch (error) {
            console.error('Failed to save drawing state:', error);
            throw error;
        }
    }, [drawing.drawingState, session]);

    const loadDrawingState = useCallback((qId: string) => {
        if (!session.session) return;

        const savedState = session.session.drawingStates[qId];
        if (!savedState) return;

        // Restore drawing elements
        // Note: This is a simplified version. In a real implementation,
        // you'd need to properly reconstruct fabric.js objects from saved data
        savedState.elements.forEach((element: DrawingElement) => {
            drawing.addElement(element);
        });

        // Restore tool settings
        drawing.updateToolSettings(savedState.toolSettings);

        // Restore active tool
        drawing.setActiveTool(savedState.activeTool);
    }, [session.session, drawing]);

    // Enhanced add element with auto-save
    const addElementWithSave = useCallback(async (element: DrawingElement) => {
        drawing.addElement(element);

        if (questionId) {
            try {
                await saveDrawingState(questionId);
            } catch (error) {
                console.error('Failed to save after adding element:', error);
            }
        }
    }, [drawing.addElement, questionId, saveDrawingState]);

    // Enhanced remove element with auto-save
    const removeElementWithSave = useCallback(async (elementId: string) => {
        drawing.removeElement(elementId);

        if (questionId) {
            try {
                await saveDrawingState(questionId);
            } catch (error) {
                console.error('Failed to save after removing element:', error);
            }
        }
    }, [drawing.removeElement, questionId, saveDrawingState]);

    // Enhanced modify element with auto-save
    const modifyElementWithSave = useCallback(async (elementId: string, updates: Partial<DrawingElement>) => {
        drawing.modifyElement(elementId, updates);

        if (questionId) {
            try {
                await saveDrawingState(questionId);
            } catch (error) {
                console.error('Failed to save after modifying element:', error);
            }
        }
    }, [drawing.modifyElement, questionId, saveDrawingState]);

    // Enhanced clear all with auto-save
    const clearAllWithSave = useCallback(async () => {
        drawing.clearAll();

        if (questionId) {
            try {
                await saveDrawingState(questionId);
            } catch (error) {
                console.error('Failed to save after clearing:', error);
            }
        }
    }, [drawing.clearAll, questionId, saveDrawingState]);

    const autoSaveEnabled = session.session !== null;
    const lastSaveTime = session.session?.progress.lastSaveTime || null;

    return {
        ...drawing,

        // Override methods with session-aware versions
        addElement: addElementWithSave,
        removeElement: removeElementWithSave,
        modifyElement: modifyElementWithSave,
        clearAll: clearAllWithSave,

        // Session-specific methods
        saveDrawingState,
        loadDrawingState,
        autoSaveEnabled,
        lastSaveTime
    };
};