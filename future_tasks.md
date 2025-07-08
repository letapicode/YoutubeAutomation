# Future Tasks

The following features build on the current capabilities without overlapping each other. Each task can be developed in parallel because it touches largely separate modules of the application.

## 1. AI Voiceover Generation
- Integrate an optional text-to-speech pipeline using an open source library (e.g. Coqui TTS).
- Add CLI flag and GUI toggle for generating narration from a provided script or translated captions.
- Allow selection of different voices in the Settings page.
- The generated audio should pass through the existing captioning and upload pipeline.

## 2. Automated Metadata from Transcripts
- After transcription, extract keywords and summary lines using a lightweight NLP library.
- Provide suggested titles, descriptions and tags in the GUI metadata form and CLI output.
- Use the suggestions to pre-fill fields so users can quickly review and edit them.
- Implement chapter marker generation based on the transcript timestamps.

## 3. Generative Backgrounds and Thumbnails
- Support creating background images or short clips from text prompts via Stable Diffusion.
- Allow generating a thumbnail preview using the same model.
- Expose these options both in the CLI and the Background/Thumbnail pickers.
- Generated assets are stored alongside the rendered video for later reuse.

## 4. Social Media Cross‑Posting
- After a successful YouTube upload, post an announcement to other platforms such as Twitter, Instagram or TikTok.
- Provide a settings panel to configure API tokens and enable/disable each service.
- Start with simple text or image posts linking to the new video, leaving room for short‑form uploads later.

## 5. Distributed Processing Mode
- Create a small server component that accepts queued jobs from the desktop app.
- Use the existing Rust/FFmpeg pipeline on the remote worker and report progress back to the UI.
- Add an option to offload heavy jobs to the remote worker while continuing to work locally.

## 6. Trending Keyword Suggestions
- Periodically fetch trending keywords relevant to the user’s selected language or topic.
- Offer these as additional tag suggestions in both the CLI and GUI.
- Keep the implementation modular so it can be expanded with different data sources.

## 7. YouTube Analytics Dashboard
- Display basic performance metrics (views, likes, comments) for uploaded videos within the app.
- Authenticate with the YouTube Analytics API using existing OAuth tokens.
- Provide a simple table or graph view accessible from a new Analytics page.

## 8. Cloud-Synced Settings and Profiles
- Sync `settings.json` and saved profiles to an optional cloud backend such as a GitHub gist or S3 bucket.
- Expose sync controls in the Settings page and add `profile-sync` commands to the CLI.
- Merge conflicts are resolved by timestamp so edits on different machines do not clobber each other.
- Implement the sync logic in a standalone module to avoid touching existing profile code.

## 9. Interactive Timeline Editor
- Create a `TimelineEditor` React component that displays caption blocks, intros and outros on a draggable timeline.
- Allow users to adjust caption timing, insert chapter markers and preview segments in real time.
- Store chapter data with the generated video so YouTube chapters are added automatically.
- This feature lives in a new `components/TimelineEditor.tsx` file and does not alter other pages.

## 10. Multi-Platform Export
- Add presets for vertical formats targeting TikTok and Instagram Reels.
- Provide CLI flags and GUI options to render these versions alongside the standard YouTube output.
- Optionally upload directly to those platforms using their APIs once the export completes.
- Implementation touches a new `features/export.ts` module and platform-specific scripts.

## 11. Automated Voiceover Translation
- Translate existing subtitles into additional languages and synthesize localized narration using the TTS engine.
- Present a list of target languages in both the CLI and GUI.
- Output separate audio tracks or alternate rendered videos without interfering with the original.
- All translation and synthesis logic stays in a dedicated `features/voiceover.ts` module.

## 12. B-roll Clip Suggestions
- Fetch royalty-free clips from the Pexels API or generate short loops with a local diffusion model.
- Suggest these clips based on keywords in the transcript and let users insert them automatically.
- The fetching logic resides in `features/broll.ts` while preview and selection occur in a new modal component.

## 13. High-Contrast Theme Option
- Extend the existing theme toggles with a high-contrast choice for better accessibility.
- Store the selected theme in settings so the entire UI applies it consistently.
- Styles are isolated to `theme.css` and a small toggle component.

Each task modifies distinct files or modules, allowing multiple contributors to work without merge conflicts.
