# Application Icon

The default icon is not included in version control. You can recreate it with:

```bash
# from repository root
mkdir -p ytapp/src-tauri/icons
printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAADHUlEQVR4nO3UMQEAIAzAsIF/z0MGRxMFvXp2ZgdIur8DgH8M...' | base64 -d > ytapp/src-tauri/icons/icon.png
```

Alternatively, set `icons/icon.png` in `tauri.conf.json` to point at a custom image.
