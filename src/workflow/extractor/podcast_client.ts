/**
 * Podcast client façade
 *
 * This file serves as a central entry point for podcast functionality,
 * delegating to specialized modules for audio and video generation.
 */

import {
  generatePodcastAudio as generateAudio,
  transcribeAudio as transcribe,
  TranscriptionResponse,
  TranscriptionWord,
} from './podcast_audio';
import { generatePodcastVideo as generateVideo } from './podcast_video';

// Re-export types for external use
export type { TranscriptionResponse, TranscriptionWord };

// Export functions with the same signatures for backward compatibility
export const generatePodcastAudio = generateAudio;
export const generatePodcastVideo = generateVideo;
export const transcribeAudio = transcribe;
