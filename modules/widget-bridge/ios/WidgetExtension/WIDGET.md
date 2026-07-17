# iOS WidgetKit (moved)

The Lock Screen / home widget now lives under the Expo Apple Targets folder:

`targets/DayinkWidget/`

That target is linked by `@bacons/apple-targets` during:

```bash
npx expo prebuild -p ios
```

Open Xcode (`xed ios`) and look for `expo:targets/DayinkWidget`.

Word catalogs are copied into `targets/DayinkWidget/assets/`. After regenerating content:

```bash
npm run content:sync-ios-widget
```
