import json
import os
from pathlib import Path

locales_dir = Path('public/locales')

translations = {
    'ar': 'تخصيص شريط التنقل',
    'bn': 'ন্যাভিগেশন বার কাস্টমাইজ করুন',
    'de': 'Navigationsleiste anpassen',
    'en': 'Customize Navbar',
    'es': 'Personalizar Barra de Navegación',
    'fa': 'تخصيص شريط التنقل',  # Farsi/Persian - similar to Arabic
    'fr': 'Personnaliser la barre de navigation',
    'hi': 'नेविगेशन बार को अनुकूलित करें',
    'it': 'Personalizza Barra di Navigazione',
    'ja': 'ナビゲーションバーをカスタマイズ',
    'ko': '탐색 모음 사용자 지정',
    'nl': 'Navigatiebalk aanpassen',
    'pt': 'Personalizar Barra de Navegação',
    'ru': 'Настроить панель навигации',
    'sw': 'Badilisha Bar ya Navigeteshaji',
    'sv': 'Anpassa navigeringsfältet',
    'tl': 'Customize Navbar',
    'tr': 'Gezinme Çubuğunu Özelleştir',
    'zh': '自定义导航栏',
    'ha': 'Sawarƙar Navbar',
    'am': 'ንግድ የተሰራ ምንጭ',
    'ms': 'Menyesuaikan Bar Navigasi'
}

errors = []
for lang, translation in translations.items():
    filepath = locales_dir / lang / 'common.json'
    if filepath.exists():
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if 'nav' in data:
                if 'customize-navbar' not in data['nav']:
                    data['nav']['customize-navbar'] = translation
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    print(f"OK: {lang}/common.json")
                else:
                    print(f"SKIP: {lang}/common.json already has customize-navbar")
            else:
                print(f"SKIP: {lang}/common.json has no 'nav' section")
        except Exception as e:
            print(f"ERROR: {lang}/common.json - {e}")
    else:
        print(f"SKIP: {lang}/common.json does not exist")

print("\nDone!")
