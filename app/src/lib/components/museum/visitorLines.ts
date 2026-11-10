// What the museum's visitors say (docs/design.md "The museum"), pure: a tap's line in NH's balloon, in the visitor's
// personality's voice (NH's eight), of what it's doing: looking at an exhibit (its name, the caller's: spaced kana as
// the world writes it), a new find, sitting, chatting, or the room it strolls in; never the same line twice running
// for one visitor. The world's copy: spaced kana (visitorLines.test holds every line to the world's keep-all runs).
// [ja, en] pairs, as catchLines.ts: loaded with the museum, out of the first load.
import type { Personality } from '#lib/villagers/species.ts';

export type RoomKind = 'hall' | 'bug' | 'fish' | 'sea' | 'fossil' | 'art';
export type LineContext = 'look' | 'new' | 'sit' | 'chat' | RoomKind;
export interface Line {
  /** `<personality>.<pool>.<n>`: the one before, so the next isn't it. */
  key: string;
  ja: string;
  en: string;
}
type L = readonly [ja: string, en: string];
type Pools = { look: readonly L[]; new: readonly L[]; sit: readonly L[]; chat: readonly L[]; idle: readonly L[] } & Record<RoomKind, L>;

/** Each personality's lines: `look` and `new` name the exhibit ({name}); a room's one, its kind's. */
export const LINES: Readonly<Record<Personality, Pools>> = {
  normal: {
    look: [
      ['{name}って こうして みると\nとっても きれいね', 'The {name} is so pretty\nwhen you see it up close.'],
      ['{name}… ずかんで みたのより\nずっと すてきだわ', 'This {name}… it’s even nicer\nthan in the encyclopedia.'],
      ['{name}の まえに いると\nこころが おちつくの', 'Standing by the {name}\nmakes me feel so calm.']
    ],
    new: [
      ['あら！ {name}が ふえてる！\nだれが みつけたのかしら', 'Oh! A {name}, new!\nI wonder who found it.'],
      ['あたらしい {name}ね！\nあとで みんなに おしえなきゃ', 'A new {name}!\nI must tell everyone later.']
    ],
    sit: [
      ['すこし ひとやすみ…\nここ、 しずかで すきなの', 'Just a little rest…\nI love how quiet it is here.'],
      ['すわって ながめるのも\nいいものね', 'Sitting and looking\nis nice too, isn’t it?']
    ],
    chat: [
      ['いま おしゃべり してたの\nここの はなしで もちきりよ', 'We were just chatting.\nEveryone’s talking about this place.'],
      ['ふたりで くると\nたのしさも ふたばいね', 'Coming here together\nmakes it twice the fun.']
    ],
    idle: [
      ['はくぶつかんって\nなんだか わくわくするわね', 'Museums are\nsomehow exciting, aren’t they?'],
      ['きょうは どこから\nまわろうかしら', 'Where shall I\nstart today?']
    ],
    hall: ['フータさんに あいさつ したら\nまずは どこへ いこうかしら', 'I said hello to Blathers.\nNow, where to first?'],
    bug: ['むしさんたち、 げんきそうね\nおはなも きれい', 'The bugs look so lively.\nThe flowers are lovely too.'],
    fish: ['おさかなを みてると\nじかんを わすれちゃう', 'Watching the fish,\nI lose track of time.'],
    sea: ['うみの いきものって\nふしぎな かたちが おおいのね', 'Sea creatures come in\nsuch curious shapes.'],
    fossil: ['こんなに おおきな ほねが\nむかしは あるいてたのね', 'Bones this big\nonce walked around!'],
    art: ['えを みてると\nわたしも かきたく なるわ', 'Looking at paintings\nmakes me want to paint too.']
  },
  lazy: {
    look: [
      ['{name}かぁ…\nおいしそう… じゃなくて、 きれいだな〜', 'A {name}…\nlooks tasty… I mean, pretty.'],
      ['{name}、 のんびり してるな〜\nぼくと おなじだ', 'The {name}’s so laid-back.\nJust like me.'],
      ['{name}を みてたら\nねむく なってきた…', 'Looking at the {name}\nis making me sleepy…']
    ],
    new: [
      ['あれっ、 {name}が いる〜\nきのうは いなかったよね？', 'Huh, a {name}!\nIt wasn’t here yesterday, right?'],
      ['{name}だ〜！\nなんだか とくした きぶん', 'A {name}!\nI feel lucky somehow.']
    ],
    sit: [
      ['ここ すわりごこち いいな〜\nずっと いたい…', 'This seat’s so comfy…\nI could stay forever.'],
      ['ふぁ〜…\nちょっとだけ うとうと…', 'Yawn…\njust a little doze…']
    ],
    chat: [
      ['いま おやつの はなし してたんだ\nきみも くる？', 'We were talking snacks.\nWant to join?'],
      ['のんびり おしゃべり\nさいこう だよね〜', 'A slow chat like this\nis the best.']
    ],
    idle: [
      ['あるくと おなか すくな〜', 'Walking makes me hungry…'],
      ['ここ すずしくて\nいい ところ だな〜', 'It’s nice and cool\nin here.']
    ],
    hall: ['フータさん、 さっき\nたったまま ねてたよ', 'Blathers was asleep\non his feet just now.'],
    bug: ['むしは… ちょっと にがて…\nでも おはなは すき', 'Bugs are… not my thing.\nBut I like the flowers.'],
    fish: ['さかなって いいよね〜\nみてるだけで しあわせ', 'Fish are great.\nJust watching makes me happy.'],
    sea: ['ウニって おいしいんだよ…\nあ、 みる だけ だった', 'Sea urchins are tasty…\noh, it’s just for looking.'],
    fossil: ['ほねばっかり だ〜\nおなか すいてきた', 'So many bones…\nnow I’m hungry.'],
    art: ['この え… なんだか\nおいしそうな いろ', 'This painting…\nsuch tasty colours.']
  },
  peppy: {
    look: [
      ['みて みて！ {name}！\nかわいすぎ〜！', 'Look, look! The {name}!\nIt’s too cute!'],
      ['{name}って キラキラしてる！\nアタシも まけない！', 'The {name} sparkles!\nI won’t lose to it!'],
      ['{name}と いっしょに\nしゃしん とりたい〜！', 'I want a picture\nwith the {name}!']
    ],
    new: [
      ['キャー！ {name}が きてる！\nニュース だよ！', 'Eek! A {name}’s here!\nThis is big news!'],
      ['{name}！ はつ おめみえ！\nアタシ いちばんのり〜！', 'A {name}! Its debut!\nAnd I saw it first!']
    ],
    sit: [
      ['ちょっと きゅうけい！\nすぐ また はしるよ！', 'Quick break!\nThen I’m off again!'],
      ['すわってても\nワクワクが とまらない！', 'Even sitting down,\nI can’t stop smiling!']
    ],
    chat: [
      ['いま ガールズトーク ちゅう！\nヒミツの はなし だよ', 'Girl talk in progress!\nIt’s a secret!'],
      ['おしゃべり だいすき！\nここ ネタが いっぱい！', 'I love chatting!\nSo much to talk about here!']
    ],
    idle: [
      ['きょうも いい ひ！\nアタシ ノリノリ！', 'Another great day!\nI’m in the groove!'],
      ['はくぶつかんで デート…\nなーんてね！', 'A museum date…\njust kidding!']
    ],
    hall: ['フータさん だいすき！\nはなし ながいけど！', 'I love Blathers!\nEven if he talks forever!'],
    bug: ['チョウチョ きれ〜い！\nアタシも とびたい！', 'The butterflies are pretty!\nI want to fly too!'],
    fish: ['おさかなと いっしょに\nおよぎたい〜！', 'I want to swim\nwith the fish!'],
    sea: ['ヒトデって ほしみたい！\nアイドルっぽい！', 'Starfish look like stars!\nSo idol-like!'],
    fossil: ['きょうりゅう カッコいい！\nガオー！', 'Dinosaurs are so cool!\nRoar!'],
    art: ['この え、 ステージの\nポスター みたい！', 'This painting looks like\na concert poster!']
  },
  jock: {
    look: [
      ['{name}、 いい からだ してるぜ！\nきたえてるな！', 'The {name}’s in great shape!\nIt trains, I bet!'],
      ['{name}を みてたら\nもえて きたぜ！', 'Looking at the {name}\nfires me up!'],
      ['{name}か！ オレも\nまけて られないな！', 'A {name}! I can’t\nlet it beat me!']
    ],
    new: [
      ['おっ！ {name}が ふえたな！\nナイス ゲット！', 'Whoa! A new {name}!\nNice catch!'],
      ['{name}！ あたらしい なかまだ！\nいっしょに きたえようぜ！', 'A {name}! A new buddy!\nLet’s train together!']
    ],
    sit: [
      ['きゅうけいも\nトレーニングの うち だぜ！', 'Rest is part\nof training!'],
      ['すわってても\nふっきんは つかってるぜ！', 'Even sitting,\nmy abs are working!']
    ],
    chat: [
      ['いま きんトレの はなし してた！\nアンタも どうだ？', 'We’re talking workouts!\nYou in?'],
      ['なかまと しゃべると\nげんきが でるぜ！', 'Talking with friends\npumps me up!']
    ],
    idle: [
      ['ここの ゆか、\nはしったら きもちよさそう！', 'This floor would be\ngreat for running!'],
      ['よし！ つぎの てんじまで\nダッシュ…は ダメか', 'Right! Sprint to the next\nexhibit… guess not.']
    ],
    hall: ['フータさんの つばさ、\nきたえがいが ありそうだ！', 'Blathers’ wings could\nuse some training!'],
    bug: ['カブトムシ、 ちからもち！\nオレの ライバルだ！', 'Beetles are strong!\nMy rivals!'],
    fish: ['さかなって ずっと およいでる\nすごい スタミナだぜ！', 'Fish swim all day.\nWhat stamina!'],
    sea: ['カニの ハサミ、\nにぎりょく すごそうだ！', 'That crab’s claw\nmust have a mighty grip!'],
    fossil: ['この ほね、 ふといな！\nどんな きんトレ したんだ？', 'Thick bones!\nWhat was its workout?'],
    art: ['この ちょうこく、\nいい きんにくだぜ！', 'That statue’s\ngot great muscles!']
  },
  cranky: {
    look: [
      ['ふん、 {name}か…\nまあ わるくない', 'Hmph. A {name}…\nnot bad, I suppose.'],
      ['{name}を みると\nむかしを おもいだすな', 'The {name} takes me\nback a ways.'],
      ['{name}の よさが わかるとは\nオマエも なかなかだな', 'You see what’s good\nabout the {name}? Not bad.']
    ],
    new: [
      ['ほう、 {name}が はいったか\nやるじゃねえか', 'Huh, a {name} came in.\nNot bad work.'],
      ['{name}… しんいりだな\nしっかり みておけよ', 'A {name}… new here.\nTake a good look.']
    ],
    sit: [
      ['ここは オレの せきだ…\nなんてな', 'This is my seat…\nkidding.'],
      ['すわって しずかに みる\nそれが おとなの たのしみかただ', 'Sit and look quietly.\nThat’s how grown-ups do it.']
    ],
    chat: [
      ['なんだ、 はなしに まざりたいのか\nまあ いいだろう', 'What, want to join in?\nFine, I guess.'],
      ['むかしばなしを してたんだ\nながく なるぞ', 'We were talking old times.\nIt’s a long story.']
    ],
    idle: [
      ['さわがしいのは にがてだが\nここは しずかで いい', 'I hate noise,\nbut it’s quiet here.'],
      ['ふん… たまには\nこういうのも わるくない', 'Hmph… once in a while,\nthis isn’t bad.']
    ],
    hall: ['あの フクロウ、\nはなしが ながくて かなわん', 'That owl talks\nfar too long.'],
    bug: ['むしなんぞ…\nいや、 この チョウは みごとだ', 'Bugs, bah…\nwell, that butterfly’s fine.'],
    fish: ['さかなは だまって およぐ\nそこが いい', 'Fish swim and keep quiet.\nThat’s what I like.'],
    sea: ['タコか… めが あったな\nにらみかえして やった', 'An octopus… it stared,\nso I stared back.'],
    fossil: ['ほねに なっても\nこの はくりょく… すごいな', 'Just bones,\nand still that power…'],
    art: ['げいじゅつは わからんが\nこの え は きにいった', 'I don’t get art,\nbut I like this one.']
  },
  snooty: {
    look: [
      ['{name}… ふうん、\nアタクシに にあう いろね', 'The {name}… hm,\na colour that suits me.'],
      ['{name}の うつくしさが わかるのは\nアタクシくらいよ', 'Only I can truly see\nthe {name}’s beauty.'],
      ['{name}って エレガントね\nみならいたいわ', 'The {name} is so elegant.\nI should learn from it.']
    ],
    new: [
      ['あら、 {name}が はいったのね\nセンスが いいわ', 'Oh, a {name} came in.\nGood taste.'],
      ['{name}… しんさく かしら？\nチェックしなくちゃ', 'A {name}… new arrival?\nI must take a look.']
    ],
    sit: [
      ['すわる ときも\nしせいは うつくしく、 よ', 'Even seated,\nposture is everything.'],
      ['ここで ティータイム…\nできたら いいのに', 'Tea time here…\nif only.']
    ],
    chat: [
      ['いま おしゃれの はなしを\nしていたの', 'We were talking\nfashion.'],
      ['アタクシたちの はなし、\nききたいの？ うふふ', 'Want to hear\nour little talk? Hoho.']
    ],
    idle: [
      ['ここに くると\nきぶんが あがるわ', 'This place lifts\nmy mood.'],
      ['きょうの ふく、\nこの へやに ぴったりでしょ？', 'My outfit today\nsuits this room, doesn’t it?']
    ],
    hall: ['この ホール、 ひろくて\nアタクシに ふさわしいわ', 'This hall is grand,\nfit for me.'],
    bug: ['むしは… ちょっと…\nでも この ガラスの へやは すてき', 'Bugs… well…\nbut this glass room is lovely.'],
    fish: ['すいそうの ひかり…\nまるで ほうせきね', 'The light in the tanks…\nlike jewels.'],
    sea: ['しんじゅの ような\nかがやきね', 'A glow like\npearls.'],
    fossil: ['ほねは しゅみじゃ ないけど\nこの スケールは みとめるわ', 'Bones aren’t my taste,\nbut the scale is something.'],
    art: ['ほんものの げいじゅつ…\nアタクシ むきね', 'Real art…\njust my thing.']
  },
  smug: {
    look: [
      ['{name}か… ボクの つぎに\nうつくしいね', 'A {name}… the most beautiful,\nafter me.'],
      ['{name}の よさを わかるなんて\nキミ、 センス あるね', 'You see the {name}’s charm?\nYou’ve got taste.'],
      ['{name}を ながめる ボク…\nこれも げいじゅつ さ', 'Me, gazing at the {name}…\nthat’s art too.']
    ],
    new: [
      ['おや、 {name}が しんいりかい\nようこそ', 'Oh, a {name}, new here?\nWelcome.'],
      ['{name}の デビューに\nたちあえて こうえいだよ', 'An honour to see\nthe {name}’s debut.']
    ],
    sit: [
      ['すわる ボクも\nえに なる だろう？', 'Even seated,\nI’m a picture, no?'],
      ['ここで ひとやすみ\nゆうがに ね', 'A little rest here.\nElegantly.']
    ],
    chat: [
      ['いま げいじゅつろんを\nかたりあって いたのさ', 'We were discussing\nthe theory of art.'],
      ['キミも はなしに まざるかい？\nかんげい するよ', 'Care to join us?\nYou’re welcome.']
    ],
    idle: [
      ['はくぶつかんは\nボクに にあう ばしょ だね', 'A museum suits me,\ndon’t you think?'],
      ['ちしきは\nこころの おしゃれ さ', 'Knowledge is fashion\nfor the heart.']
    ],
    hall: ['フータくんの はなしは\nいつも ためになるね', 'Blathers’ talks\nare always enlightening.'],
    bug: ['この チョウの もよう…\nまるで ドレスの ようだ', 'This butterfly’s pattern…\nlike a gown.'],
    fish: ['およぐ すがたの うつくしさ\nボクも まけないよ', 'Such grace in the water.\nI can match it.'],
    sea: ['しんかいの いきもの…\nミステリアスで いいね', 'Creatures of the deep…\nso mysterious.'],
    fossil: ['とおい むかしの ロマンを\nかんじるね', 'I feel the romance\nof ages past.'],
    art: ['この ふでづかい…\nボクには わかるよ', 'This brushwork…\nI understand it.']
  },
  sisterly: {
    look: [
      ['{name}、 なかなか やるじゃん\nアタイ きにいったよ', 'The {name}’s pretty cool.\nI like it.'],
      ['{name}って こんなだったんだ\nしらなかったよ', 'So that’s what a {name}\nlooks like. Who knew?'],
      ['{name}の まえ、\nアタイの とくとうせき だよ', 'This spot by the {name}\nis my best seat.']
    ],
    new: [
      ['おっ、 {name}が ふえてる！\nだれだい、 みつけたのは', 'Hey, a new {name}!\nWho found it?'],
      ['{name}か！ いい しごと したね\nほめて やるよ', 'A {name}! Nice work.\nI’ll give you that.']
    ],
    sit: [
      ['ちょっと すわりなよ\nあるきっぱなしは つかれるよ', 'Take a seat.\nAll that walking’s tiring.'],
      ['ここで ひとやすみ\nアタイ、 けっこう すきなんだ', 'A break here.\nI kinda like it.']
    ],
    chat: [
      ['いま なやみ そうだん\nうけてたとこ だよ', 'I was just giving\nsome advice.'],
      ['アンタも はなし ききなよ\nおもしろいから', 'Come listen too.\nIt’s a good one.']
    ],
    idle: [
      ['アンタ、 ちゃんと\nごはん たべてるかい？', 'You eating properly?\nHuh?'],
      ['たまには こういう ところも\nいいもんだね', 'A place like this\nis nice now and then.']
    ],
    hall: ['フータの やつ、\nまた いねむり してたよ', 'That Blathers\nwas dozing again.'],
    bug: ['むしなんて へっちゃら！\nアタイに まかせな', 'Bugs don’t scare me!\nLeave ’em to me.'],
    fish: ['さかな みてると\nつりに いきたく なるね', 'Watching fish makes me\nwant to go fishing.'],
    sea: ['ウツボ、 こわい かお だけど\nいい やつ そうだね', 'That eel looks scary,\nbut it seems nice.'],
    fossil: ['こんな でかいのが いたなんて\nアタイも びっくり だよ', 'Something this huge lived?\nEven I’m surprised.'],
    art: ['えは よく わかんないけど\nこれは いいね', 'Don’t know much about art,\nbut this is good.']
  }
};

/** The pools a context draws from (each two lines at least, so a line never comes twice running). */
const POOLS: Record<LineContext, readonly (keyof Pools | 'room')[]> = {
  look: ['look', 'room'], new: ['new', 'look'], sit: ['sit', 'idle'], chat: ['chat', 'idle'],
  hall: ['room', 'idle'], bug: ['room', 'idle'], fish: ['room', 'idle'], sea: ['room', 'idle'], fossil: ['room', 'idle'], art: ['room', 'idle']
};

/** A visitor's line in `ctx` (`last`: its line before, never again at once): `name` the exhibit's for `look` and
 *  `new` (none: the room's lines instead), `room` the room it's in. */
export function visitorLine(p: Personality, ctx: LineContext, r: () => number, last?: string, name?: { ja: string; en: string }, room: RoomKind = 'hall'): Line {
  const c: LineContext = (ctx === 'look' || ctx === 'new') && !name ? room : ctx;
  const all: Line[] = [];
  for (const pool of POOLS[c]) {
    const kind = pool === 'room' ? (c === 'look' || c === 'new' ? room : (c as RoomKind)) : pool;
    const ls = LINES[p][kind];
    const list: readonly L[] = typeof ls[0] === 'string' ? [ls as L] : (ls as readonly L[]);
    list.forEach(([ja, en], i) => all.push({ key: `${p}.${kind}.${i}`, ja: ja.replace('{name}', name?.ja ?? ''), en: en.replace('{name}', name?.en ?? '') }));
  }
  const fresh = all.filter((l) => l.key !== last);
  return fresh[Math.floor(r() * fresh.length)] ?? all[0];
}
