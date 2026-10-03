"""
Seed items for Food & Drink category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_food.py
"""

import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

LANGS = [
    "es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl", "zh",
    "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am", "tl", "ms", "mi",
]


def L(**kw) -> dict:
    missing = [lang for lang in LANGS if lang not in kw]
    if missing:
        raise ValueError(f"missing languages: {missing}")
    unknown = [key for key in kw if key not in LANGS]
    if unknown:
        raise ValueError(f"unknown languages: {unknown}")
    return kw


# (slug, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi)
ITEMS = [
    ("gastronomia", "Gastronomía", "Gastronomy", "Gastronomia", "Gastronomie", "Gastronomie", "Gastronomia", "Гастрономия", "Gastronomi", "Gastronomie", "美食", "गैस्ट्रोनॉमी", "গ্যাস্ট্রোনমি", "グルメ", "미식", "فن الطهي", "Upishi bora", "Girke-girke", "ጋስትሮኖሚ", "Gastronomy", "Gastronomi", "Kai reka"),
    ("dulces", "Dulces", "Sweets", "Doces", "Douceurs", "Süßigkeiten", "Dolci", "Сладости", "Sötsaker", "Snoepgoed", "甜食", "मिठाइयाँ", "মিষ্টি", "スイーツ", "디저트", "حلويات", "Vitamu", "Zaƙi", "ጣፋጭ ምግቦች", "Matatamis", "Manisan", "Ngā mea reka"),
    ("cafe", "Café", "Coffee", "Café", "Café", "Kaffee", "Caffè", "Кофе", "Kaffe", "Koffie", "咖啡", "कॉफ़ी", "কফি", "コーヒー", "커피", "قهوة", "Kahawa", "Kofi", "ቡና", "Kape", "Kopi", "Kawhe"),
    ("vino", "Vino", "Wine", "Vinho", "Vin", "Wein", "Vino", "Вино", "Vin", "Wijn", "葡萄酒", "वाइन", "ওয়াইন", "ワイン", "와인", "نبيذ", "Mvinyo", "Giya", "ወይን", "Alak", "Wain", "Wāina"),
    ("te", "Té", "Tea", "Chá", "Thé", "Tee", "Tè", "Чай", "Te", "Thee", "茶", "चाय", "চা", "お茶", "차", "شاي", "Chai", "Shayi", "ሻይ", "Tsaa", "Teh", "Tī"),
    ("cerveza_artesanal", "Cerveza Artesanal", "Craft Beer", "Cerveja Artesanal", "Bière artisanale", "Craft-Bier", "Birra artigianale", "Крафтовое пиво", "Hantverksöl", "Ambachtelijk bier", "精酿啤酒", "क्राफ्ट बीयर", "ক্রাফট বিয়ার", "クラフトビール", "수제 맥주", "بيرة حرفية", "Bia ya kienyeji", "Giyar gida", "ዕደ-ጥበብ ቢራ", "Craft beer", "Bir kraf", "Pia wahine"),
    ("cocteleria", "Coctelería", "Cocktails", "Coquetelaria", "Cocktails", "Cocktails", "Cocktail", "Коктейли", "Cocktails", "Cocktails", "鸡尾酒", "कॉकटेल", "ককটেল", "カクテル", "칵테일", "كوكتيلات", "Vinywaji mchanganyiko", "Abin sha mai gauraye", "ኮክቴሎች", "Cocktail", "Koktel", "Inu waipiro"),
    ("whisky", "Whisky", "Whiskey", "Whisky", "Whisky", "Whisky", "Whisky", "Виски", "Whisky", "Whisky", "威士忌", "व्हिस्की", "হুইস্কি", "ウイスキー", "위스키", "ويسكي", "Whisky", "Whisky", "ዊስኪ", "Whisky", "Wiski", "Whisky"),
    ("tequila", "Tequila", "Tequila", "Tequila", "Tequila", "Tequila", "Tequila", "Текила", "Tequila", "Tequila", "龙舌兰", "टकीला", "টেকিলা", "テキーラ", "데킬라", "تيكيلا", "Tequila", "Tequila", "ቴኪላ", "Tequila", "Tequila", "Tequila"),
    ("mezcal", "Mezcal", "Mezcal", "Mezcal", "Mezcal", "Mezcal", "Mezcal", "Мескаль", "Mezcal", "Mezcal", "梅斯卡尔", "मेज़काल", "মেজকাল", "メスカル", "메스칼", "ميسكال", "Mezcal", "Mezcal", "ሜዝካል", "Mezcal", "Mezcal", "Mezcal"),
    ("sake", "Sake", "Sake", "Saquê", "Saké", "Sake", "Sakè", "Саке", "Sake", "Sake", "清酒", "साके", "সাকে", "日本酒", "사케", "ساكي", "Sake", "Sake", "ሳኬ", "Sake", "Sake", "Sake"),
    ("cocina_gourmet", "Cocina Gourmet", "Gourmet Cooking", "Culinária Gourmet", "Cuisine gastronomique", "Gourmetküche", "Cucina gourmet", "Высокая кухня", "Gourmetmat", "Gastronomisch koken", "美食烹饪", "गॉरमेट खाना", "গুরমে রান্না", "グルメ料理", "고메 요리", "طهي فاخر", "Upishi wa kifahari", "Girkin alfarma", "ጎርሜት ምግብ", "Gourmet na pagluluto", "Masakan gourmet", "Tunu kai rangatira"),
    ("reposteria", "Repostería", "Pastry", "Confeitaria", "Pâtisserie", "Konditorei", "Pasticceria", "Кондитерское дело", "Bageri", "Banketbakkerij", "糕点", "पेस्ट्री", "পেস্ট্রি", "製菓", "제과", "حلويات", "Uokaji keki", "Yin burodi mai zaƙi", "ጣፋጭ ዳቦ", "Panaderya", "Pastri", "Tunu keke"),
    ("panaderia", "Panadería", "Bakery", "Padaria", "Boulangerie", "Bäckerei", "Panetteria", "Пекарня", "Bageri", "Bakkerij", "面包房", "बेकरी", "বেকারি", "パン屋", "빵집", "مخبز", "Okaji mikate", "Gidan burodi", "ዳቦ ቤት", "Panaderya", "Kedai roti", "Whare taro"),
    ("chocolateria", "Chocolatería", "Chocolate", "Chocolataria", "Chocolaterie", "Schokolade", "Cioccolateria", "Шоколад", "Choklad", "Chocolade", "巧克力", "चॉकलेट", "চকলেট", "チョコレート", "초콜릿", "شوكولاتة", "Chokoleti", "Cakulan", "ቸኮሌት", "Tsokolate", "Coklat", "Tiakarete"),
    ("cocina_italiana", "Cocina Italiana", "Italian Food", "Culinária Italiana", "Cuisine italienne", "Italienische Küche", "Cucina italiana", "Итальянская кухня", "Italiensk mat", "Italiaanse keuken", "意大利菜", "इतालवी खाना", "ইতালীয় খাবার", "イタリア料理", "이탈리아 요리", "المطبخ الإيطالي", "Chakula cha Kiitaliano", "Abincin Italiya", "የጣሊያን ምግብ", "Pagkaing Italyano", "Masakan Itali", "Kai Itari"),
    ("cocina_japonesa", "Cocina Japonesa", "Japanese Food", "Culinária Japonesa", "Cuisine japonaise", "Japanische Küche", "Cucina giapponese", "Японская кухня", "Japansk mat", "Japanse keuken", "日本料理", "जापानी खाना", "জাপানি খাবার", "日本料理", "일본 요리", "المطبخ الياباني", "Chakula cha Kijapani", "Abincin Japan", "የጃፓን ምግብ", "Pagkaing Hapones", "Masakan Jepun", "Kai Hapanihi"),
    ("cocina_mexicana", "Cocina Mexicana", "Mexican Food", "Culinária Mexicana", "Cuisine mexicaine", "Mexikanische Küche", "Cucina messicana", "Мексиканская кухня", "Mexikansk mat", "Mexicaanse keuken", "墨西哥菜", "मैक्सिकन खाना", "মেক্সিকান খাবার", "メキシコ料理", "멕시코 요리", "المطبخ المكسيكي", "Chakula cha Kimeksiko", "Abincin Mexico", "የሜክሲኮ ምግብ", "Pagkaing Mehikano", "Masakan Mexico", "Kai Mehiko"),
    ("cocina_francesa", "Cocina Francesa", "French Food", "Culinária Francesa", "Cuisine française", "Französische Küche", "Cucina francese", "Французская кухня", "Fransk mat", "Franse keuken", "法国菜", "फ्रेंच खाना", "ফরাসি খাবার", "フランス料理", "프랑스 요리", "المطبخ الفرنسي", "Chakula cha Kifaransa", "Abincin Faransa", "የፈረንሳይ ምግብ", "Pagkaing Pranses", "Masakan Perancis", "Kai Wīwī"),
    ("cocina_thai", "Cocina Thai", "Thai Food", "Culinária Tailandesa", "Cuisine thaï", "Thailändische Küche", "Cucina thailandese", "Тайская кухня", "Thailändsk mat", "Thaise keuken", "泰国菜", "थाई खाना", "থাই খাবার", "タイ料理", "태국 요리", "المطبخ التايلندي", "Chakula cha Thai", "Abincin Thailand", "የታይ ምግብ", "Pagkaing Thai", "Masakan Thai", "Kai Tai"),
    ("cocina_india", "Cocina India", "Indian Food", "Culinária Indiana", "Cuisine indienne", "Indische Küche", "Cucina indiana", "Индийская кухня", "Indisk mat", "Indiase keuken", "印度菜", "भारतीय खाना", "ভারতীয় খাবার", "インド料理", "인도 요리", "المطبخ الهندي", "Chakula cha Kihindi", "Abincin Indiya", "የህንድ ምግብ", "Pagkaing Indian", "Masakan India", "Kai Iniana"),
    ("cocina_china", "Cocina China", "Chinese Food", "Culinária Chinesa", "Cuisine chinoise", "Chinesische Küche", "Cucina cinese", "Китайская кухня", "Kinesisk mat", "Chinese keuken", "中国菜", "चीनी खाना", "চীনা খাবার", "中華料理", "중국 요리", "المطبخ الصيني", "Chakula cha Kichina", "Abincin China", "የቻይና ምግብ", "Pagkaing Tsino", "Masakan Cina", "Kai Hainamana"),
    ("sushi", "Sushi", "Sushi", "Sushi", "Sushi", "Sushi", "Sushi", "Суши", "Sushi", "Sushi", "寿司", "सुशी", "সুশি", "寿司", "스시", "سوشي", "Sushi", "Sushi", "ሱሺ", "Sushi", "Sushi", "Sushi"),
    ("ramen", "Ramen", "Ramen", "Ramen", "Ramen", "Ramen", "Ramen", "Рамэн", "Ramen", "Ramen", "拉面", "रामेन", "রামেন", "ラーメン", "라멘", "رامن", "Ramen", "Ramen", "ራመን", "Ramen", "Ramen", "Ramen"),
    ("pizza", "Pizza", "Pizza", "Pizza", "Pizza", "Pizza", "Pizza", "Пицца", "Pizza", "Pizza", "披萨", "पिज़्ज़ा", "পিজা", "ピザ", "피자", "بيتزا", "Pizza", "Pizza", "ፒዛ", "Pizza", "Piza", "Pizza"),
    ("hamburguesas", "Hamburguesas", "Burgers", "Hambúrgueres", "Burgers", "Burger", "Hamburger", "Бургеры", "Hamburgare", "Hamburgers", "汉堡", "बर्गर", "বার্গার", "ハンバーガー", "햄버거", "برجر", "Baga", "Burger", "በርገር", "Burger", "Burger", "Peka paraoa"),
    ("tacos", "Tacos", "Tacos", "Tacos", "Tacos", "Tacos", "Tacos", "Такос", "Tacos", "Taco's", "塔可", "टैको", "ট্যাকো", "タコス", "타코", "تاكو", "Taco", "Taco", "ታኮ", "Taco", "Taco", "Taco"),
    ("bbq", "BBQ", "BBQ", "Churrasco", "BBQ", "BBQ", "BBQ", "Барбекю", "BBQ", "BBQ", "烧烤", "बारबेक्यू", "বারবিকিউ", "バーベキュー", "바비큐", "شواء", "Nyama choma", "Gashi", "ባርቤኪው", "BBQ", "BBQ", "Whakawai mīti"),
    ("asados", "Asados", "Grills", "Assados", "Grillades", "Grillen", "Grigliate", "Гриль", "Grillat", "Barbecue", "烤肉", "भुना हुआ", "ঝলসানো", "焼肉", "구이", "مشويات", "Kuchoma", "Gasa", "ጥብስ", "Inihaw", "Panggang", "Tunu"),
    ("comida_vegana", "Comida Vegana", "Vegan Food", "Comida Vegana", "Cuisine végane", "Veganes Essen", "Cibo vegano", "Веганская еда", "Vegansk mat", "Veganistisch eten", "纯素食品", "वीगन खाना", "ভিগান খাবার", "ヴィーガン料理", "비건 음식", "طعام نباتي صرف", "Chakula cha vegan", "Abincin vegan", "ቪጋን ምግብ", "Vegan na pagkain", "Makanan vegan", "Kai huawhenua kau"),
    ("comida_vegetariana", "Comida Vegetariana", "Vegetarian Food", "Comida Vegetariana", "Cuisine végétarienne", "Vegetarisches Essen", "Cibo vegetariano", "Вегетарианская еда", "Vegetarisk mat", "Vegetarisch eten", "素食", "शाकाहारी खाना", "নিরামিষ খাবার", "ベジタリアン料理", "채식 음식", "طعام نباتي", "Chakula cha mbogamboga", "Abincin ganye", "የአትክልት ምግብ", "Gulay na pagkain", "Makanan vegetarian", "Kai huawhenua"),
    ("comida_organica", "Comida Orgánica", "Organic Food", "Comida Orgânica", "Cuisine bio", "Bio-Essen", "Cibo biologico", "Органическая еда", "Ekologisk mat", "Biologisch eten", "有机食品", "जैविक खाना", "জৈব খাবার", "オーガニック食品", "유기농 음식", "طعام عضوي", "Chakula hai", "Abinci na halitta", "ኦርጋኒክ ምግብ", "Organik na pagkain", "Makanan organik", "Kai māori"),
    ("street_food", "Street Food", "Street Food", "Comida de Rua", "Street-food", "Streetfood", "Cibo di strada", "Уличная еда", "Gatumat", "Straatvoedsel", "街头小吃", "स्ट्रीट फूड", "স্ট্রিট ফুড", "屋台グルメ", "길거리 음식", "طعام الشارع", "Chakula cha mtaani", "Abincin titi", "የመንገድ ምግብ", "Street food", "Makanan jalanan", "Kai tiriti"),
    ("food_trucks", "Food Trucks", "Food Trucks", "Food Trucks", "Food trucks", "Foodtrucks", "Food truck", "Фудтраки", "Food trucks", "Foodtrucks", "餐车", "फूड ट्रक", "ফুড ট্রাক", "フードトラック", "푸드트럭", "شاحنات الطعام", "Magari ya chakula", "Motocin abinci", "የምግብ መኪኖች", "Food truck", "Trak makanan", "Waka kai"),
    ("degustacion_vinos", "Degustación Vinos", "Wine Tasting", "Degustação de Vinhos", "Dégustation de vins", "Weinverkostung", "Degustazione vini", "Дегустация вин", "Vinprovning", "Wijnproeverij", "品酒", "वाइन टेस्टिंग", "ওয়াইন টেস্টিং", "ワインテイスティング", "와인 시음", "تذوق النبيذ", "Kuonja mvinyo", "Ɗanɗanon giya", "የወይን ጣዕም", "Pagtikim ng alak", "Rasa wain", "Whakamatau wāina"),
    ("cata_cerveza", "Cata Cerveza", "Beer Tasting", "Degustação de Cerveja", "Dégustation de bière", "Bierverkostung", "Degustazione birra", "Дегустация пива", "Ölprovning", "Bierproeverij", "啤酒品鉴", "बीयर टेस्टिंग", "বিয়ার টেস্টিং", "ビールテイスティング", "맥주 시음", "تذوق البيرة", "Kuonja bia", "Ɗanɗanon giya", "የቢራ ጣዕም", "Pagtikim ng serbesa", "Rasa bir", "Whakamatau pia"),
    ("barista", "Barista", "Barista", "Barista", "Barista", "Barista", "Barista", "Бариста", "Barista", "Barista", "咖啡师", "बरिस्ता", "বরিস্তা", "バリスタ", "바리스타", "باريستا", "Barista", "Barista", "ባሪስታ", "Barista", "Barista", "Kaihanga kawhe"),
    ("sommelier", "Sommelier", "Sommelier", "Sommelier", "Sommelier", "Sommelier", "Sommelier", "Сомелье", "Sommelier", "Sommelier", "品酒师", "सोमेलियर", "সমেলিয়ার", "ソムリエ", "소믈리에", "ساقي", "Sommelier", "Sommelier", "ሶመ-lier", "Sommelier", "Sommelier", "Kaitohu wāina"),
    ("chef_casero", "Chef Casero", "Home Chef", "Chef Caseiro", "Chef à domicile", "Hobbykoch", "Chef casalingo", "Домашний повар", "Hemmakock", "Thuiskok", "家庭厨师", "घरेलू शेफ", "বাড়ির শেফ", "おうちシェフ", "홈셰프", "طاهٍ منزلي", "Mpishi wa nyumbani", "Mai girki na gida", "የቤት ሼፍ", "Home chef", "Chef rumah", "Tunu kai kāinga"),
    ("meal_prep", "Meal Prep", "Meal Prep", "Marmitas", "Batch cooking", "Meal Prep", "Meal prep", "Заготовка еды", "Matlådor", "Mealpreppen", "备餐", "मील प्रेप", "মিল প্রেপ", "作り置き", "밀프렙", "تحضير الوجبات", "Kuandaa milo", "Shirya abinci", "ምግብ ዝግጅት", "Meal prep", "Penyediaan makanan", "Takatu kai"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 300
    for row in ITEMS:
        slug = row[0]
        vals = dict(zip(LANGS, row[1:]))
        value = f"items.{slug}"
        existing = await SystemOption.find_one(
            SystemOption.category == "profile_interests_section",
            SystemOption.value == value,
        )
        doc_data = {
            "category": "profile_interests_section",
            "value": value,
            "label": vals["es"],
            "order": order,
            "is_active": True,
        }
        for lang in LANGS:
            doc_data[f"label_{lang}"] = vals.get(lang, "")
        if existing:
            for key, val in doc_data.items():
                setattr(existing, key, val)
            await existing.save()
            updated += 1
        else:
            await SystemOption(**doc_data).insert()
            created += 1
        order += 1
    print(f"seed food items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
