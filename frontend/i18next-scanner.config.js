module.exports = {
  input: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
  ],
  output: "./public/locales/$LANG/$NAMESPACE.json",
  options: {
    debug: false,
    func: {
      list: ["t", "useTranslation"],
      extensions: [".ts", ".tsx"],
    },
    trans: {
      component: "Trans",
      i18nKey: "i18nKey",
      defaultsKey: "defaults",
      extensions: [".ts", ".tsx"],
      fallbackKey: true,
      acorn: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    lngs: [
      "en",
      "es",
      "pt",
      "fr",
      "de",
      "it",
      "ru",
      "sv",
      "nl",
      "zh",
      "hi",
      "bn",
      "ja",
      "ko",
      "ar",
      "sw",
      "ha",
      "am",
      "tl",
      "ms",
      "mi",
    ],
    ns: [
      "common",
      "landing",
      "discover",
      "profile",
      "auth",
      "dashboard",
      "errors",
      "nav",
      "footer",
      "card",
      "battery",
      "theme",
      "settings",
      "communityRules",
      "actions",
      "zodiac",
      "pronouns",
      "control",
      "location",
      "relType",
      "profileSections",
      "music",
      "zodiac",
      "identityDoc",
      "docManager",
      "professional",
      "wellness",
      "cognitive",
      "lifestyle",
      "values",
      "social",
      "extras",
      "intentions_map",
      "essentials",
      "media",
      "photoTips",
      "mediaGallery",
    ],
    defaultLng: "en",
    defaultNs: "common",
    defaultValue: "",
    resource: {
      loadPath: "public/locales/{{lng}}/{{ns}}.json",
      savePath: "public/locales/{{lng}}/{{ns}}.json",
      jsonIndent: 2,
      lineEnding: "\n",
    },
    nsSeparator: ":",
    keySeparator: ".",
    interpolation: {
      prefix: "{{",
      suffix: "}}",
    },
  },
  transform: function customTransform(file, enc, done) {
    "use strict";
    const parser = this.parser;
    const content = file.contents.toString();
    let count = 0;

    // Use the default parser for t() and useTranslation()
    parser.parseFuncFromString(
      content,
      { list: ["t", "useTranslation"] },
      (key, options) => {
        parser.set(key, options);
        count++;
      },
    );

    // Also parse Trans components
    parser.parseTransFromString(
      content,
      {
        component: "Trans",
        i18nKey: "i18nKey",
        defaultsKey: "defaults",
        extensions: [".ts", ".tsx"],
        fallbackKey: true,
      },
      (key, options) => {
        parser.set(key, options);
        count++;
      },
    );

    if (count > 0) {
      console.log(`[i18next-scanner] ${file.relative}: found ${count} keys`);
    }
    done(null, file);
  },
};
