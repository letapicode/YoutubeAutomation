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

Each task modifies distinct files or modules, allowing multiple contributors to work without merge conflicts.

## 8. Text-to-Speech Input
- Provide a starting mode that synthesizes narration from user-entered text.
- Add a dedicated text field in the GUI and a CLI flag for supplying this script.
- Feed the generated audio into the existing captioning and upload pipeline.

## 9. Automated Voiceover Translation
- Translate the transcript into additional languages using the existing translation utilities.
- Generate TTS audio tracks for each selected language and include them as alternate narrations.
- Offer language selection in both the CLI and Settings page.

## 10. Generative B-roll Clips
- Produce short looping clips with a local Stable Diffusion model based on transcript keywords.
- Allow users to enable automatic B-roll generation when no custom footage is provided.
- Insert generated clips on a separate track behind captions and main video.

## 11. Cloud-Synced Settings and Profiles
- Optionally store profile files in a remote location such as a GitHub gist or S3 bucket.
- Authenticate from the Settings panel and sync profiles on startup.
- Keep local and remote copies merged so multiple machines stay in sync.

## 12. Interactive Timeline Editor
- Expand the subtitle editor into a timeline view with draggable intro, outro and chapter markers.
- Allow adjusting caption timing visually with real-time preview.
- Persist timeline edits so they are used during rendering.

## 13. Multi-Platform Export
- Provide export presets for vertical formats used by TikTok and Instagram Reels.
- Reuse generated metadata and optionally upload directly to these services.
- Ensure aspect ratio and length conform to each platform's requirements.

## 14. Persistent Background Job Queue
- Save the job queue state to disk so tasks resume after crashes or restarts.
- Implement a simple queue viewer with options to reorder or cancel jobs.
- Use a JSON file or lightweight database to store pending work.

Each of these new tasks targets a separate module, allowing them to be developed in parallel without merge conflicts.
