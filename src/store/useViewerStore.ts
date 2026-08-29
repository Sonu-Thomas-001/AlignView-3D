import { create } from 'zustand';
import { ViewMode, RenderMode, ActiveTool, STLFileInfo, Measurement, MeasurementPoint } from '@/types/dental';
import { sortSTLFilesByStage } from '@/utils/stlParser';

const INITIAL_UPPER_FILES: STLFileInfo[] = Array.from({ length: 16 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const sizes = [24.6, 22.8, 25.1, 23.9, 24.3, 21.7, 26.0, 23.4, 25.8, 22.1, 24.9, 23.5, 25.2, 24.0, 22.7, 25.4];
  return {
    id: `upper_${num}`,
    name: `Upper_${num}.stl`,
    arch: 'upper',
    stage: i + 1,
    date: '12 Aug 2025',
    fileSize: `${sizes[i % sizes.length].toFixed(1)} MB`,
    verticesCount: 328654 + (i * 1240),
    trianglesCount: 657302 + (i * 2480),
    dimensions: {
      width: 66.0,
      depth: 61.0,
      height: 42.0,
    }
  };
});

const INITIAL_LOWER_FILES: STLFileInfo[] = Array.from({ length: 17 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const sizes = [23.1, 24.0, 22.5, 25.6, 23.8, 24.9, 22.1, 26.3, 24.5, 23.2, 25.0, 22.9, 24.7, 23.6, 25.3, 22.4, 24.8];
  return {
    id: `lower_${num}`,
    name: `Lower_${num}.stl`,
    arch: 'lower',
    stage: i + 1,
    date: '12 Aug 2025',
    fileSize: `${sizes[i % sizes.length].toFixed(1)} MB`,
    verticesCount: 312480 + (i * 1150),
    trianglesCount: 624960 + (i * 2300),
    dimensions: {
      width: 63.5,
      depth: 58.0,
      height: 38.5,
    }
  };
});

interface ViewerState {
  upperFiles: STLFileInfo[];
  lowerFiles: STLFileInfo[];
  selectedUpperId: string;
  selectedLowerId: string;
  
  viewMode: ViewMode;
  renderMode: RenderMode;
  activeTool: ActiveTool;
  
  // Timeline Playback
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  playbackSpeed: number;
  isLooping: boolean;
  
  // Search Filters
  searchUpper: string;
  searchLower: string;
  
  // Camera & Navigation
  cameraTargetView: string | null;
  cameraTriggerCount: number;
  screenshotTriggerCount: number;
  resetViewTriggerCount: number;
  
  // Measurement & Section
  sectionPlaneOffset: number;
  sectionAxis: 'x' | 'y' | 'z';
  measurements: Measurement[];
  pendingMeasurementPoint: MeasurementPoint | null;
  
  // Patient Case Metadata
  patientName: string;
  setPatientName: (name: string) => void;

  // Upload modal
  isUploadModalOpen: boolean;
  uploadArchTarget: 'upper' | 'lower' | 'auto';

  // Responsive Mobile Drawers
  activeMobileDrawer: 'upper' | 'lower' | null;
  setActiveMobileDrawer: (drawer: 'upper' | 'lower' | null) => void;
  toggleMobileDrawer: (drawer: 'upper' | 'lower') => void;
  
  // Model Telemetry Stats
  modelStats: {
    vertices: number;
    triangles: number;
    width: number;
    depth: number;
    height: number;
  };
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setRenderMode: (mode: RenderMode) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setSelectedUpperId: (id: string) => void;
  setSelectedLowerId: (id: string) => void;
  setSearchUpper: (query: string) => void;
  setSearchLower: (query: string) => void;
  
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleLoop: () => void;
  
  snapCameraTo: (view: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right') => void;
  triggerResetView: () => void;
  triggerScreenshot: () => void;
  
  setSectionPlaneOffset: (offset: number) => void;
  setSectionAxis: (axis: 'x' | 'y' | 'z') => void;
  addMeasurementPoint: (pt: MeasurementPoint) => void;
  clearMeasurements: () => void;
  
  openUploadModal: (arch?: 'upper' | 'lower' | 'auto') => void;
  closeUploadModal: () => void;
  addCustomSTL: (arch: 'upper' | 'lower', file: STLFileInfo) => void;
  addBatchSTLs: (payload: { patientName?: string; upperFiles?: STLFileInfo[]; lowerFiles?: STLFileInfo[]; replaceExisting?: boolean }) => void;
  deleteSTL: (arch: 'upper' | 'lower', id: string) => void;
  deleteAllSTLs: (arch: 'upper' | 'lower') => void;
  resetDefaultSTLs: (arch?: 'upper' | 'lower') => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  patientName: 'Krishnapriya',
  setPatientName: (name) => set({ patientName: name }),

  upperFiles: INITIAL_UPPER_FILES,
  lowerFiles: INITIAL_LOWER_FILES,
  selectedUpperId: 'upper_01',
  selectedLowerId: 'lower_01',
  
  viewMode: 'both',
  renderMode: 'shaded',
  activeTool: 'move',
  
  isPlaying: false,
  currentStep: 8, // matching design (8 / 32)
  totalSteps: 32,
  playbackSpeed: 1.0,
  isLooping: true,
  
  searchUpper: '',
  searchLower: '',
  
  cameraTargetView: null,
  cameraTriggerCount: 0,
  screenshotTriggerCount: 0,
  resetViewTriggerCount: 0,
  
  sectionPlaneOffset: 0,
  sectionAxis: 'y',
  measurements: [],
  pendingMeasurementPoint: null,
  
  isUploadModalOpen: false,
  uploadArchTarget: 'auto',
  activeMobileDrawer: null,

  setActiveMobileDrawer: (drawer) => set({ activeMobileDrawer: drawer }),
  toggleMobileDrawer: (drawer) => set((state) => ({
    activeMobileDrawer: state.activeMobileDrawer === drawer ? null : drawer,
  })),
  
  modelStats: {
    vertices: 328654,
    triangles: 657302,
    width: 66.0,
    depth: 61.0,
    height: 42.0,
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setRenderMode: (mode) => set({ renderMode: mode }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  setSelectedUpperId: (id) => {
    const file = get().upperFiles.find(f => f.id === id);
    if (file) {
      set({ 
        selectedUpperId: id,
        modelStats: {
          vertices: file.verticesCount,
          triangles: file.trianglesCount,
          width: file.dimensions.width,
          depth: file.dimensions.depth,
          height: file.dimensions.height,
        }
      });
    } else {
      set({ selectedUpperId: id });
    }
  },
  
  setSelectedLowerId: (id) => {
    const file = get().lowerFiles.find(f => f.id === id);
    if (file && get().viewMode === 'lower') {
      set({ 
        selectedLowerId: id,
        modelStats: {
          vertices: file.verticesCount,
          triangles: file.trianglesCount,
          width: file.dimensions.width,
          depth: file.dimensions.depth,
          height: file.dimensions.height,
        }
      });
    } else {
      set({ selectedLowerId: id });
    }
  },
  
  setSearchUpper: (query) => set({ searchUpper: query }),
  setSearchLower: (query) => set({ searchLower: query }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setCurrentStep: (step) => {
    const clamped = Math.max(1, Math.min(step, get().totalSteps));
    // Auto sync selection to match step if available
    const upperMatch = get().upperFiles.find(f => f.stage === clamped);
    const lowerMatch = get().lowerFiles.find(f => f.stage === clamped);
    
    set({ 
      currentStep: clamped,
      selectedUpperId: upperMatch ? upperMatch.id : get().selectedUpperId,
      selectedLowerId: lowerMatch ? lowerMatch.id : get().selectedLowerId,
    });
  },
  
  nextStep: () => {
    const { currentStep, totalSteps, isLooping } = get();
    if (currentStep < totalSteps) {
      get().setCurrentStep(currentStep + 1);
    } else if (isLooping) {
      get().setCurrentStep(1);
    } else {
      set({ isPlaying: false });
    }
  },
  
  prevStep: () => {
    const { currentStep, totalSteps, isLooping } = get();
    if (currentStep > 1) {
      get().setCurrentStep(currentStep - 1);
    } else if (isLooping) {
      get().setCurrentStep(totalSteps);
    }
  },
  
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  
  snapCameraTo: (view) => set((state) => ({
    cameraTargetView: view,
    cameraTriggerCount: state.cameraTriggerCount + 1,
  })),
  
  triggerResetView: () => set((state) => ({
    resetViewTriggerCount: state.resetViewTriggerCount + 1,
    cameraTargetView: 'reset',
  })),
  
  triggerScreenshot: () => set((state) => ({
    screenshotTriggerCount: state.screenshotTriggerCount + 1,
  })),
  
  setSectionPlaneOffset: (offset) => set({ sectionPlaneOffset: offset }),
  setSectionAxis: (axis) => set({ sectionAxis: axis }),
  
  addMeasurementPoint: (pt) => {
    const { pendingMeasurementPoint, measurements } = get();
    if (!pendingMeasurementPoint) {
      set({ pendingMeasurementPoint: pt });
    } else {
      const dx = pt.x - pendingMeasurementPoint.x;
      const dy = pt.y - pendingMeasurementPoint.y;
      const dz = pt.z - pendingMeasurementPoint.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const newMeasurement: Measurement = {
        p1: pendingMeasurementPoint,
        p2: pt,
        distanceMm: parseFloat(dist.toFixed(2)),
      };
      set({
        measurements: [...measurements, newMeasurement],
        pendingMeasurementPoint: null,
      });
    }
  },
  
  clearMeasurements: () => set({ measurements: [], pendingMeasurementPoint: null }),
  
  openUploadModal: (arch = 'auto') => set({ isUploadModalOpen: true, uploadArchTarget: arch }),
  closeUploadModal: () => set({ isUploadModalOpen: false }),
  
  addCustomSTL: (arch, file) => {
    if (arch === 'upper') {
      const next = sortSTLFilesByStage([file, ...get().upperFiles]);
      set({
        upperFiles: next,
        selectedUpperId: file.id,
      });
    } else {
      const next = sortSTLFilesByStage([file, ...get().lowerFiles]);
      set({
        lowerFiles: next,
        selectedLowerId: file.id,
      });
    }
  },

  addBatchSTLs: ({ patientName, upperFiles = [], lowerFiles = [], replaceExisting = true }) => {
    const currentUpper = replaceExisting ? [] : get().upperFiles;
    const currentLower = replaceExisting ? [] : get().lowerFiles;

    const mergedUpper = sortSTLFilesByStage([...currentUpper, ...upperFiles]);
    const mergedLower = sortSTLFilesByStage([...currentLower, ...lowerFiles]);

    // Calculate maximum treatment stage
    const maxUpperStage = mergedUpper.reduce((max, f) => Math.max(max, f.stage || 0), 0);
    const maxLowerStage = mergedLower.reduce((max, f) => Math.max(max, f.stage || 0), 0);
    const calculatedTotalSteps = Math.max(maxUpperStage, maxLowerStage, mergedUpper.length, mergedLower.length, 1);

    const firstUpper = mergedUpper[0];
    const firstLower = mergedLower[0];

    const activeStatsFile = get().viewMode === 'lower' ? (firstLower || firstUpper) : (firstUpper || firstLower);

    set((state) => ({
      upperFiles: mergedUpper,
      lowerFiles: mergedLower,
      selectedUpperId: firstUpper ? firstUpper.id : '',
      selectedLowerId: firstLower ? firstLower.id : '',
      totalSteps: calculatedTotalSteps,
      currentStep: 1,
      patientName: patientName || state.patientName,
      ...(activeStatsFile ? {
        modelStats: {
          vertices: activeStatsFile.verticesCount,
          triangles: activeStatsFile.trianglesCount,
          width: activeStatsFile.dimensions.width,
          depth: activeStatsFile.dimensions.depth,
          height: activeStatsFile.dimensions.height,
        }
      } : {})
    }));
  },
  
  deleteSTL: (arch, id) => {
    if (arch === 'upper') {
      const next = get().upperFiles.filter(f => f.id !== id);
      const nextSelectedId = next.length > 0 ? next[0].id : '';
      const activeFile = next.find(f => f.id === nextSelectedId);
      set({ 
        upperFiles: next,
        selectedUpperId: nextSelectedId,
        ...(next.length === 0 && get().viewMode === 'upper' ? {
          modelStats: { vertices: 0, triangles: 0, width: 0, depth: 0, height: 0 }
        } : activeFile ? {
          modelStats: {
            vertices: activeFile.verticesCount,
            triangles: activeFile.trianglesCount,
            width: activeFile.dimensions.width,
            depth: activeFile.dimensions.depth,
            height: activeFile.dimensions.height,
          }
        } : {})
      });
    } else {
      const next = get().lowerFiles.filter(f => f.id !== id);
      const nextSelectedId = next.length > 0 ? next[0].id : '';
      const activeFile = next.find(f => f.id === nextSelectedId);
      set({ 
        lowerFiles: next,
        selectedLowerId: nextSelectedId,
        ...(next.length === 0 && get().viewMode === 'lower' ? {
          modelStats: { vertices: 0, triangles: 0, width: 0, depth: 0, height: 0 }
        } : activeFile ? {
          modelStats: {
            vertices: activeFile.verticesCount,
            triangles: activeFile.trianglesCount,
            width: activeFile.dimensions.width,
            depth: activeFile.dimensions.depth,
            height: activeFile.dimensions.height,
          }
        } : {})
      });
    }
  },

  deleteAllSTLs: (arch) => {
    if (arch === 'upper') {
      set({
        upperFiles: [],
        selectedUpperId: '',
        ...(get().viewMode === 'upper' ? {
          modelStats: { vertices: 0, triangles: 0, width: 0, depth: 0, height: 0 }
        } : {})
      });
    } else {
      set({
        lowerFiles: [],
        selectedLowerId: '',
        ...(get().viewMode === 'lower' ? {
          modelStats: { vertices: 0, triangles: 0, width: 0, depth: 0, height: 0 }
        } : {})
      });
    }
  },

  resetDefaultSTLs: (arch) => {
    if (!arch || arch === 'upper') {
      const first = INITIAL_UPPER_FILES[0];
      set((state) => ({
        upperFiles: INITIAL_UPPER_FILES,
        selectedUpperId: first ? first.id : '',
        ...(state.viewMode === 'upper' && first ? {
          modelStats: {
            vertices: first.verticesCount,
            triangles: first.trianglesCount,
            width: first.dimensions.width,
            depth: first.dimensions.depth,
            height: first.dimensions.height,
          }
        } : {})
      }));
    }
    if (!arch || arch === 'lower') {
      const first = INITIAL_LOWER_FILES[0];
      set((state) => ({
        lowerFiles: INITIAL_LOWER_FILES,
        selectedLowerId: first ? first.id : '',
        ...(state.viewMode === 'lower' && first ? {
          modelStats: {
            vertices: first.verticesCount,
            triangles: first.trianglesCount,
            width: first.dimensions.width,
            depth: first.dimensions.depth,
            height: first.dimensions.height,
          }
        } : {})
      }));
    }
  },
}));
