// The food words the checks share (one list each): protein foods by name, the categories where protein is a surprise,
// seasonings and salty foods by name, the categories salty by nature. Read by the catalog's checks (plausible.ts: the
// data build's and the CI guard's), the amount's hint (portionCheck.ts) and マイ食品's salt prompt (drafts.ts).

/** Protein foods by name, whatever their category (whey filed under 菓子, fish senbei, jerky): protein over a third
 *  of the energy is genuine in them. */
export const PROTEIN_FOOD = /プロテイン|protein|ホエイ|whey|wp[ci]|\biso|カゼイン|casein|ザバス|savas|ビーレジェンド|be ?legend|アルプロン|alpron|huel|shake|replacement|ちりめん|めんたい|明太|もめん|豆乳|茶豆|枝豆|だんご|団子|骨|いわし|イワシ|あじ|\u9bf5|きす|キス|ししゃも|あなご|穴子|すじ|カニカマ|パンガシウス|fish|tuna|salmon|squid|chicken|beef|pork|ham\b|jerky|seitan|cottage|\u0442\u0432\u043e\u0440\u043e\u0433|skyr|tofu|ソイ|大豆|soy|たんぱく|タンパク|蛋白|ささみ|サラダチキン|チキン|鶏|肉|ハム|ジャーキー|魚|鮭|さけ|サーモン|まぐろ|ツナ|かつお|\u9c39|いか|イカ|たこ|えび|海老|ほたて|帆立|貝|かに|蟹|ちくわ|かまぼこ|蒲\u927e|はんぺん|しらす|じゃこ|煮干|あたりめ|するめ|さきいか|干|チーズ|ヨーグルト|豆腐|とうふ|納豆|おから|ゆば|湯葉|高野|卵|たまご|エッグ|egg|bcaa|eaa|アミノ|コラーゲン|ゼラチン|酵母|きな粉|きなこ|ピーナッツ|落花生|ナッツ/i;

/** Sweets, drinks, bread and staples: where much protein is a surprise (a cone's label read wrong). */
export const LOW_PROTEIN_CATS: ReadonlySet<string> = new Set(['菓子・デザート', '飲料', 'パン', '主食', '麺']);

/** Seasonings and soup bases by name (a マイ食品 named so is asked its salt). */
export const SEASONING = /の素|のもと|スープ|たれ|タレ|だし|ダシ|出汁|ソース|つゆ|ドレッシング|醤油|しょうゆ|しょう油|味噌|みそ|ルウ|カレールー|シチュールー|ブイヨン|コンソメ|ポン酢|ぽん酢|ふりかけ|調味料/;

/** Seasonings, soup bases and salty foods by name, whose salt can equal a macro by chance (a dashi powder's 40 g). */
export const SALTY = /たれ|タレ|だれ|ダレ|だし|ダシ|出汁|スープ|soup|pho|素|もと|ルー|ルウ|みそ|味噌|粉末|パウダー|\u9846粒|シーズニング|seasoning|ソース|sauce|醤|しょうゆ|ナンプラー|ふりかけ|furikake|コンソメ|ブイヨン|つゆ|調味|ペースト|明太|たらこ|塩辛|酒盗|梅|生ハム|ジャーキー/i;

/** Salty by nature at a whole pack (soups and their noodles, sauces). */
export const SALTY_CATS: ReadonlySet<string> = new Set(['調味料', '汁物', '麺']);
