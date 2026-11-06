// ききみみ クイズ: levels 1-3's items (docs/kikimimi.md "Question types", "Content"), as authored. Written for Japanese
// adult learners. `pic` tests the sentence, not the noun: the words are ones players know (or katakana traps), and the
// wrong pictures are heard in the sentence too or sound close. `word` gives 3 near-sound choices that all fit the
// sentence, so meaning can't give it away. `num` comes from templates (speaker × phrase × number) with close
// distractors. `reply` is TOEIC Part 2: the traps repeat a word or a sound of the question, answer another wh-question,
// or say yes/no to a wh-question. American English throughout (US voices, spelling, clock talk and idiom: the
// curriculum's 2026-11-06 policy); other accents only as exposure at やま and ほし. Jock villagers say gym lines. Source only (source.ts): the app loads the compiled levels (levels/, pool.ts).
import type { RosterId } from '#lib/villagers/roster.ts';
import { PIC_JA, type Item, type ItemType, type Level } from './bank.ts';

type Row = readonly [id: string, speaker: RosterId, en: string, ja: string, choices: readonly string[], extra?: Partial<Item>];
const make = (lv: Level, type: ItemType) => ([id, speaker, en, ja, choices, extra]: Row): Item =>
  ({ id, lv, type, en, ja, speaker, voice: 'us', choices, answer: 0, ...extra, ...help(id, type, choices) });
/** A `word` item: the first choice is the answer and the focus. */
const word = (lv: Level) => (r: Row): Item => ({ ...make(lv, 'word')(r), focus: r[4][0], ...r[5] });

const PIC: readonly (readonly [Level, ...Row])[] = [
  // level 1
  [1, 'p1-squid', 'cj', "I didn't catch a tuna, but I got a squid!", 'マグロは つれなかったけど、イカが つれた！',
    ['critters/squid', 'critters/tuna', 'critters/octopus', 'critters/sea-bass'], { ask: 'なにが つれた？', focus: 'squid' }],
  [1, 'p1-peach', 'goldie', 'Apples are nice, but I love peaches!', 'リンゴも いいけど、モモが だいすき！',
    ['fruit/peach', 'fruit/apple', 'fruit/pear', 'fruit/cherry'], { ask: 'いちばん すきな くだものは？', focus: 'peaches' }],
  [1, 'p1-cherry', 'bunnie', 'Can I have some cherries? I have lots of apples.', 'サクランボ もらえる？ リンゴなら たくさん あるの。',
    ['fruit/cherry', 'fruit/apple', 'fruit/peach', 'fruit/pear'], { ask: 'ほしい ものは？', focus: 'cherries' }],
  [1, 'p1-dumbbell', 'dom', 'Grab a dumbbell. Not the kettlebell, the dumbbell!', 'ダンベルを もって。ケトルベルじゃなくて、ダンベル！',
    ['items/dumbbell', 'decor/kettlebell-0', 'decor/barbell-0', 'decor/exercise-ball-0'], { ask: 'どれを もつ？', focus: 'dumbbell' }],
  [1, 'p1-treadmill', 'hamlet', "Let's run on the treadmill today. The bike can wait!", 'きょうは ランニングマシンで はしろう。バイクは またこんど！',
    ['decor/treadmill-0', 'decor/exercise-bike-0', 'decor/weight-bench-0', 'decor/punching-bag-0'], { ask: 'きょう つかうのは？', focus: 'treadmill' }],
  [1, 'p1-tarantula', 'bob', "Look out! There's a tarantula behind you!", 'あぶない！ うしろに タランチュラが いるよ！',
    ['critters/tarantula', 'critters/scorpion', 'critters/wasp', 'critters/centipede'], { ask: 'なにが いる？', focus: 'tarantula' }],
  [1, 'p1-umbrella', 'molly', "It's raining, so take an umbrella. You won't need your cap.", 'あめだから かさを もっていってね。ぼうしは いらないよ。',
    ['finds/items/blue-umbrella', 'finds/items/baseball-cap', 'finds/items/beach-ball', 'finds/items/fan'], { ask: 'もっていく ものは？', focus: 'umbrella' }],
  [1, 'p1-guitar', 'rosie', 'Raymond plays the piano, and I play the guitar!', 'レイモンドは ピアノで、わたしは ギターを ひくの！',
    ['finds/items/electric-guitar', 'finds/items/upright-piano', 'finds/items/drum-set', 'finds/items/fancy-violin'], { ask: 'このひとが ひくのは？', focus: 'I play the guitar' }],
  [1, 'p1-coffee', 'anchovy', "No juice for me, thanks. I'll have a coffee.", 'ジュースは いいや。コーヒーを ください。',
    ['finds/items/coffee-cup', 'finds/items/iced-lemon-tea', 'finds/items/blood-orange-juice', 'finds/items/strawberry-soda'], { ask: 'なにを たのんだ？', focus: 'coffee' }],
  [1, 'p1-octopus', 'stitches', "Hey, that's not a fish. It's an octopus!", 'ねえ、それ さかなじゃないよ。タコだよ！',
    ['critters/octopus', 'critters/squid', 'critters/clownfish', 'critters/sea-star'], { ask: 'なんだった？', focus: 'octopus' }],
  [1, 'p1-bike', 'kid-cat', 'I ride my bike to the beach every morning. Great for the legs!', 'まいあさ じてんしゃで ビーチまで いくんだ。あしに きくぞ！',
    ['finds/items/mountain-bike', 'finds/items/train-set', 'finds/items/hi-tech-sneakers', 'finds/items/beach-towel'], { ask: 'なにで いく？', focus: 'bike' }],
  [1, 'p1-yoga', 'roald', "Bring your yoga mat. We're stretching today!", 'ヨガマットを もってきて。きょうは ストレッチだ！',
    ['finds/items/yoga-mat', 'finds/items/beach-towel', 'finds/items/sleeping-bag', 'decor/exercise-ball-0'], { ask: 'なにを もってくる？', focus: 'yoga mat' }],
  [1, 'p1-protein', 'dom', 'After training, I always drink a protein shake!', 'トレーニングの あとは いつも プロテインを のむんだ！',
    ['decor/protein-shaker-0', 'finds/items/coffee-cup', 'finds/items/iced-lemon-tea', 'finds/items/melon-soda'], { ask: 'トレーニングの あとに のむのは？', focus: 'protein shake' }],
  [1, 'p1-snowman', 'lily', "It's snowing! Let's build a snowman together.", 'ゆきだ！ いっしょに ゆきだるまを つくろう。',
    ['deco/snowboy-0', 'deco/sandcastle', 'deco/campfire', 'deco/birthday-cake'], { ask: 'なにを つくる？', focus: 'snowman' }],
  [1, 'p1-shovel', 'blathers', "To dig up fossils, you'll need a shovel. Hoo!", 'かせきを ほるなら スコップが ひつようですぞ。ホー！',
    ['finds/shovel', 'finds/watering-can', 'finds/ammonite', 'finds/tree-branch'], { ask: 'ひつような ものは？', focus: 'shovel' }],
  [1, 'p1-cake', 'cherry', 'Happy birthday! I baked you a cake.', 'おたんじょうび おめでとう！ ケーキを やいたよ。',
    ['deco/birthday-cake', 'deco/campfire', 'deco/sandcastle', 'fruit/cherry'], { ask: 'なにを くれた？', focus: 'cake' }],
  // level 2
  [2, 'p2-tire', 'cj', "I thought I'd hooked a shark, but it was just an old tire.", 'サメが かかったと おもったら、ただの ふるいタイヤだった。',
    ['critters/old-tire', 'critters/great-white-shark', 'critters/boot', 'critters/empty-can'], { ask: 'なにが つれた？', focus: 'an old tire' }],
  [2, 'p2-kettlebell', 'dom', "Put the barbell down and pick up the kettlebell. We're doing swings!", 'バーベルを おいて、ケトルベルを もって。スイングを やるぞ！',
    ['decor/kettlebell-0', 'decor/barbell-0', 'items/dumbbell', 'decor/exercise-ball-0'], { ask: 'どれを もつ？', focus: 'pick up the kettlebell' }],
  [2, 'p2-bench', 'roald', 'Forget the treadmill. Today we hit the weight bench!', 'ランニングマシンは わすれて。きょうは ベンチで きたえるぞ！',
    ['decor/weight-bench-0', 'decor/treadmill-0', 'decor/exercise-bike-0', 'decor/punching-bag-0'], { ask: 'きょう つかうのは？', focus: 'weight bench' }],
  [2, 'p2-scale', 'stitches', "I stepped on the scale this morning... Let's not talk about it.", 'けさ たいじゅうけいに のったんだ… その はなしは やめよう。',
    ['decor/digital-scale-0', 'decor/exercise-bike-0', 'decor/treadmill-0', 'decor/weight-bench-0'], { ask: 'けさ なにに のった？', focus: 'the scale' }],
  [2, 'p2-camera', 'judy', "I meant to bring my laptop, but I only brought my camera.", 'パソコンを もってくる つもりだったけど、カメラしか もってこなかった。',
    ['finds/items/slr-camera', 'finds/items/laptop', 'finds/items/cordless-phone', 'finds/items/electric-guitar'], { ask: 'もってきたのは？', focus: 'my camera' }],
  [2, 'p2-pear', 'goldie', 'We have plenty of peaches and apples here. What we really need is pears.', 'ここには モモも リンゴも たくさん ある。ほんとうに ほしいのは ナシなの。',
    ['fruit/pear', 'fruit/peach', 'fruit/apple', 'fruit/cherry'], { ask: 'ほしいのは？', focus: 'pears' }],
  [2, 'p2-spider', 'molly', 'I was shaking a tree for apples, and a spider dropped down!', 'リンゴを とろうと きを ゆらしたら、クモが おちてきたの！',
    ['critters/spider', 'fruit/apple', 'critters/wasp', 'finds/tree-branch'], { ask: 'なにが おちてきた？', focus: 'a spider' }],
  [2, 'p2-hammock', 'anchovy', "I was going to go jogging, but I'd rather nap in my hammock.", 'ジョギングに いく つもりだったけど、ハンモックで ひるねしたいな。',
    ['deco/hammock', 'finds/items/walking-shoes', 'decor/treadmill-0', 'deco/campfire'], { ask: 'このひとが したいのは？', focus: 'nap in my hammock' }],
  [2, 'p2-ramen', 'ankha', "It's freezing. Let's skip the sandwiches and get some hot ramen.", 'さむいわ。サンドイッチは やめて、あつい ラーメンに しましょう。',
    ['finds/items/miso-ramen', 'finds/items/veggie-sandwich-set', 'finds/items/curry-with-rice', 'finds/items/iced-lemon-tea'], { ask: 'なにを たべる？', focus: 'hot ramen' }],
  [2, 'p2-violin', 'marshal', "Everyone thinks I play the guitar, but it's actually the violin.", 'みんな ぼくが ギターを ひくと おもってるけど、じつは バイオリンなんだ。',
    ['finds/items/fancy-violin', 'finds/items/electric-guitar', 'finds/items/upright-piano', 'finds/items/drum-set'], { ask: 'このひとが ひくのは？', focus: "it's actually the violin" }],
  // level 3
  [3, 'p3-whale-shark', 'cj', 'Everyone panicked when they saw the fin, but it was just a harmless whale shark.', 'ヒレを みて みんな パニックに なったけど、おとなしい ジンベエザメだった。',
    ['critters/whale-shark', 'critters/great-white-shark', 'critters/hammerhead-shark', 'critters/ocean-sunfish'], { ask: 'なんだった？', focus: 'a harmless whale shark' }],
  [3, 'p3-water', 'hamlet', 'Forget the coffee. After that run, what I really need is some ice-cold water.', 'コーヒーは いいや。あれだけ はしったら、ほしいのは つめたい みずだ。',
    ['decor/water-cooler-0', 'finds/items/coffee-cup', 'decor/protein-shaker-0', 'finds/items/iced-lemon-tea'], { ask: 'ほしいのは？', focus: 'ice-cold water' }],
  [3, 'p3-butterfly', 'flick', "It's not the ladybug I'm after. It's the butterfly right behind it.", 'ねらってるのは テントウムシじゃない。その すぐ うしろの チョウだ。',
    ['critters/common-butterfly', 'critters/ladybug', 'critters/honeybee', 'critters/red-dragonfly'], { ask: 'ねらって いるのは？', focus: 'the butterfly' }],
  [3, 'p3-boot', 'apollo', 'Three hours of fishing, and what do I have to show for it? A soggy old boot.', '3じかんも つりを して、えものは？ ぬれた ふるい ながぐつ だけだ。',
    ['critters/boot', 'critters/old-tire', 'critters/empty-can', 'critters/coelacanth'], { ask: 'なにが つれた？', focus: 'A soggy old boot' }],
  [3, 'p3-orange', 'diana', "I usually go for apple juice, but today I'm in the mood for orange.", 'いつもは リンゴジュースだけど、きょうは オレンジの きぶん。',
    ['finds/items/blood-orange-juice', 'fruit/apple', 'finds/items/strawberry-soda', 'finds/items/melon-soda'], { ask: 'きょう のみたいのは？', focus: 'orange' }],
  [3, 'p3-bike', 'roald', "My knees are killing me, so I'm switching from the treadmill to the bike today.", 'ひざが いたくて たまらないから、きょうは ランニングマシンを やめて バイクに する。',
    ['decor/exercise-bike-0', 'decor/treadmill-0', 'decor/weight-bench-0', 'finds/items/yoga-mat'], { ask: 'きょう つかうのは？', focus: 'the bike' }],
  [3, 'p3-umbrella', 'fauna', "The forecast says sunny, but I'm taking my umbrella just in case.", 'てんきよほうは はれだけど、ねんのため かさを もっていくわ。',
    ['finds/items/blue-umbrella', 'finds/items/baseball-cap', 'finds/items/fan', 'finds/items/beach-ball'], { ask: 'もっていく ものは？', focus: 'my umbrella' }],
  [3, 'p3-drums', 'raymond', 'I gave up the piano years ago. These days it\'s all about the drums.', 'ピアノは とっくに やめたよ。いまは ドラム ひとすじさ。',
    ['finds/items/drum-set', 'finds/items/upright-piano', 'finds/items/electric-guitar', 'finds/items/fancy-violin'], { ask: 'いま やっているのは？', focus: 'the drums' }]
];

const WORD: readonly (readonly [Level, ...Row])[] = [
  // level 1 (US): L/R, vowels, f/v, s/sh/th, can/can't
  [1, 'w1-right', 'goldie', 'Hmm, I think the right one is better.', 'うーん、みぎの ほうが いいと おもう。', ['right', 'light', 'white']],
  [1, 'w1-rock', 'stitches', 'Whoa, look at that big rock!', 'わあ、あの おおきな いわ みて！', ['rock', 'lock', 'log']],
  [1, 'w1-grass', 'fauna', "Please don't step on the grass.", 'しばふに はいらないでね。', ['grass', 'glass', 'gas']],
  [1, 'w1-hat', 'judy', 'Oh, I love your new hat!', 'わあ、あたらしい ぼうし すてき！', ['hat', 'hut', 'cat']],
  [1, 'w1-cup', 'anchovy', "Huh? Where's my cup?", 'あれ？ ぼくの コップ どこ？', ['cup', 'cap', 'cab']],
  [1, 'w1-bug', 'bob', "Wait! There's a bug on your arm!", 'まって！ うでに むしが いるよ！', ['bug', 'bag', 'bat']],
  [1, 'w1-walk', 'hamlet', "Let's walk after lunch. It's good for you!", 'おひるの あと、あるこう。からだに いいよ！', ['walk', 'work', 'talk']],
  [1, 'w1-cant', 'lily', "I can't swim very well.", 'わたし、あまり およげないの。', ["can't", 'can', 'could']],
  [1, 'w1-play', 'bunnie', "Let's play outside!", 'そとで あそぼう！', ['play', 'pray', 'pay']],
  [1, 'w1-hard', 'raymond', 'This chair is too hard.', 'この いす、かたすぎるね。', ['hard', 'hot', 'high']],
  [1, 'w1-ship', 'gulliver', 'Look at that big ship!', 'あの おおきな ふねを みて！', ['ship', 'sheep', 'shop']],
  [1, 'w1-sing', 'kk-slider', 'I love to sing in the shower.', 'シャワーを あびながら うたうのが すきなんだ。', ['sing', 'think', 'sink']],
  [1, 'w1-fan', 'molly', 'I want a new fan.', 'あたらしい せんぷうきが ほしいな。', ['fan', 'van', 'pan']],
  [1, 'w1-fly', 'apollo', 'I really hate flying.', 'ひこうきに のるのは ほんとうに にがてなんだ。', ['flying', 'frying', 'crying']],
  [1, 'w1-collect', 'blathers', 'Did you collect them all? Wonderful!', 'ぜんぶ あつめたのですか？ すばらしい！', ['collect', 'correct', 'connect']],
  // level 2: plurals, final consonants, sh/ch, th/f, vowels in a longer line
  [2, 'w2-cats', 'raymond', 'I really like your cats.', 'きみの ところの ネコ、ほんとうに かわいいね。', ['cats', 'cat', 'caps']],
  [2, 'w2-live', 'goldie', "I'd love to live by the sea someday.", 'いつか うみの そばに すみたいな。', ['live', 'leave', 'lie']],
  [2, 'w2-seat', 'brewster', 'Please, take a seat.', 'どうぞ、おかけください。', ['seat', 'sheet', 'seed']],
  [2, 'w2-first', 'kid-cat', 'I was first in the race today!', 'きょうの レースで 1ばんだったぞ！', ['first', 'fast', 'last']],
  [2, 'w2-watch', 'diana', 'Could you watch my bag for a minute?', 'ちょっと わたしの バッグを みていて くれる？', ['watch', 'wash', 'catch']],
  [2, 'w2-ball', 'roald', 'Pass me the ball!', 'ボールを パスして！', ['ball', 'bowl', 'bell']],
  [2, 'w2-best', 'judy', 'I think this one is the best.', 'これが いちばん いいと おもう。', ['best', 'vest', 'test']],
  [2, 'w2-cant', 'dom', "I can't make it to the gym tomorrow.", 'あしたは ジムに いけないんだ。', ["can't", 'can', 'could']],
  [2, 'w2-read', 'lily', "Who's going to read first?", 'だれが さいしょに よむ？', ['read', 'lead', 'leave']],
  [2, 'w2-cloud', 'celeste', 'Look at that cloud!', 'あの くもを みて！', ['cloud', 'crowd', 'clown']],
  [2, 'w2-free', 'label', "This one? Oh, that's free!", 'これ？ ああ、それは ただよ！', ['free', 'three', 'tea']],
  [2, 'w2-flight', 'orville', 'That was a long flight!', 'ながい フライトでしたね！', ['flight', 'fight', 'night']],
  // level 3: reductions, modals, th/f/t, l/v/n
  [3, 'w3-gotta', 'kid-cat', 'I gotta go to the gym before it closes.', 'しまる まえに ジムに いかなきゃ。', ['gotta', 'wanna', 'oughta']],
  [3, 'w3-id', 'marshal', "I'd go with the blue one, to be honest.", 'しょうじき、ぼくなら あおいのに するね。', ["I'd", "I'll", 'I']],
  [3, 'w3-shouldve', 'rosie', "You should've told me!", 'いって くれれば よかったのに！', ["should've", "shouldn't have", "could've"]],
  [3, 'w3-thought', 'apollo', 'I thought about it all night.', 'ひとばんじゅう その ことを かんがえた。', ['thought', 'fought', 'taught']],
  [3, 'w3-wont', 'bob', "Okay, I won't tell Raymond.", 'わかった、レイモンドには いわないよ。', ["won't", 'want to', 'will']],
  [3, 'w3-lively', 'diana', "It's such a lively island.", 'ほんとうに にぎやかな しまね。', ['lively', 'lovely', 'lonely']],
  [3, 'w3-fishing', 'cj', 'I was fishing all day yesterday.', 'きのうは いちにちじゅう つりを してたんだ。', ['fishing', 'wishing', 'washing']],
  [3, 'w3-breath', 'roald', 'Okay, take a breath and go again!', 'よし、ひと いき ついて、もう 1かい！', ['breath', 'break', 'bath']],
  [3, 'w3-hold', 'hamlet', 'Hold it... just five more seconds!', 'そのまま キープ… あと 5びょう！', ['hold', 'fold', 'roll'], { focus: 'Hold' }],
  [3, 'w3-sore', 'dom', "I'm not sore at all after yesterday's workout!", 'きのうの トレーニングの あとでも ぜんぜん きんにくつうに なってない！', ['sore', 'sure', 'short']],
  [3, 'w3-kitchen', 'fauna', "I've never seen such a big kitchen!", 'こんなに おおきな キッチン はじめて みた！', ['kitchen', 'chicken', 'kitten']],
  [3, 'w3-coffee', 'stitches', 'Can I get a coffee to go?', 'コーヒーを テイクアウトで もらえる？', ['coffee', 'copy', 'cookie']]
];

const REPLY: readonly (readonly [Level, ...Row])[] = [
  // level 2: the traps repeat a word or a sound, answer another wh-question, or say yes/no to a wh-question
  [2, 'r2-up-to', 'anchovy', "What're you up to?", 'なに してるの？ →「つりを してるだけ。」', ['Just fishing.', 'Up the hill.', "It's ten o'clock."]],
  [2, 'r2-fossil', 'blathers', 'Where did you find that fossil?', 'その かせき、どこで みつけたの？ →「ビーチの いわの ちかく。」', ['On the beach, near the rocks.', 'Last Tuesday.', 'Yes, I found it.']],
  [2, 'r2-close', 'tom-nook', 'When does the store close?', 'みせは いつ しまるの？ →「こんや 10じ。」', ['At ten tonight.', 'Near the museum.', 'Close the door, please.']],
  [2, 'r2-tea', 'brewster', 'Would you like some tea?', 'こうちゃは いかが？ →「はい、すこしだけ。」', ['Yes, please. Just a little.', "No, it's not a tree.", 'I liked it a lot.']],
  [2, 'r2-workout', 'dom', 'How was your workout?', 'トレーニング どうだった？ →「きつかったけど、きぶん さいこう。」', ['Tough, but I feel great.', 'At the gym.', 'I worked out of town.']],
  [2, 'r2-sleepy', 'rosie', 'Why are you so sleepy?', 'なんで そんなに ねむそうなの？ →「ゆうべ よふかし したの。」', ['I stayed up late last night.', 'Yes, very sleepy.', 'In my bed.']],
  [2, 'r2-sofa', 'stitches', 'Can you help me move this sofa?', 'この ソファ うごかすの てつだって くれる？ →「いいよ、どこに おく？」', ["Sure, where's it going?", 'It moves very fast.', "Yes, it's my sofa."]],
  [2, 'r2-caught', 'cj', 'Who caught that sea bass?', 'その スズキ、だれが つったの？ →「ぼく。わるくないでしょ？」', ['I did. Not bad, huh?', 'This morning.', 'Out at sea.']],
  [2, 'r2-museum', 'molly', 'Have you been to the museum yet?', 'もう はくぶつかんに いった？ →「まだ。いいところ？」', ['Not yet. Is it good?', "Yes, I'll go tomorrow.", 'At the museum.']],
  [2, 'r2-running', 'hamlet', 'Do you want to go running tomorrow?', 'あした はしりに いかない？ →「いいね、なんじ？」', ['Sure, what time?', 'I ran out of it.', 'It was yesterday.']],
  [2, 'r2-shirt', 'judy', 'Which shirt do you like better?', 'どっちの シャツが すき？ →「あおいほう。」', ['The blue one.', 'Yes, I like it.', "It's better now."]],
  [2, 'r2-lamp', 'raymond', 'How much is this lamp?', 'この ランプ いくら？ →「2,000ベル。」', ["It's 2,000 Bells.", 'Very much, thank you.', "It's on the table."]],
  [2, 'r2-break', 'roald', 'Should we take a break?', 'きゅうけい しようか？ →「いいね。つかれたよ。」', ["Good idea. I'm tired.", "It's broken.", 'I took it yesterday.']],
  [2, 'r2-rain', 'fauna', 'Is it going to rain today?', 'きょう あめ ふるかな？ →「ふりそう。かさを もっていって。」', ['I think so. Take an umbrella.', 'It rained yesterday.', "Yes, I'm going."]],
  // level 3: indirect answers, idioms, and the traps of mind / why don't we / negative questions
  [3, 'r3-snacks', 'bunnie', "Didn't you say you'd bring snacks?", 'おやつ もってくるって いってなかった？ →「あっ、まだ かばんの なか！」', ["Oops, they're still in my bag!", 'Yes, I said hello.', 'Bring them to the snack bar.']],
  [3, 'r3-coffee', 'marshal', 'Wanna grab some coffee after this?', 'これが おわったら コーヒー のまない？ →「いきたいけど、よていが あるんだ。」', ["I'd love to, but I've got plans.", "It's after ten.", 'I grabbed it already.']],
  [3, 'r3-early', 'goldie', "How come you're up so early?", 'なんで こんなに はやおきなの？ →「ねむれなかったの。」', ["I couldn't sleep.", 'I came up the hill.', 'Since six o\'clock.']],
  [3, 'r3-fireworks', 'tom-nook', "Who's in charge of the fireworks show?", 'はなびたいかいは だれが しきってるの？ →「しずえさんが やってるよ。」', ["Isabelle's handling it.", "It's free of charge.", 'At eight, on the beach.']],
  [3, 'r3-working-out', 'dom', "You've been working out, haven't you?", 'きたえてるでしょ？ →「わかる？ ありがとう！」', ['Can you tell? Thanks!', 'I worked it out.', "No, I haven't been out."]],
  [3, 'r3-mind', 'diana', 'Do you mind if I sit here?', 'ここに すわっても いい？ →「どうぞ、かまいませんよ。」', ['Not at all, go ahead.', 'Yes, please sit.', "He's sitting over there."]],
  [3, 'r3-gym', 'kid-cat', "Why don't we hit the gym together?", 'いっしょに ジムに いかない？ →「いいね。5ふん まって。」', ['Sounds good. Give me five minutes.', "Because it's closed.", 'I hit it by accident.']],
  [3, 'r3-hat', 'cherry', "Where'd you get that hat?", 'その ぼうし、どこで かったの？ →「もちろん きぬよさんの おみせ！」', ["Mabel's shop, of course!", 'I got it yesterday.', "I'll get it for you."]],
  [3, 'r3-monday', 'ankha', "Isn't the museum closed on Mondays?", 'はくぶつかんって げつようび おやすみじゃない？ →「この しまでは ちがうよ。」', ['Not on this island.', 'Yes, I closed it.', "I'm closer to the museum."]],
  [3, 'r3-how-long', 'lily', 'How long have you lived on this island?', 'この しまに すんで どのくらい？ →「もう 2ねんくらい。」', ['About two years now.', "It's a long island.", 'Near the beach.']],
  [3, 'r3-keep-down', 'apollo', 'Could you keep it down a bit?', 'すこし しずかに して くれないか？ →「あっ、ごめん！ うるさかった？」', ['Oh, sorry! Was I too loud?', "I'll keep it for you.", "It's down the hill."]],
  [3, 'r3-show', 'kk-slider', "Are you coming to my show tonight?", 'こんやの ライブ くる？ →「ぜったい いく！」', ["Wouldn't miss it!", 'You showed me last night.', 'Yes, you came.']],
  [3, 'r3-rod', 'molly', "I can't find my fishing rod anywhere.", 'つりざおが どこにも ないの。 →「いえの ちかくは さがした？」', ['Did you check by your house?', 'I found a fish.', 'Yes, you can find it.']],
  [3, 'r3-picnic', 'bunnie', 'What do you say we have a picnic?', 'ピクニック しない？ →「いいね！ サンドイッチ もっていく。」', ["Great idea! I'll bring sandwiches.", "I didn't say anything.", 'Yes, I picked it up.']],
  [3, 'r3-boxes', 'raymond', 'Mind giving me a hand with this box?', 'この はこ、てつだって もらえる？ →「もちろん、どこに はこぶ？」', ['Sure, where does it go?', 'My hands are cold.', "It's a cardboard box."]],
  [3, 'r3-late', 'flick', "Sorry I'm late. Did I miss anything?", 'おくれて ごめん。なにか みのがした？ →「ううん、いま はじまった ところ。」', ['Nope, we just started.', "No, I'm not late.", 'I missed the bus.']]
];

// ---- num templates (speaker × phrase × number) ----------------------------------------------------------------------

interface NumTemplate {
  key: string;
  lv: Level;
  ask: string;
  speakers: readonly RosterId[];
  /** The sentence around the spoken number. */
  say: (n: string) => string;
  /** The Japanese, from the right choice. */
  ja: (c: string) => string;
  /** [spoken, [right choice, near distractors…], かいせつ (`why`)]. */
  rows: readonly (readonly [spoken: string, choices: readonly string[], why: string])[];
}

const NUM: readonly NumTemplate[] = [
  // level 1
  { key: 'n1-price', lv: 1, ask: 'いくら？', speakers: ['tom-nook', 'mabel', 'kicks'],
    say: (n) => `That'll be ${n} Bells, please.`, ja: (c) => `${c}に なります。`,
    rows: [['1,500', ['1,500 ベル', '15,000 ベル', '1,050 ベル'], 'fifteen hundred＝1,500。値段では千の位を「15百」と言うことが多い。fifteen thousand なら15,000。'],
      ['800', ['800 ベル', '8,000 ベル', '1,800 ベル'], 'eight hundred＝800。thousand（千）とは言っていない。eighteen hundred なら1,800。'],
      ['4,000', ['4,000 ベル', '400 ベル', '14,000 ベル'], 'four thousand＝4,000。four hundred（400）や fourteen thousand（14,000）と聞き分ける。']] },
  { key: 'n1-meet', lv: 1, ask: 'なんじに あう？', speakers: ['goldie', 'bunnie', 'molly'],
    say: (n) => `Let's meet at ${n}.`, ja: (c) => `${c}に あおう。`,
    rows: [['two fifteen', ['2:15', '2:50', '12:15'], 'two fifteen＝2時15分。時刻は「時・分」の数字を並べて言う。fifTEEN は後ろ、FIFty は前に強勢。'],
      ['six forty', ['6:40', '6:14', '4:40'], 'six forty＝6時40分。FORty は前が強く短い。fourTEEN（14）は後ろが長い。'],
      ['nine fifty', ['9:50', '9:15', '5:50'], 'nine fifty＝9時50分。FIFty は前が強く短い。fifTEEN（15）は後ろが長い。']] },
  { key: 'n1-birthday', lv: 1, ask: 'たんじょうびは なんにち？', speakers: ['judy', 'rosie', 'cherry'],
    say: (n) => `My birthday is on the ${n}.`, ja: (c) => `わたしの たんじょうびは ${c}。`,
    rows: [['13th', ['13日', '30日', '3日'], 'thirteenth＝13日。thirTEENth は後ろが強く長い。THIRtieth（30日）は前が強い。third なら3日。'],
      ['16th', ['16日', '6日', '26日'], 'sixteenth＝16日。sixth（6日）より長く、後ろに teen の音がある。twenty-sixth なら26日。'],
      ['19th', ['19日', '9日', '29日'], 'nineteenth＝19日。ninth（9日）より長く、後ろの teen が強い。twenty-ninth なら29日。']] },
  { key: 'n1-reps', lv: 1, ask: 'なんかい？', speakers: ['dom', 'hamlet', 'kid-cat'],
    say: (n) => `Come on, let's do ${n} push-ups!`, ja: (c) => `さあ、うでたてふせ ${c}！`,
    rows: [['15', ['15かい', '50かい', '5かい'], 'fifteen＝15回。-teen は後ろが強く長い。FIFty（50）は前が強く、最後は短い。'],
      ['13', ['13かい', '30かい', '3かい'], 'thirteen＝13回。thirTEEN は後ろ、THIRty（30）は前に強勢。push-ups＝腕立て伏せ。'],
      ['40', ['40かい', '14かい', '4かい'], 'forty＝40回。FORty は前が強く、最後は短い「ティ」。fourTEEN（14）は後ろが長い。']] },
  { key: 'n1-turnips', lv: 1, ask: 'カブは いくら？', speakers: ['daisy-mae'],
    say: (n) => `Turnips are ${n} Bells today!`, ja: (c) => `きょうの カブは ${c}だよ！`,
    rows: [['90', ['90 ベル', '19 ベル', '99 ベル'], 'ninety＝90。NINEty は前に強勢。nineTEEN（19）は後ろが長い。ninety-nine なら99。'],
      ['70', ['70 ベル', '17 ベル', '77 ベル'], 'seventy＝70。SEVenty は前が強い。sevenTEEN（17）は後ろが長い。'],
      ['60', ['60 ベル', '16 ベル', '66 ベル'], 'sixty＝60。SIXty は前が強い。sixTEEN（16）は後ろが長い。']] },
  // level 2
  { key: 'n2-opens', lv: 2, ask: 'なんじに ひらく？', speakers: ['blathers', 'celeste'],
    say: (n) => `The museum opens at ${n}.`, ja: (c) => `はくぶつかんは ${c}に ひらきます。`,
    rows: [['a quarter after nine', ['9:15', '8:45', '9:45'], 'a quarter after nine＝9時15分。quarter は15分、after は「過ぎ」。to なら15分前の8時45分。'],
      ['a quarter to seven', ['6:45', '7:15', '7:45'], 'a quarter to seven＝7時の15分前、6時45分。to は「前」。after なら7時15分。'],
      ['half past three', ['3:30', '2:30', '3:00'], 'half past three＝3時半。half は30分、past は「過ぎ」。three thirty とも言う。']] },
  { key: 'n2-price', lv: 2, ask: 'いくら？', speakers: ['tom-nook', 'label', 'saharah'],
    say: (n) => `It's ${n} Bells for this one.`, ja: (c) => `こちらは ${c}です。`,
    rows: [['12,500', ['12,500 ベル', '20,500 ベル', '12,050 ベル'], 'twelve thousand five hundred＝12,500。thousand の後の five hundred まで聞く。twelve と twenty も聞き分ける。'],
      ['38,000', ['38,000 ベル', '3,800 ベル', '48,000 ベル'], 'thirty-eight thousand＝38,000。thirty-eight hundred なら3,800。thousand か hundred かを聞く。'],
      ['9,900', ['9,900 ベル', '99,000 ベル', '9,090 ベル'], 'nine thousand nine hundred＝9,900。ninety-nine thousand なら99,000。']] },
  { key: 'n2-days', lv: 2, ask: 'なんにち？', speakers: ['stitches', 'ankha'],
    say: (n) => `I've been on this island for ${n} days.`, ja: (c) => `この しまに きて ${c}に なるよ。`,
    rows: [['14', ['14日', '40日', '4日'], 'fourteen＝14日。fourTEEN は後ろが長い。FORty（40）は前が強い。'],
      ['17', ['17日', '70日', '7日'], 'seventeen＝17日。後ろの teen が強く長い。SEVenty（70）は前が強い。']] },
  { key: 'n2-tourney', lv: 2, ask: 'なんにち？', speakers: ['cj', 'raymond'],
    say: (n) => `The fishing tourney is on the ${n}.`, ja: (c) => `つりたいかいは ${c}だよ。`,
    rows: [['13th', ['13日', '30日', '3日'], 'thirteenth＝13日。後ろの teenth が強く長い。THIRtieth（30日）は前が強い。tourney＝大会。'],
      ['31st', ['31日', '13日', '21日'], 'thirty-first＝31日。thirty と first の2語。thirteenth（13日）は1語で後ろが長い。']] },
  { key: 'n2-flight', lv: 2, ask: 'なんじに でる？', speakers: ['orville', 'wilbur'],
    say: (n) => `Your flight leaves at ${n}.`, ja: (c) => `ひこうきは ${c}に でます。`,
    rows: [['eight forty', ['8:40', '8:14', '8:04'], 'eight forty＝8時40分。FORty は前が強い。fourteen なら8時14分、oh four なら8時4分。'],
      ['eleven fifteen', ['11:15', '11:50', '7:15'], 'eleven fifteen＝11時15分。fifTEEN は後ろが長い。fifty なら11時50分。']] },
  { key: 'n2-run', lv: 2, ask: 'なんマイル？', speakers: ['hamlet'],
    say: (n) => `I biked ${n} miles this morning!`, ja: (c) => `けさ じてんしゃで ${c} はしったぞ！`,
    rows: [['16', ['16マイル', '60マイル', '6マイル'], 'sixteen＝16マイル。sixTEEN は後ろが長く強い。SIXty（60）は前が強い。biked＝自転車で走った。']] },
  // level 3
  { key: 'n3-meet', lv: 3, ask: 'なんじ？', speakers: ['diana', 'marshal', 'ankha'],
    say: (n) => `Meet me at ${n}, okay?`, ja: (c) => `${c}に きてね。`,
    rows: [['ten to six', ['5:50', '6:10', '10:06'], 'ten to six＝6時の10分前、5時50分。to は「前」。聞こえた順に6時10分と取らないこと。'],
      ['twenty-five after four', ['4:25', '3:35', '4:35'], 'twenty-five after four＝4時25分。after は「過ぎ」。to なら4時の25分前で3時35分。'],
      ['a quarter of eight', ['7:45', '8:15', '8:45'], 'a quarter of eight＝8時の15分前、7時45分。米国では of を to と同じ「前」の意味で使うことがある。']] },
  { key: 'n3-steal', lv: 3, ask: 'いくら？', speakers: ['redd', 'saharah', 'redd'],
    say: (n) => `It's a steal at ${n} Bells!`, ja: (c) => `${c}なら おかいどくだよ！`,
    rows: [['115,000', ['115,000 ベル', '150,000 ベル', '105,000 ベル'], 'one hundred fifteen thousand＝115,000。fifTEEN は後ろが長い。a steal＝格安。'],
      ['48,800', ['48,800 ベル', '40,800 ベル', '48,080 ベル'], 'forty-eight thousand eight hundred＝48,800。forty-eight と eight hundred を thousand で分けて聞く。'],
      ['16,600', ['16,600 ベル', '60,600 ベル', '16,060 ベル'], 'sixteen thousand six hundred＝16,600。sixTEEN は後ろが長い。sixty なら60,600。']] },
  { key: 'n3-loan', lv: 3, ask: 'ローンは いくら？', speakers: ['tom-nook'],
    say: (n) => `Your home loan comes to ${n} Bells, yes, yes.`, ja: (c) => `ローンは ${c}だなも。`,
    rows: [['98,000', ['98,000 ベル', '90,800 ベル', '9,800 ベル'], 'ninety-eight thousand＝98,000。nine thousand eight hundred なら9,800。comes to＝合計〜になる。']] },
  { key: 'n3-meteor', lv: 3, ask: 'なんにち？', speakers: ['celeste', 'blathers'],
    say: (n) => `I think the meteor shower's on the ${n}.`, ja: (c) => `りゅうせいぐんは ${c}だと おもう。`,
    rows: [['23rd', ['23日', '20日', '3日'], 'twenty-third＝23日。twenty と third の2語。third だけなら3日、twentieth なら20日。'],
      ['12th', ['12日', '20日', '22日'], 'twelfth＝12日。twelve の ve が f に変わる特別な形。twentieth（20日）とは最初の音が違う。']] },
  { key: 'n3-turnips', lv: 3, ask: 'カブは いくら？', speakers: ['daisy-mae'],
    say: (n) => `These turnips are ${n} Bells each.`, ja: (c) => `この カブは 1こ ${c}だよ。`,
    rows: [['a hundred and ten', ['110 ベル', '101 ベル', '1,010 ベル'], 'a hundred and ten＝110。会話では one hundred を a hundred とも言う。and の後の ten が下2桁。'],
      ['ninety-eight', ['98 ベル', '88 ベル', '90 ベル'], 'ninety-eight＝98。NINEty は前に強勢。eighty-eight なら88。each＝1個につき。']] },
  { key: 'n3-reps', lv: 3, ask: 'なんびょう？', speakers: ['roald', 'dom'],
    say: (n) => `Hold a plank for sixty seconds. Actually, no, make it ${n}!`, ja: (c) => `プランク 60びょう… いや、${c}に しよう！`,
    rows: [['ninety', ['90びょう', '60びょう', '19びょう'], 'Actually, no, make it ninety! の言い直しが答え。最初の sixty（60秒）は取り消し。NINEty は前が強い。'],
      ['seventy', ['70びょう', '60びょう', '17びょう'], 'Actually, no の後が変更後の70秒。最初の sixty は取り消し。SEVenty は前が強い。']] }
];

/** A num choice in Japanese: 2:15 → 2時15分, 1,500 ベル → 1,500ベル, 15かい → 15回, 90びょう → 90秒. */
const numJa = (c: string): string =>
  c.replace(/^(\d{1,2}):(\d{2})$/, (_, h: string, m: string) => (m === '00' ? `${h}時` : `${h}時${+m}分`))
    .replace(' ベル', 'ベル').replace('かい', '回').replace('びょう', '秒');

const numItems = (t: NumTemplate): Item[] =>
  t.rows.map(([spoken, choices, why], i) => ({
    id: `${t.key}-${i + 1}`,
    lv: t.lv,
    type: 'num',
    en: t.say(spoken),
    ja: t.ja(choices[0]),
    speaker: t.speakers[i % t.speakers.length],
    voice: 'us',
    choices,
    answer: 0,
    focus: spoken,
    ask: t.ask,
    cja: choices.map(numJa),
    why
  }));

// ---- the Japanese help (bank.ts cja, why, ctx; docs/kikimimi.md "Japanese help") -----------------------------------

/** A picture's label in the sheet's Japanese (kanji where a word has them; else bank.ts PIC_JA's). */
const PIC_KANJI: Readonly<Record<string, string>> = {
  'fruit/pear': '洋ナシ',
  'critters/old-tire': '古いタイヤ',
  'critters/boot': '長靴',
  'critters/empty-can': '空き缶',
  'decor/weight-bench-0': 'トレーニングベンチ',
  'decor/digital-scale-0': '体重計',
  'decor/water-cooler-0': '冷たい水',
  'deco/snowboy-0': '雪だるま',
  'deco/sandcastle': '砂のお城',
  'deco/campfire': 'たき火',
  'finds/ammonite': '化石',
  'finds/tree-branch': '木の枝',
  'finds/items/blue-umbrella': '傘',
  'finds/items/baseball-cap': '帽子',
  'finds/items/fan': '扇風機',
  'finds/items/mountain-bike': '自転車',
  'finds/items/train-set': '電車のおもちゃ',
  'finds/items/sleeping-bag': '寝袋',
  'finds/items/cordless-phone': '電話',
  'finds/items/walking-shoes': '靴'
};

/** Each item's help: `why` (かいせつ, ≤ 90 字), `cja` (a word's and a reply's choices; a picture's and a number's
 *  are made), `ctx` (the situation, where the line alone doesn't give it). */
type Help = Pick<Item, 'cja' | 'why' | 'ctx'>;
const HELP: Readonly<Record<string, Help>> = {
  // pic, level 1
  'p1-squid': { why: 'but の後が本題。tuna（マグロ）は「釣れなかった」ほうで、釣れたのは squid（イカ）。octopus（タコ）と混同しないこと。' },
  'p1-peach': { why: 'Apples are nice, but… でリンゴも出てくるが、but の後の I love peaches が本音。peach（モモ）と pear（洋ナシ）は音が近い。' },
  'p1-cherry': { why: '欲しいのは Can I have some cherries? のサクランボ。リンゴは「たくさんある」ほうなので、欲しい物ではない。' },
  'p1-dumbbell': { why: 'Not the kettlebell, the dumbbell! は「AじゃなくてB」の形。最後にもう一度言った dumbbell（ダンベル）が答え。' },
  'p1-treadmill': { why: 'run on the treadmill（ランニングマシンで走る）が今日の予定。The bike can wait は「バイクは後回し」。' },
  'p1-tarantula': { why: 'Look out!＝危ない！ behind you＝あなたの後ろに。tarantula（タランチュラ）はほぼ日本語と同じ音。' },
  'p1-umbrella': { why: "It's raining だから take an umbrella（傘）。You won't need your cap は「帽子はいらない」で、持っていかない物。" },
  'p1-guitar': { why: 'Raymond plays the piano はレイモンドのこと。話し手自身は and I play the guitar で、ギター。主語に注意。' },
  'p1-coffee': { why: "No juice for me＝ジュースはいらない。I'll have a coffee が注文。I'll have～は店で頼むときの定番。" },
  'p1-octopus': { why: "that's not a fish. It's an octopus! の「AではなくB」。an octopus（タコ）が答え。squid（イカ）と区別。" },
  'p1-bike': { why: 'ride my bike＝自転車に乗る。英語の bike はふつう自転車のこと。行き先の beach と混同しないこと。' },
  'p1-yoga': { why: 'Bring your yoga mat＝ヨガマットを持ってきて。stretching はストレッチ。タオルや寝袋は出てこない。' },
  'p1-protein': { why: 'protein shake＝プロテインドリンク。日本語の「プロテイン」と同じ物。ほかの飲み物は出てこない。' },
  'p1-snowman': { why: "It's snowing! がヒント。build a snowman＝雪だるまを作る。build は「組み立てる・作る」。" },
  'p1-shovel': { why: "To dig up fossils＝化石を掘るには。you'll need a shovel（スコップが必要）。化石は掘る物で、道具ではない。" },
  'p1-cake': { why: 'Happy birthday! から誕生日の話。I baked you a cake＝あなたにケーキを焼いた。bake＝焼く。' },
  // pic, level 2
  'p2-tire': { why: "I thought I'd hooked a shark＝サメがかかったと思った（勘違い）。but の後の just an old tire が本当の結果。" },
  'p2-kettlebell': { why: 'Put the barbell down＝バーベルは置く。pick up the kettlebell（ケトルベル）が持つ物。swings はケトルベルの定番種目。' },
  'p2-bench': { why: 'Forget the treadmill＝ランニングマシンはなし。hit the weight bench＝ベンチでトレーニングする。hit は「取りかかる」。' },
  'p2-scale': { why: "stepped on the scale＝体重計に乗った。Let's not talk about it（その話はやめよう）で、結果がよくなかったとわかる。" },
  'p2-camera': { why: 'I meant to bring my laptop＝持ってくるつもりだった（でも忘れた）。実際に持ってきたのは only my camera。' },
  'p2-pear': { why: 'peaches と apples は「たくさんある」ほう。What we really need is pears が本当に欲しい物。peach と pear を聞き分ける。' },
  'p2-spider': { why: 'shaking a tree for apples＝リンゴを取ろうと木を揺らした。落ちてきたのは a spider（クモ）。リンゴは目的のほう。' },
  'p2-hammock': { why: "I was going to go jogging＝走るつもりだった（やめた）。I'd rather nap in my hammock＝ハンモックで昼寝したい。" },
  'p2-ramen': { why: 'freezing（すごく寒い）が理由。skip the sandwiches＝サンドイッチはやめて、get some hot ramen（温かいラーメン）。' },
  'p2-violin': { why: "Everyone thinks I play the guitar はみんなの思い込み。it's actually the violin の actually（実は）の後が本当。" },
  // pic, level 3
  'p3-whale-shark': { why: 'ヒレを見てサメだと思い、みんなパニック。but it was just a harmless whale shark が正体。harmless＝無害な。' },
  'p3-water': { why: 'Forget the coffee＝コーヒーはいらない。what I really need is some ice-cold water（冷たい水）が答え。' },
  'p3-butterfly': { why: "It's not the ladybug I'm after＝狙いはテントウムシではない。be after＝〜を狙う。the butterfly が答え。" },
  'p3-boot': { why: 'what do I have to show for it?＝成果は何？ と苦笑いする言い方。答えは A soggy old boot（ぬれた古い長靴）。' },
  'p3-orange': { why: "I usually go for apple juice＝いつもはリンゴ。but today I'm in the mood for orange＝今日はオレンジの気分。" },
  'p3-bike': { why: "My knees are killing me＝ひざがすごく痛い。switching from A to B＝AからBに変える。後ろの the bike が答え。" },
  'p3-umbrella': { why: 'The forecast says sunny でも、just in case（念のため）に my umbrella を持っていく。晴れの予報でも傘。' },
  'p3-drums': { why: "I gave up the piano years ago＝ピアノはやめた。These days it's all about the drums＝今はドラムばかり。" },

  // word, level 1
  'w1-right': { cja: ['右', '明るい・軽い', '白い'], why: 'right の r は舌をどこにもつけず、唇を丸めて出す。light の l は舌先を歯の裏につける。white は「ワイ」で始まる。' },
  'w1-rock': { cja: ['岩', '鍵', '丸太'], why: 'rock の r はこもった音、lock の l は舌先をつけた明るい音。log は最後に g が聞こえる。' },
  'w1-grass': { cja: ['芝生', 'ガラス', 'ガソリン'], why: 'grass（芝生）は gr、glass（ガラス）は gl。どちらも「グラス」と聞こえがちなので、r のこもりを聞く。gas には r も l もない。' },
  'w1-hat': { cja: ['帽子', '小屋', '猫'], why: 'hat の a は口を横に開く「ア」と「エ」の間の音。hut の u は短くあいまいな「ア」。cat は k で始まる。' },
  'w1-cup': { cja: ['コップ', '（つばのある）帽子', 'タクシー'], why: 'cup の u は短くあいまいな「ア」、cap の a は「エア」に近い音。cab は最後に唇を閉じる b。' },
  'w1-bug': { cja: ['虫', '袋・かばん', 'バット'], why: "bug の u はあいまいな「ア」、bag の a は「エア」に近い。There's a bug on your arm＝腕に虫がいる。" },
  'w1-walk': { cja: ['歩く', '働く', '話す'], why: 'walk（ウォーク）の l は発音しない。work（ワーク）は r のこもった「アー」。talk は t で始まる。' },
  'w1-cant': { cja: ['できない', 'できる', 'できた'], why: "否定の can't は「キャーン」と強く長い。肯定の can は弱く「クン」。最後の t はほぼ聞こえないので、母音の強さで判断する。" },
  'w1-play': { cja: ['遊ぶ', '祈る', '払う'], why: "play は pl、pray は pr。pay には l も r もない。Let's play outside＝外で遊ぼう。" },
  'w1-hard': { cja: ['かたい', '熱い', '高い'], why: 'hard は r の響きがある長い「ハー（ド）」。hot は短い「ハ（ッ）ト」、high は「ハイ」。' },
  'w1-ship': { cja: ['船', '羊', '店'], why: 'ship の i は短く緩い「イ」、sheep は長く張った「イー」。shop は口を開く「ア」に近い。' },
  'w1-sing': { cja: ['歌う', '考える', '流し台'], why: 'sing の s は歯の裏で出す「ス」、think の th は舌を歯にはさむ音。sink は最後に k が聞こえる。' },
  'w1-fan': { cja: ['扇風機', 'ワゴン車', 'フライパン'], why: 'fan の f は上の歯を下唇に当てて息だけ。van の v は同じ形で声を出す。pan は唇を閉じて破裂させる。' },
  'w1-fly': { cja: ['飛行機に乗ること', '揚げ物をすること', '泣くこと'], why: 'flying の fl は舌先をつける l、frying の fr は舌を浮かせる r。crying は k の音で始まる。hate flying＝飛行機が大の苦手。' },
  'w1-collect': { cja: ['集める', '直す', 'つなぐ'], why: 'collect は l、correct は r。どちらも「コレクト」になりがち。connect は n。collect them all＝全部集める。' },
  // word, level 2
  'w2-cats': { cja: ['猫たち', '猫', '帽子'], why: 'cats は最後の s まで聞こえる複数形。cat なら「キャッ（ト）」で終わる。caps は p の音。' },
  'w2-live': { cja: ['住む', '去る', 'うそをつく'], why: 'live の i は短い「イ」、leave は長い「イー」。lie は「ライ」。live by the sea＝海のそばに住む。' },
  'w2-seat': { cja: ['席', 'シーツ', '種'], why: 'seat は「スィー」、sheet は「シー」。seed は最後が d で、t より柔らかい。take a seat＝お座りください。' },
  'w2-first': { cja: ['1位', '速い', '最下位'], why: 'first は r のこもった「ファー」、fast は口を開く「ファ（エ）」。last は l で始まる。I was first＝1位だった。' },
  'w2-watch': { cja: ['見ている', '洗う', '捕まえる'], why: 'watch は「ウォッチ」、wash は「ウォッシュ」。ch は舌で一度止めてから出す音。watch my bag＝荷物を見ていて。' },
  'w2-ball': { cja: ['ボール', 'おわん', 'ベル'], why: 'ball は口を縦に開く「ボー」。bowl は「ボウル」と「オウ」。bell は「ベ」。Pass me the ball＝ボールをパスして。' },
  'w2-best': { cja: ['いちばん良い', 'ベスト（チョッキ）', 'テスト'], why: 'best の b は唇を閉じてから破裂させる。vest の v は上の歯を下唇に当てる。test は t。' },
  'w2-cant': { cja: ['行けない', '行ける', '行けた'], why: "can't は「キャーン」と強く長く、can は弱く「クン」。最後の t はほぼ聞こえない。can't make it＝行けない。" },
  'w2-read': { cja: ['読む', '先導する', '去る'], why: 'read は r、lead は l。どちらも「リード」になりがち。leave は最後に v の音。read first＝最初に読む。' },
  'w2-cloud': { cja: ['雲', '人混み', 'ピエロ'], why: 'cloud は cl、crowd は cr。clown は最後が n で終わる。Look at that cloud!＝あの雲を見て。' },
  'w2-free': { cja: ['無料', '3つ', 'お茶'], why: "free の f は下唇に歯を当てて息を出す。three の th は舌を歯にはさむ。tea は t。that's free＝それは無料だよ。" },
  'w2-flight': { cja: ['飛行機の旅', 'けんか', '夜'], why: 'flight は fl で始まり、fight には l がない。night は n。long flight＝長いフライト。' },
  // word, level 3
  'w3-gotta': { cja: ['行かなきゃ', '行きたい', '行くべき'], why: 'gotta＝got to（〜しなきゃ）。t が弾んで「ガダ」。wanna＝want to（〜したい）、oughta＝ought to（〜すべき）。' },
  'w3-id': { cja: ['私なら〜にする', '私は〜にする', '私は'], why: "I'd go with～＝私なら〜にする（おすすめ）。I'll なら自分が「そうする」という決定。d は弱く、すぐ go に続く。" },
  'w3-shouldve': { cja: ['言うべきだった', '言うべきではなかった', '言えたのに'], why: "should've は「シュダヴ」と短い。shouldn't have なら n の音が入る。You should've told me＝言ってくれればよかったのに。" },
  'w3-thought': { cja: ['考えた', '戦った', '教えた'], why: 'thought の th は舌を歯にはさむ音。fought は下唇に歯を当てる f。taught は t で始まる。' },
  'w3-wont': { cja: ['言わない', '言いたい', '言う'], why: "won't は「ウォウント」と「オウ」の音、want to は「ワナ」。I won't tell＝言わないよ、という約束。" },
  'w3-lively': { cja: ['にぎやかな', 'すてきな', 'さびしい'], why: 'lively は長い「ライ」で始まる。lovely は「ラヴ」、lonely は「ロウン」で n の音。' },
  'w3-fishing': { cja: ['釣り', '願うこと', '洗うこと'], why: 'fishing の f は下唇に歯を当てて息を出す。wishing は唇を丸める w。washing は「ウォ」。' },
  'w3-breath': { cja: ['息', '休憩', 'お風呂'], why: 'breath は「ブレス」と th の息で終わる。break は k で止まる。bath には r がない。take a breath＝ひと息つく。' },
  'w3-hold': { cja: ['キープする', 'たたむ', '転がす'], why: 'Hold it＝その姿勢をキープ。hold は h の息、fold は下唇に歯を当てる f。roll は r で始まる。' },
  'w3-sore': { cja: ['筋肉痛の', '確かな', '短い'], why: 'sore（筋肉痛の）は「ソー」、sure は「シュア」、short は t で終わる。not sore at all＝全然筋肉痛じゃない。' },
  'w3-kitchen': { cja: ['台所', '鶏肉', '子猫'], why: 'kitchen は k で始まり、途中に ch。chicken は ch で始まる。kitten は「キトゥン」で ch がない。' },
  'w3-coffee': { cja: ['コーヒー', 'コピー', 'クッキー'], why: 'coffee は「カーフィ」に近く、f の音がある。copy は p で「カピ」、cookie は「クッキー」。a coffee to go＝持ち帰り。' },

  // reply, level 2
  'r2-up-to': { cja: ['釣りをしてるだけ。', '丘の上へ。', '10時だよ。'], why: "What're you up to?＝今何してるの？ というあいさつ。up につられた Up the hill や、時刻の答えはずれている。" },
  'r2-fossil': { cja: ['ビーチの、岩の近く。', '先週の火曜日。', 'うん、見つけた。'], why: 'Where（どこ）の質問なので場所で答える。Last Tuesday は When への答え、Yes は Yes/No 疑問文への答え。' },
  'r2-close': { cja: ['今夜10時に。', '博物館の近く。', 'ドアを閉めてください。'], why: 'When（いつ）なので時刻で答える。close の音を繰り返すだけの答えは罠。Near the museum は場所。', ctx: 'お店の前で、友だちに聞かれました' },
  'r2-tea': { cja: ['はい、お願いします。少しだけ。', 'いいえ、木じゃないよ。', 'すごく気に入った。'], why: 'Would you like～?＝〜はいかが？ には Yes, please. で受ける。tea と tree、like と liked の似た音は罠。' },
  'r2-workout': { cja: ['きつかったけど、気分は最高。', 'ジムで。', '町の外で働いた。'], why: 'How was～?＝〜はどうだった？ には感想で答える。At the gym は場所、worked out of town は音の罠。' },
  'r2-sleepy': { cja: ['ゆうべ夜ふかししたの。', 'うん、すごく眠い。', 'ベッドで。'], why: 'Why（なぜ）には理由で答える。Yes/No や場所の答えはずれ。stayed up late＝夜ふかしした。' },
  'r2-sofa': { cja: ['いいよ、どこに置く？', 'すごく速く動くよ。', 'うん、私のソファだよ。'], why: 'Can you help me～?＝手伝ってくれる？ という頼み。Sure で引き受けるのが自然。moves fast は move の繰り返しの罠。' },
  'r2-caught': { cja: ['ぼく。悪くないでしょ？', '今朝。', '沖で。'], why: 'Who（だれ）なので人で答える。I did＝ぼくが釣った。This morning は時、Out at sea は場所の答え。' },
  'r2-museum': { cja: ['まだ。いいところ？', 'うん、明日行くよ。', '博物館で。'], why: "Have you been to～ yet?＝もう行った？ には Not yet（まだ）が自然。Yes と言いながら明日行くのは矛盾。" },
  'r2-running': { cja: ['いいね、何時？', '切らしちゃった。', '昨日だったよ。'], why: 'Do you want to～?＝〜しない？ というさそい。Sure で乗るのが自然。ran out of（切らした）は running の音の罠。' },
  'r2-shirt': { cja: ['青いほう。', 'うん、好き。', '今はよくなった。'], why: 'Which（どっち）なので選んで答える。Yes/No は Which への答えにならない。better の繰り返しも罠。', ctx: '友だちと服を選んでいます' },
  'r2-lamp': { cja: ['2,000ベルです。', 'どうもありがとう。', 'テーブルの上にあるよ。'], why: 'How much＝いくら？ なので値段で答える。Very much は much の繰り返し、on the table は場所の答え。' },
  'r2-break': { cja: ['いいね。疲れたよ。', '壊れてるよ。', '昨日取ったよ。'], why: 'Should we～?＝〜しようか？ という提案。take a break＝休憩する。Good idea で乗る。broken は break の音の罠。' },
  'r2-rain': { cja: ['降りそう。傘を持っていって。', '昨日は雨だった。', 'うん、行くよ。'], why: 'Is it going to rain?＝雨が降りそう？ と予想を聞いている。I think so（そう思う）で答える。昨日の話や going の罠に注意。' },
  // reply, level 3
  'r3-snacks': { cja: ['あっ、まだかばんの中！', 'うん、あいさつしたよ。', '売店に持っていって。'], why: "Didn't you say～?＝〜って言ってなかった？ という確認。忘れていたと答えるのが自然。said hello は say の罠。" },
  'r3-coffee': { cja: ['行きたいけど、予定があるんだ。', '10時過ぎだよ。', 'もう取ったよ。'], why: "Wanna grab some coffee?＝コーヒーでもどう？ grab は「さっと〜する」。I'd love to, but… は感じのいい断り方。" },
  'r3-early': { cja: ['眠れなかったの。', '丘を上ってきた。', '6時から。'], why: 'How come～?＝どうして？（Why のくだけた形）。理由で答える。up の繰り返しや Since の答えは罠。' },
  'r3-fireworks': { cja: ['しずえさんが担当してるよ。', '無料だよ。', '8時に、ビーチで。'], why: 'in charge of＝〜の担当。Who なので人で答える。free of charge（無料）は charge の音の罠。' },
  'r3-working-out': { cja: ['わかる？ ありがとう！', '解決したよ。', 'いや、出かけてないよ。'], why: "You've been working out, haven't you?＝鍛えてるでしょ？ というほめ言葉。worked it out（解決した）は音の罠。" },
  'r3-mind': { cja: ['いいえ、どうぞ。', 'はい、座ってください。', '彼はあっちに座ってるよ。'], why: 'Do you mind if～?＝〜したら気になる？ なので、OKなら Not at all（全然）。Yes だと「嫌です」になる。', ctx: '混んだカフェで、知らない人に' },
  'r3-gym': { cja: ['いいね。5分待って。', '閉まってるからだよ。', 'うっかりぶつけちゃった。'], why: "Why don't we～?＝一緒に〜しない？ というさそいで、理由を聞いていない。Because で答えるのは罠。hit the gym＝ジムに行く。" },
  'r3-hat': { cja: ['もちろん、きぬよさんの店！', '昨日買ったよ。', '君の分も買ってくるよ。'], why: "Where'd you get～?＝どこで手に入れたの？ なので店で答える。yesterday は When への答え。" },
  'r3-monday': { cja: ['この島では違うよ。', 'うん、私が閉めた。', '博物館の近くにいるよ。'], why: "Isn't～?＝〜じゃない？ と確認する否定疑問。Not on this island（この島では休みじゃない）が自然。closer は音の罠。" },
  'r3-how-long': { cja: ['もう2年くらい。', '長い島だね。', 'ビーチの近く。'], why: 'How long have you lived～?＝住んでどのくらい？ なので期間で答える。long の繰り返しや場所の答えは罠。' },
  'r3-keep-down': { cja: ['あっ、ごめん！ うるさかった？', '取っておいてあげる。', '丘を下ったところだよ。'], why: 'keep it down＝静かにする。Could you～? は丁寧な頼みなので、謝るのが自然。keep や down の音の罠に注意。', ctx: '夜、隣の部屋の人に言われました' },
  'r3-show': { cja: ['絶対行く！', '昨夜見せてくれたね。', 'うん、来たね。'], why: "Wouldn't miss it!＝見逃すわけない（絶対行く）。show（ライブ）と showed（見せた）の音の罠に注意。", ctx: 'ミュージシャンの友だちに聞かれました' },
  'r3-rod': { cja: ['家の近くは探した？', '魚を見つけたよ。', 'うん、見つけられるよ。'], why: "I can't find～＝見つからない、という困りごと。探す場所を提案するのが自然。find や can の繰り返しは罠。" },
  'r3-picnic': { cja: ['いいね！ サンドイッチ持っていく。', '何も言ってないよ。', 'うん、拾ったよ。'], why: 'What do you say～?＝〜しない？ というさそい。say を文字どおり取る答えや、picked の音は罠。' },
  'r3-boxes': { cja: ['いいよ、どこに運ぶ？', '手が冷たいんだ。', '段ボール箱だよ。'], why: 'Mind giving me a hand?＝手を貸してくれる？ give a hand＝手伝う。hand を文字どおり取る答えは罠。' },
  'r3-late': { cja: ['ううん、今始まったところ。', 'いや、遅れてないよ。', 'バスに乗り遅れた。'], why: 'Did I miss anything?＝何か見逃した？ Nope, we just started（ちょうど始まったところ）が自然。miss の罠に注意。', ctx: '友だちの集まりに遅れて着きました' }
};

/** An item's help: HELP's, and a picture's labels as its choices' Japanese. */
const help = (id: string, type: ItemType, choices: readonly string[]): Help => ({
  ...(type === 'pic' && { cja: choices.map((k) => PIC_KANJI[k] ?? PIC_JA[k]) }), ...HELP[id]
});

/** Levels 1-3's items, by type. */
export const BANK1: readonly Item[] = [
  ...PIC.map(([lv, ...r]) => make(lv, 'pic')(r)),
  ...WORD.map(([lv, ...r]) => word(lv)(r)),
  ...NUM.flatMap(numItems),
  ...REPLY.map(([lv, ...r]) => make(lv, 'reply')(r))
];
for (const id of Object.keys(HELP)) if (!BANK1.some((it) => it.id === id)) throw new Error(`kikimimi: help for ${id}, not an item`);
