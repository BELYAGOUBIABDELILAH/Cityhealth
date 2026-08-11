# CityHealth Screenshots

This directory contains all visual documentation for the CityHealth ecosystem.

## Directory Structure

```
screenshots/
├── logo.png                    # CityHealth logo
├── apk/                        # Mobile App screenshots
│   ├── chat-bot.png
│   ├── emergency-map.png
│   ├── home-screen.png
│   ├── login.png
│   ├── map-view.png
│   ├── menu-drawer.png
│   ├── search-results.png
│   └── settings.png
├── extension/                  # Browser Extension screenshots
│   ├── extension-popup.png
│   └── extension-settings.png
└── website/                    # Web Portal screenshots
    ├── blood-donation.png
    ├── client-public-card.png
    ├── dev-api.png
    ├── footer.png
    ├── healthcare-providers.png
    ├── homepage.png
    ├── join-cityhealth.png
    ├── map-search.png
    ├── our-services.png
    ├── our-team.png
    ├── provider-dashboard.png
    ├── providers-register.png
    ├── public-provider-profile.png
    ├── roadmap.png
    └── search-results.png
```

## Usage in README files

All screenshots are referenced using relative paths from their respective README locations:

**From root README:**
```markdown
![Homepage](docs/screenshots/website/homepage.png)
```

**From feature-specific READMEs (extension/, web-portal/, etc.):**
```markdown
![Extension Popup](../docs/screenshots/extension/extension-popup.png)
```

## Screenshot Guidelines

When adding new screenshots:

1. Use descriptive kebab-case filenames
2. Place in the appropriate subdirectory
3. Optimize images for web (compress PNG files)
4. Maintain consistent aspect ratios within each category
5. Update this README with new entries
